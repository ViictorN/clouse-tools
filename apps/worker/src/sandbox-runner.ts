import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { AppError, createLogger, getAppConfig } from '@clouse/core';
import { executeServerToolBySlug } from '@clouse/tool-sdk';
import {
  getPlatformDataStore,
  type PlatformDataStore,
  type ProcessingJobRecord,
} from '@clouse/data';

const execFileAsync = promisify(execFile);
const ALLOWED_SUBPROCESS_BINARIES = new Set(['ffmpeg', 'ffprobe']);

/**
 * Hardened Subprocess Runner (PDF 2 Domain 02 t4, Domain 10 t2/t3, Domain 14 t6)
 * - Strictly uses execFile with `shell: false` (ZERO command shell interpolation)
 * - Strips all process.env secrets (passes ONLY minimal PATH + isolated TMPDIR)
 * - Enforces hard timeout and stdout/stderr maxBuffer cap
 */
export async function runIsolatedMediaBinary(options: {
  binaryName: 'ffmpeg' | 'ffprobe';
  args: string[];
  sandboxDir: string;
  timeoutMs?: number;
}): Promise<{ stdout: string; stderr: string }> {
  if (!ALLOWED_SUBPROCESS_BINARIES.has(options.binaryName)) {
    throw AppError.forbidden('SUBPROCESS_BINARY_FORBIDDEN', 'Subprocess binary is not allowlisted.');
  }
  for (const arg of options.args) {
    if (typeof arg !== 'string' || arg.includes('\0') || arg.length > 512) {
      throw AppError.badRequest('SUBPROCESS_INVALID_ARG', 'Invalid subprocess argument rejected.');
    }
  }

  const cfg = getAppConfig();
  const executable =
    options.binaryName === 'ffmpeg' ? cfg.FFMPEG_BINARY_PATH : cfg.FFPROBE_BINARY_PATH;

  const cleanEnv: NodeJS.ProcessEnv = {
    NODE_ENV: cfg.NODE_ENV === 'staging' ? 'production' : cfg.NODE_ENV,
    PATH: process.env.PATH ?? '',
    TMP: options.sandboxDir,
    TEMP: options.sandboxDir,
    TMPDIR: options.sandboxDir,
  };

  return execFileAsync(executable, options.args, {
    cwd: options.sandboxDir,
    env: cleanEnv,
    shell: false,
    windowsHide: true,
    timeout: Math.min(options.timeoutMs ?? 10_000, 60_000),
    maxBuffer: 1024 * 1024, // 1 MiB strict stdio cap
  });
}

export interface WorkerTickResult {
  processed: boolean;
  job?: ProcessingJobRecord;
  sandboxCleanedUp: boolean;
}

export async function processNextQueuedJobOnce(options: {
  workerId: string;
  store?: PlatformDataStore;
}): Promise<WorkerTickResult> {
  const store = options.store ?? getPlatformDataStore();
  const logger = createLogger('clouse-sandbox-worker');
  const claimed = store.claimNextQueuedJob(options.workerId, 30);

  if (!claimed) {
    return { processed: false, sandboxCleanedUp: true };
  }

  let sandboxDir: string | null = null;
  let sandboxCleanedUp = false;

  try {
    sandboxDir = await mkdtemp(path.join(os.tmpdir(), 'clouse-sandbox-'));
    const memBefore = Math.round(process.memoryUsage().rss / (1024 * 1024));

    const result = await executeServerToolBySlug(claimed.toolSlug, claimed.inputPayload, {
      correlationId: claimed.correlationId,
      sandboxDir,
      actor: {
        userId: claimed.ownerId,
        accountId: null,
        role: claimed.ownerId ? 'user' : 'anonymous',
        plan: 'free',
        actorKey: claimed.actorKey,
        scopes: ['tools:execute'],
      },
    });

    const memAfter = Math.round(process.memoryUsage().rss / (1024 * 1024));
    const completed = store.completeClaimedJob(claimed.id, options.workerId, result.output, {
      cpuUsedMs: result.durationMs,
      memoryPeakMb: Math.max(memBefore, memAfter),
    });

    await store.appendAuditLog({
      correlationId: claimed.correlationId,
      actorId: claimed.ownerId,
      actorRole: claimed.ownerId ? 'user' : 'anonymous',
      ipHmac: null,
      eventCategory: 'job',
      action: 'worker.job_succeeded',
      targetType: 'processing_job',
      targetId: claimed.id,
      outcome: 'success',
      context: { toolSlug: claimed.toolSlug, durationMs: result.durationMs },
    });

    return { processed: true, job: completed, sandboxCleanedUp: true };
  } catch (err) {
    const isDeterministicSecurityBlock =
      err instanceof AppError && err.statusCode >= 400 && err.statusCode < 500;
    const errCode = err instanceof AppError ? err.code : 'WORKER_RUNTIME_ERROR';
    const errMsg =
      err instanceof AppError
        ? err.message
        : 'Sandbox execution failed safely without leaking internal details.';

    const updated = store.failOrDeadLetterJob(
      claimed.id,
      errCode,
      errMsg,
      isDeterministicSecurityBlock
    );

    logger.warn('worker.job_failed', {
      correlationId: claimed.correlationId,
      jobId: claimed.id,
      toolSlug: claimed.toolSlug,
      status: updated.status,
      errorCode: errCode,
    });

    return { processed: true, job: updated, sandboxCleanedUp: true };
  } finally {
    if (sandboxDir) {
      await rm(sandboxDir, { recursive: true, force: true }).catch(() => undefined);
      sandboxCleanedUp = true;
    }
  }
}
