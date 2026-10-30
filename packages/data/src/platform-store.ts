import { randomUUID } from 'node:crypto';
import {
  AppError,
  getAppConfig,
  getEngineeringVerifications2000,
  getSecurityBestPractices500,
  redactPiiAndSecrets,
  type ControlPriority,
  type EngineeringCheckStatus,
  type EngineeringVerificationItem,
  type SecurityBestPracticeItem,
  type SecurityPracticeStatus,
} from '@clouse/core';
import {
  assertAdminMutationAccess,
  assertObjectOwnership,
  buildIsolatedStorageKey,
  sha256Hex,
  verifyUploadedFile,
  type AppRole,
  type AuthenticatedActor,
} from '@clouse/security';
import { getToolManifestBySlug, getUnifiedToolCatalog } from '@clouse/tool-sdk';
import { createServiceRoleSupabaseClient } from './supabase-clients';

export interface StoredFileArtifact {
  id: string;
  ownerId: string | null;
  actorKey: string;
  bucketId: 'uploads-quarantine' | 'processed-artifacts';
  storageKey: string;
  originalFilenameSafe: string;
  declaredMime: string;
  verifiedMime: string;
  sizeBytes: number;
  sha256Hex: string;
  scanStatus: 'pending' | 'clean' | 'quarantined' | 'rejected';
  expiresAt: string;
  deletedAt: string | null;
  correlationId: string;
  createdAt: string;
}

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'dead_letter' | 'cancelled';

export interface ProcessingJobRecord {
  id: string;
  actorKey: string;
  ownerId: string | null;
  toolSlug: string;
  idempotencyKey: string;
  status: JobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  nextRunAt: string;
  lockedBy: string | null;
  lockedUntil: string | null;
  timeoutMs: number;
  inputPayload: Record<string, unknown>;
  resultPayload: unknown | null;
  inputArtifactId: string | null;
  outputArtifactId: string | null;
  cpuUsedMs: number;
  memoryPeakMb: number;
  costUnits: number;
  errorCode: string | null;
  errorMessageSafe: string | null;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface DeadLetterJobRecord {
  id: string;
  originalJobId: string;
  toolSlug: string;
  actorKey: string;
  attempts: number;
  errorCode: string;
  errorMessageSafe: string;
  correlationId: string;
  createdAt: string;
}

export interface AuditLogEntry {
  seq: number;
  id: string;
  correlationId: string;
  actorId: string | null;
  actorRole: AppRole;
  ipHmac: string | null;
  eventCategory: 'auth' | 'authz' | 'upload' | 'tool' | 'job' | 'lgpd' | 'billing' | 'admin' | 'security' | 'compliance';
  action: string;
  targetType: string;
  targetId: string | null;
  outcome: 'success' | 'allow' | 'deny' | 'error';
  redactedContext: Record<string, unknown>;
  prevHash: string;
  entryHash: string;
  createdAt: string;
}

export interface LgpdConsentRecord {
  id: string;
  userId: string;
  purpose: 'essential_service' | 'cloud_processing' | 'billing' | 'product_updates';
  legalBasis: 'consent' | 'contract_execution' | 'legal_obligation' | 'legitimate_interest';
  policyVersion: string;
  granted: boolean;
  ipHmac: string;
  createdAt: string;
}

export interface LgpdDataRequestRecord {
  id: string;
  userId: string | null;
  requesterEmailHash: string;
  requestType: 'export' | 'erasure' | 'rectification' | 'anonymization' | 'confirmation';
  status: 'pending' | 'processing' | 'completed' | 'rejected_legal_hold';
  slaDueAt: string;
  completedAt: string | null;
  correlationId: string;
  createdAt: string;
}

export class PlatformDataStore {
  private readonly artifacts = new Map<string, { meta: StoredFileArtifact; bytes: Buffer | null }>();
  private readonly jobs = new Map<string, ProcessingJobRecord>();
  private readonly idempotencyIndex = new Map<string, string>();
  private readonly deadLetters = new Map<string, DeadLetterJobRecord>();
  private readonly rateLimits = new Map<string, { count: number; resetAtMs: number }>();
  private readonly dailyQuotas = new Map<
    string,
    { jobs: number; cpuMs: number; bytesUploaded: number; costUnits: number }
  >();
  private readonly cache = new Map<string, { value: unknown; expiresAtMs: number }>();
  private readonly auditLogs: AuditLogEntry[] = [];
  private readonly consents: LgpdConsentRecord[] = [];
  private readonly lgpdRequests: LgpdDataRequestRecord[] = [];
  private readonly processedWebhookEvents = new Set<string>();
  private readonly engineeringOverrides = new Map<string, EngineeringCheckStatus>();
  private readonly securityOverrides = new Map<string, SecurityPracticeStatus>();

  // ---------------------------------------------------------------------------
  // 1. Distributed / Hybrid Rate Limiting & Daily Quotas
  // ---------------------------------------------------------------------------
  public async consumeRateLimit(
    bucketKey: string,
    windowSeconds: number,
    maxRequests: number
  ): Promise<{ allowed: boolean; currentCount: number; resetAt: string }> {
    const svc = createServiceRoleSupabaseClient();
    if (svc) {
      const { data, error } = await svc.rpc('consume_rate_limit', {
        p_bucket_key: bucketKey,
        p_window_seconds: windowSeconds,
        p_max_requests: maxRequests,
      });
      if (!error && Array.isArray(data) && data[0]) {
        return {
          allowed: Boolean(data[0].allowed),
          currentCount: Number(data[0].current_count),
          resetAt: String(data[0].reset_at),
        };
      }
    }

    const nowMs = Date.now();
    const windowMs = Math.max(1000, windowSeconds * 1000);
    const windowStartMs = nowMs - (nowMs % windowMs);
    const resetAtMs = windowStartMs + windowMs;
    const compositeKey = `${bucketKey}:${windowStartMs}`;

    const existing = this.rateLimits.get(compositeKey);
    const nextCount = (existing?.count ?? 0) + 1;
    this.rateLimits.set(compositeKey, { count: nextCount, resetAtMs });

    return {
      allowed: nextCount <= maxRequests,
      currentCount: nextCount,
      resetAt: new Date(resetAtMs).toISOString(),
    };
  }

  public assertAndConsumeQuota(
    actor: AuthenticatedActor,
    delta: { jobs?: number; cpuMs?: number; bytesUploaded?: number; costUnits?: number }
  ): void {
    const cfg = getAppConfig();
    const dateKey = new Date().toISOString().slice(0, 10);
    const key = `${actor.actorKey}:${dateKey}`;
    const current = this.dailyQuotas.get(key) ?? {
      jobs: 0,
      cpuMs: 0,
      bytesUploaded: 0,
      costUnits: 0,
    };

    const planMultiplier = actor.plan === 'enterprise' ? 20 : actor.plan === 'pro' ? 5 : 1;
    const maxJobs = 100 * planMultiplier;
    const maxCpuMs = 300_000 * planMultiplier;
    const maxStorage = cfg.MAX_USER_STORAGE_QUOTA_BYTES * planMultiplier;

    const nextJobs = current.jobs + (delta.jobs ?? 0);
    const nextCpu = current.cpuMs + (delta.cpuMs ?? 0);
    const nextBytes = current.bytesUploaded + (delta.bytesUploaded ?? 0);
    const nextCost = current.costUnits + (delta.costUnits ?? 0);

    if (nextJobs > maxJobs) {
      throw AppError.rateLimited('DAILY_JOB_QUOTA_EXCEEDED', 'Daily processing job quota reached for account.');
    }
    if (nextCpu > maxCpuMs) {
      throw AppError.rateLimited('DAILY_CPU_QUOTA_EXCEEDED', 'Daily CPU budget reached for account.');
    }
    if (nextBytes > maxStorage) {
      throw AppError.payloadTooLarge(
        'USER_STORAGE_QUOTA_EXCEEDED',
        'Total user upload storage quota reached.'
      );
    }

    this.dailyQuotas.set(key, {
      jobs: nextJobs,
      cpuMs: nextCpu,
      bytesUploaded: nextBytes,
      costUnits: nextCost,
    });
  }

  // ---------------------------------------------------------------------------
  // 2. Pluggable Cache (Upstash Redis REST or Local/Postgres TTL Fallback)
  // ---------------------------------------------------------------------------
  public async cacheGet<T>(key: string): Promise<T | null> {
    const cfg = getAppConfig();
    if (cfg.hasUpstashRedis) {
      try {
        const res = await fetch(`${cfg.UPSTASH_REDIS_REST_URL}/get/${encodeURIComponent(key)}`, {
          headers: { Authorization: `Bearer ${cfg.UPSTASH_REDIS_REST_TOKEN}` },
          signal: AbortSignal.timeout(1500),
        });
        if (res.ok) {
          const json = (await res.json()) as { result?: string | null };
          if (json.result) return JSON.parse(json.result) as T;
        }
      } catch {
        // Safe fallback to local cache
      }
    }
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (entry.expiresAtMs <= Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  public async cacheSet(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    const cfg = getAppConfig();
    this.cache.set(key, {
      value,
      expiresAtMs: Date.now() + Math.max(1, ttlSeconds) * 1000,
    });

    if (cfg.hasUpstashRedis) {
      try {
        await fetch(
          `${cfg.UPSTASH_REDIS_REST_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(
            JSON.stringify(value)
          )}?EX=${Math.max(1, ttlSeconds)}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${cfg.UPSTASH_REDIS_REST_TOKEN}` },
            signal: AbortSignal.timeout(1500),
          }
        );
      } catch {
        // Non-fatal cache write failure
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Quarantine Uploads, Random Storage Keys, Authorized Downloads & Reaper
  // ---------------------------------------------------------------------------
  public async storeQuarantinedUpload(options: {
    actor: AuthenticatedActor;
    filename: string;
    declaredMime: string;
    bytes: Buffer;
    correlationId: string;
    ttlSeconds?: number;
  }): Promise<StoredFileArtifact> {
    const cfg = getAppConfig();
    const verified = verifyUploadedFile({
      filename: options.filename,
      declaredMime: options.declaredMime,
      bytes: options.bytes,
      maxBytes: cfg.MAX_UPLOAD_FILE_BYTES,
    });

    this.assertAndConsumeQuota(options.actor, { bytesUploaded: verified.sizeBytes });

    const actorFolder = options.actor.userId ?? options.actor.actorKey.replace(':', '-');
    const storageKey = buildIsolatedStorageKey(actorFolder, verified.extension);
    const ttl = options.ttlSeconds ?? cfg.ARTIFACT_TTL_SECONDS;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000).toISOString();

    const meta: StoredFileArtifact = {
      id: randomUUID(),
      ownerId: options.actor.userId,
      actorKey: options.actor.actorKey,
      bucketId: 'uploads-quarantine',
      storageKey,
      originalFilenameSafe: verified.safeFilename,
      declaredMime: options.declaredMime || verified.verifiedMime,
      verifiedMime: verified.verifiedMime,
      sizeBytes: verified.sizeBytes,
      sha256Hex: verified.sha256Hex,
      scanStatus: 'clean',
      expiresAt,
      deletedAt: null,
      correlationId: options.correlationId,
      createdAt: now.toISOString(),
    };

    const svc = createServiceRoleSupabaseClient();
    if (svc) {
      await svc.storage.from(meta.bucketId).upload(meta.storageKey, options.bytes, {
        contentType: meta.verifiedMime,
        upsert: false,
      });
      await svc.from('file_artifacts').insert({
        id: meta.id,
        owner_id: meta.ownerId,
        bucket_id: meta.bucketId,
        storage_key: meta.storageKey,
        original_filename_safe: meta.originalFilenameSafe,
        declared_mime: meta.declaredMime,
        verified_mime: meta.verifiedMime,
        size_bytes: meta.sizeBytes,
        sha256_hex: meta.sha256Hex,
        scan_status: meta.scanStatus,
        expires_at: meta.expiresAt,
        correlation_id: meta.correlationId,
      });
    }

    this.artifacts.set(meta.id, { meta, bytes: Buffer.from(options.bytes) });

    await this.appendAuditLog({
      correlationId: options.correlationId,
      actorId: options.actor.userId,
      actorRole: options.actor.role,
      ipHmac: null,
      eventCategory: 'upload',
      action: 'upload.quarantine_stored',
      targetType: 'file_artifact',
      targetId: meta.id,
      outcome: 'success',
      context: {
        verifiedMime: meta.verifiedMime,
        sizeBytes: meta.sizeBytes,
        sha256Hex: meta.sha256Hex,
        expiresAt: meta.expiresAt,
      },
    });

    return meta;
  }

  public async getAuthorizedArtifactDownload(
    artifactId: string,
    actor: AuthenticatedActor,
    correlationId: string
  ): Promise<{ meta: StoredFileArtifact; signedDownloadUrl?: string; base64Content?: string }> {
    const record = this.artifacts.get(artifactId);
    if (!record || record.meta.deletedAt) {
      throw AppError.notFound('ARTIFACT_NOT_FOUND', 'File artifact not found or already purged.');
    }
    if (Date.parse(record.meta.expiresAt) <= Date.now()) {
      record.meta.deletedAt = new Date().toISOString();
      record.bytes = null;
      throw AppError.notFound('ARTIFACT_EXPIRED', 'Temporary file artifact has expired and was removed.');
    }

    // Strict BOLA / IDOR object ownership verification
    assertObjectOwnership(actor, record.meta.ownerId, { allowAdmin: true });

    const svc = createServiceRoleSupabaseClient();
    if (svc) {
      const { data } = await svc.storage
        .from(record.meta.bucketId)
        .createSignedUrl(record.meta.storageKey, 60, {
          download: record.meta.originalFilenameSafe,
        });
      if (data?.signedUrl) {
        return { meta: record.meta, signedDownloadUrl: data.signedUrl };
      }
    }

    await this.appendAuditLog({
      correlationId,
      actorId: actor.userId,
      actorRole: actor.role,
      ipHmac: null,
      eventCategory: 'upload',
      action: 'upload.authorized_download',
      targetType: 'file_artifact',
      targetId: artifactId,
      outcome: 'allow',
      context: { storageKey: record.meta.storageKey },
    });

    return {
      meta: record.meta,
      base64Content: record.bytes ? record.bytes.toString('base64') : undefined,
    };
  }

  public async reapExpiredArtifacts(): Promise<number> {
    const now = Date.now();
    let purgedCount = 0;
    for (const [, entry] of this.artifacts.entries()) {
      if (!entry.meta.deletedAt && Date.parse(entry.meta.expiresAt) <= now) {
        entry.meta.deletedAt = new Date(now).toISOString();
        entry.bytes = null;
        purgedCount += 1;
      }
    }
    const svc = createServiceRoleSupabaseClient();
    if (svc) {
      const { data } = await svc.rpc('reap_expired_artifacts', { p_batch_size: 100 });
      if (Array.isArray(data) && data.length > 0) {
        for (const item of data) {
          await svc.storage.from(item.bucket_id).remove([item.storage_key]);
        }
        purgedCount = Math.max(purgedCount, data.length);
      }
    }
    return purgedCount;
  }

  // ---------------------------------------------------------------------------
  // 4. Durable Job Queue, Idempotency, Lease Claiming & Dead-Letter Queue
  // ---------------------------------------------------------------------------
  public async enqueueJob(options: {
    actor: AuthenticatedActor;
    toolSlug: string;
    idempotencyKey: string;
    inputPayload: Record<string, unknown>;
    inputArtifactId?: string | null;
    priority?: number;
    maxAttempts?: number;
    correlationId: string;
  }): Promise<{ job: ProcessingJobRecord; deduplicated: boolean }> {
    const manifest = getToolManifestBySlug(options.toolSlug);
    if (!manifest || !manifest.enabled) {
      throw AppError.notFound('TOOL_NOT_FOUND', `Tool "${options.toolSlug}" is not available.`);
    }
    if (manifest.executionMode === 'client') {
      throw AppError.badRequest(
        'CLIENT_SIDE_ONLY_TOOL',
        `Tool "${options.toolSlug}" runs in the browser and does not queue server jobs.`
      );
    }

    const cleanIdem = options.idempotencyKey.trim();
    if (cleanIdem.length < 8 || cleanIdem.length > 128) {
      throw AppError.badRequest(
        'INVALID_IDEMPOTENCY_KEY',
        'Idempotency-Key must be between 8 and 128 characters.'
      );
    }

    const idemComposite = `${options.actor.actorKey}:${options.toolSlug}:${cleanIdem}`;
    const existingId = this.idempotencyIndex.get(idemComposite);
    if (existingId) {
      const existingJob = this.jobs.get(existingId);
      if (existingJob) {
        return { job: existingJob, deduplicated: true };
      }
    }

    this.assertAndConsumeQuota(options.actor, {
      jobs: 1,
      costUnits: manifest.costUnits,
    });

    const now = new Date();
    const defaultPriority =
      options.actor.plan === 'enterprise' ? 20 : options.actor.plan === 'pro' ? 10 : 0;

    const job: ProcessingJobRecord = {
      id: randomUUID(),
      actorKey: options.actor.actorKey,
      ownerId: options.actor.userId,
      toolSlug: options.toolSlug,
      idempotencyKey: cleanIdem,
      status: 'queued',
      priority: Math.min(100, Math.max(-10, options.priority ?? defaultPriority)),
      attempts: 0,
      maxAttempts: Math.min(10, Math.max(1, options.maxAttempts ?? 3)),
      nextRunAt: now.toISOString(),
      lockedBy: null,
      lockedUntil: null,
      timeoutMs: manifest.timeoutMs,
      inputPayload: options.inputPayload,
      resultPayload: null,
      inputArtifactId: options.inputArtifactId ?? null,
      outputArtifactId: null,
      cpuUsedMs: 0,
      memoryPeakMb: 0,
      costUnits: manifest.costUnits,
      errorCode: null,
      errorMessageSafe: null,
      correlationId: options.correlationId,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 3600_000).toISOString(),
    };

    this.jobs.set(job.id, job);
    this.idempotencyIndex.set(idemComposite, job.id);

    await this.appendAuditLog({
      correlationId: options.correlationId,
      actorId: options.actor.userId,
      actorRole: options.actor.role,
      ipHmac: null,
      eventCategory: 'job',
      action: 'job.enqueued',
      targetType: 'processing_job',
      targetId: job.id,
      outcome: 'success',
      context: { toolSlug: job.toolSlug, priority: job.priority },
    });

    return { job, deduplicated: false };
  }

  public getJobAuthorized(jobId: string, actor: AuthenticatedActor): ProcessingJobRecord {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw AppError.notFound('JOB_NOT_FOUND', 'Processing job not found.');
    }
    if (job.ownerId) {
      assertObjectOwnership(actor, job.ownerId, { allowAdmin: true, allowSupportRead: true });
    } else if (actor.role !== 'admin' && actor.actorKey !== job.actorKey) {
      throw AppError.forbidden('BOLA_OWNERSHIP_DENIED', 'Access to another caller job is denied.');
    }
    return job;
  }

  public claimNextQueuedJob(workerId: string, leaseSeconds = 30): ProcessingJobRecord | null {
    const nowMs = Date.now();
    const candidates = Array.from(this.jobs.values())
      .filter((j) => {
        const runnableQueued = j.status === 'queued' && Date.parse(j.nextRunAt) <= nowMs;
        const expiredLease =
          j.status === 'running' && j.lockedUntil !== null && Date.parse(j.lockedUntil) < nowMs;
        return (
          (runnableQueued || expiredLease) &&
          j.attempts < j.maxAttempts &&
          Date.parse(j.expiresAt) > nowMs
        );
      })
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return Date.parse(a.nextRunAt) - Date.parse(b.nextRunAt);
      });

    const selected = candidates[0];
    if (!selected) return null;

    selected.status = 'running';
    selected.attempts += 1;
    selected.lockedBy = workerId;
    selected.lockedUntil = new Date(nowMs + Math.max(5, leaseSeconds) * 1000).toISOString();
    selected.updatedAt = new Date(nowMs).toISOString();
    return selected;
  }

  public completeClaimedJob(
    jobId: string,
    workerId: string,
    resultPayload: unknown,
    metrics: { cpuUsedMs: number; memoryPeakMb: number }
  ): ProcessingJobRecord {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw AppError.notFound('JOB_NOT_FOUND', 'Job not found.');
    }
    if (job.lockedBy && job.lockedBy !== workerId) {
      throw AppError.forbidden('JOB_LEASE_MISMATCH', 'Worker lease mismatch.');
    }
    job.status = 'succeeded';
    job.resultPayload = resultPayload;
    job.cpuUsedMs = Math.max(0, metrics.cpuUsedMs);
    job.memoryPeakMb = Math.max(0, metrics.memoryPeakMb);
    job.lockedBy = null;
    job.lockedUntil = null;
    job.updatedAt = new Date().toISOString();
    return job;
  }

  public failOrDeadLetterJob(
    jobId: string,
    errorCode: string,
    errorMessageSafe: string,
    forceDlq = false
  ): ProcessingJobRecord {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw AppError.notFound('JOB_NOT_FOUND', 'Job not found.');
    }

    const toDlq = forceDlq || job.attempts >= job.maxAttempts;
    const now = new Date();
    job.lockedBy = null;
    job.lockedUntil = null;
    job.errorCode = errorCode.slice(0, 80);
    job.errorMessageSafe = errorMessageSafe.slice(0, 500);
    job.updatedAt = now.toISOString();

    if (toDlq) {
      job.status = 'dead_letter';
      this.deadLetters.set(job.id, {
        id: randomUUID(),
        originalJobId: job.id,
        toolSlug: job.toolSlug,
        actorKey: job.actorKey,
        attempts: job.attempts,
        errorCode: job.errorCode,
        errorMessageSafe: job.errorMessageSafe,
        correlationId: job.correlationId,
        createdAt: now.toISOString(),
      });
    } else {
      job.status = 'queued';
      const backoffSec = Math.min(300, 2 ** Math.max(1, job.attempts));
      job.nextRunAt = new Date(now.getTime() + backoffSec * 1000).toISOString();
    }

    return job;
  }

  public getDeadLetterJobs(actor: AuthenticatedActor): DeadLetterJobRecord[] {
    assertAdminMutationAccess(actor);
    return Array.from(this.deadLetters.values());
  }

  // ---------------------------------------------------------------------------
  // 5. Append-Only Cryptographic Hash-Chained Audit Ledger
  // ---------------------------------------------------------------------------
  public async appendAuditLog(params: {
    correlationId: string;
    actorId: string | null;
    actorRole: AppRole;
    ipHmac: string | null;
    eventCategory: AuditLogEntry['eventCategory'];
    action: string;
    targetType: string;
    targetId: string | null;
    outcome: AuditLogEntry['outcome'];
    context?: Record<string, unknown>;
  }): Promise<AuditLogEntry> {
    const redactedContext = (redactPiiAndSecrets(params.context ?? {}) ?? {}) as Record<
      string,
      unknown
    >;
    const prevHash =
      this.auditLogs.length > 0
        ? this.auditLogs[this.auditLogs.length - 1].entryHash
        : '0'.repeat(64);
    const createdAt = new Date().toISOString();

    const canonical = [
      prevHash,
      params.correlationId,
      params.actorId ?? 'anonymous',
      params.actorRole,
      params.eventCategory,
      params.action,
      params.outcome,
      params.targetId ?? '',
      JSON.stringify(redactedContext),
      createdAt,
    ].join('|');

    const entryHash = sha256Hex(canonical);
    const entry: AuditLogEntry = Object.freeze({
      seq: this.auditLogs.length + 1,
      id: randomUUID(),
      correlationId: params.correlationId,
      actorId: params.actorId,
      actorRole: params.actorRole,
      ipHmac: params.ipHmac,
      eventCategory: params.eventCategory,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      outcome: params.outcome,
      redactedContext,
      prevHash,
      entryHash,
      createdAt,
    });

    this.auditLogs.push(entry);

    const svc = createServiceRoleSupabaseClient();
    if (svc) {
      await svc.from('audit_logs').insert({
        id: entry.id,
        correlation_id: entry.correlationId,
        actor_id: entry.actorId,
        actor_role: entry.actorRole,
        ip_hmac: entry.ipHmac,
        event_category: entry.eventCategory,
        action: entry.action,
        target_type: entry.targetType,
        target_id: entry.targetId,
        outcome: entry.outcome,
        redacted_context: entry.redactedContext,
      });
    }

    return entry;
  }

  public verifyAuditChainIntegrity(): { valid: boolean; checkedEntries: number; brokenAtSeq?: number } {
    let expectedPrev = '0'.repeat(64);
    for (const entry of this.auditLogs) {
      if (entry.prevHash !== expectedPrev) {
        return { valid: false, checkedEntries: this.auditLogs.length, brokenAtSeq: entry.seq };
      }
      const canonical = [
        entry.prevHash,
        entry.correlationId,
        entry.actorId ?? 'anonymous',
        entry.actorRole,
        entry.eventCategory,
        entry.action,
        entry.outcome,
        entry.targetId ?? '',
        JSON.stringify(entry.redactedContext),
        entry.createdAt,
      ].join('|');
      if (sha256Hex(canonical) !== entry.entryHash) {
        return { valid: false, checkedEntries: this.auditLogs.length, brokenAtSeq: entry.seq };
      }
      expectedPrev = entry.entryHash;
    }
    return { valid: true, checkedEntries: this.auditLogs.length };
  }

  // ---------------------------------------------------------------------------
  // 6. LGPD Rights (Consent, Data Portability Export & Erasure) & Billing Ledger
  // ---------------------------------------------------------------------------
  public async recordLgpdConsent(options: {
    actor: AuthenticatedActor;
    purpose: LgpdConsentRecord['purpose'];
    legalBasis: LgpdConsentRecord['legalBasis'];
    granted: boolean;
    ipHmac: string;
    correlationId: string;
  }): Promise<LgpdConsentRecord> {
    if (!options.actor.userId) {
      throw AppError.unauthorized('AUTH_REQUIRED', 'Authenticated user required to record LGPD consent.');
    }
    const rec: LgpdConsentRecord = {
      id: randomUUID(),
      userId: options.actor.userId,
      purpose: options.purpose,
      legalBasis: options.legalBasis,
      policyVersion: '2026.10',
      granted: options.granted,
      ipHmac: options.ipHmac,
      createdAt: new Date().toISOString(),
    };
    this.consents.push(rec);
    await this.appendAuditLog({
      correlationId: options.correlationId,
      actorId: options.actor.userId,
      actorRole: options.actor.role,
      ipHmac: options.ipHmac,
      eventCategory: 'lgpd',
      action: options.granted ? 'lgpd.consent_granted' : 'lgpd.consent_revoked',
      targetType: 'lgpd_consent',
      targetId: rec.id,
      outcome: 'success',
      context: { purpose: rec.purpose, legalBasis: rec.legalBasis },
    });
    return rec;
  }

  public async executeLgpdRight(options: {
    actor: AuthenticatedActor;
    email: string;
    requestType: 'export' | 'erasure';
    correlationId: string;
  }): Promise<{
    request: LgpdDataRequestRecord;
    exportedBundle?: Record<string, unknown>;
    erasedArtifactsCount?: number;
  }> {
    if (!options.actor.userId) {
      throw AppError.unauthorized('AUTH_REQUIRED', 'Authentication is required to exercise titular data rights.');
    }

    const emailHash = sha256Hex(options.email.trim().toLowerCase());
    const now = new Date();
    const reqRecord: LgpdDataRequestRecord = {
      id: randomUUID(),
      userId: options.actor.userId,
      requesterEmailHash: emailHash,
      requestType: options.requestType,
      status: 'completed',
      slaDueAt: new Date(now.getTime() + 15 * 86400_000).toISOString(),
      completedAt: now.toISOString(),
      correlationId: options.correlationId,
      createdAt: now.toISOString(),
    };
    this.lgpdRequests.push(reqRecord);

    if (options.requestType === 'export') {
      const userConsents = this.consents.filter((c) => c.userId === options.actor.userId);
      const userArtifacts = Array.from(this.artifacts.values())
        .filter((a) => a.meta.ownerId === options.actor.userId && !a.meta.deletedAt)
        .map((a) => a.meta);
      const userJobs = Array.from(this.jobs.values()).filter(
        (j) => j.ownerId === options.actor.userId
      );

      await this.appendAuditLog({
        correlationId: options.correlationId,
        actorId: options.actor.userId,
        actorRole: options.actor.role,
        ipHmac: null,
        eventCategory: 'lgpd',
        action: 'lgpd.data_export_completed',
        targetType: 'lgpd_data_request',
        targetId: reqRecord.id,
        outcome: 'success',
      });

      return {
        request: reqRecord,
        exportedBundle: {
          schemaVersion: 'lgpd-portability/1.0',
          generatedAt: now.toISOString(),
          subjectId: options.actor.userId,
          consents: userConsents,
          activeArtifacts: userArtifacts,
          jobs: userJobs,
        },
      };
    }

    // Erasure: purge all user artifacts and scrub job payloads immediately
    let erasedArtifactsCount = 0;
    for (const [, artifactEntry] of this.artifacts.entries()) {
      if (artifactEntry.meta.ownerId === options.actor.userId && !artifactEntry.meta.deletedAt) {
        artifactEntry.meta.deletedAt = now.toISOString();
        artifactEntry.bytes = null;
        erasedArtifactsCount += 1;
      }
    }
    for (const [, job] of this.jobs.entries()) {
      if (job.ownerId === options.actor.userId) {
        job.inputPayload = {};
        job.resultPayload = null;
        job.ownerId = null;
      }
    }

    await this.appendAuditLog({
      correlationId: options.correlationId,
      actorId: options.actor.userId,
      actorRole: options.actor.role,
      ipHmac: null,
      eventCategory: 'lgpd',
      action: 'lgpd.data_erasure_completed',
      targetType: 'lgpd_data_request',
      targetId: reqRecord.id,
      outcome: 'success',
      context: { erasedArtifactsCount },
    });

    return {
      request: reqRecord,
      erasedArtifactsCount,
    };
  }

  public async recordVerifiedBillingWebhook(options: {
    providerEventId: string;
    eventType: string;
    environment: 'sandbox' | 'production';
    rawBody: string;
    correlationId: string;
  }): Promise<{ duplicate: boolean; providerEventId: string }> {
    const cfg = getAppConfig();
    if (options.environment !== cfg.BILLING_ENVIRONMENT) {
      throw AppError.forbidden(
        'BILLING_ENV_MISMATCH',
        `Webhook environment "${options.environment}" does not match configured "${cfg.BILLING_ENVIRONMENT}".`
      );
    }
    if (this.processedWebhookEvents.has(options.providerEventId)) {
      return { duplicate: true, providerEventId: options.providerEventId };
    }
    this.processedWebhookEvents.add(options.providerEventId);

    await this.appendAuditLog({
      correlationId: options.correlationId,
      actorId: null,
      actorRole: 'anonymous',
      ipHmac: null,
      eventCategory: 'billing',
      action: `billing.webhook.${options.eventType}`,
      targetType: 'billing_webhook_event',
      targetId: options.providerEventId,
      outcome: 'success',
      context: {
        environment: options.environment,
        payloadSha256: sha256Hex(options.rawBody),
      },
    });

    return { duplicate: false, providerEventId: options.providerEventId };
  }

  // ---------------------------------------------------------------------------
  // 7. Compliance Matrices Query, Pagination & Admin Governance Updates
  // ---------------------------------------------------------------------------
  public queryEngineeringMatrix(filters: {
    domainNumber?: number;
    priority?: ControlPriority;
    stage?: string;
    status?: EngineeringCheckStatus;
    search?: string;
    page?: number;
    pageSize?: number;
  }): {
    total: number;
    page: number;
    pageSize: number;
    items: EngineeringVerificationItem[];
  } {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
    const q = filters.search?.trim().toLowerCase() ?? '';

    const filtered = getEngineeringVerifications2000()
      .map((item) => {
        const override = this.engineeringOverrides.get(item.code);
        return override ? { ...item, status: override } : item;
      })
      .filter((item) => {
        if (filters.domainNumber && item.domainNumber !== filters.domainNumber) return false;
        if (filters.priority && item.priority !== filters.priority) return false;
        if (filters.stage && item.stage !== filters.stage) return false;
        if (filters.status && item.status !== filters.status) return false;
        if (q) {
          return (
            item.code.toLowerCase().includes(q) ||
            item.domainName.toLowerCase().includes(q) ||
            item.statement.toLowerCase().includes(q)
          );
        }
        return true;
      });

    const start = (page - 1) * pageSize;
    return {
      total: filtered.length,
      page,
      pageSize,
      items: filtered.slice(start, start + pageSize),
    };
  }

  public querySecurityPractices(filters: {
    domainNumber?: number;
    priority?: ControlPriority;
    status?: SecurityPracticeStatus;
    search?: string;
    page?: number;
    pageSize?: number;
  }): {
    total: number;
    page: number;
    pageSize: number;
    items: SecurityBestPracticeItem[];
  } {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
    const q = filters.search?.trim().toLowerCase() ?? '';

    const filtered = getSecurityBestPractices500()
      .map((item) => {
        const override = this.securityOverrides.get(item.code);
        return override ? { ...item, status: override } : item;
      })
      .filter((item) => {
        if (filters.domainNumber && item.domainNumber !== filters.domainNumber) return false;
        if (filters.priority && item.priority !== filters.priority) return false;
        if (filters.status && item.status !== filters.status) return false;
        if (q) {
          return (
            item.code.toLowerCase().includes(q) ||
            item.domainName.toLowerCase().includes(q) ||
            item.topic.toLowerCase().includes(q) ||
            item.statement.toLowerCase().includes(q)
          );
        }
        return true;
      });

    const start = (page - 1) * pageSize;
    return {
      total: filtered.length,
      page,
      pageSize,
      items: filtered.slice(start, start + pageSize),
    };
  }

  public async updateComplianceStatus(options: {
    actor: AuthenticatedActor;
    matrix: 'engineering' | 'security';
    code: string;
    status: string;
    correlationId: string;
  }): Promise<{ code: string; status: string }> {
    assertAdminMutationAccess(options.actor);

    if (options.matrix === 'engineering') {
      const valid: EngineeringCheckStatus[] = [
        'pendente',
        'em_execucao',
        'aprovado',
        'excecao_justificada',
        'nao_aplicavel',
      ];
      if (!valid.includes(options.status as EngineeringCheckStatus)) {
        throw AppError.badRequest('INVALID_COMPLIANCE_STATUS', 'Invalid engineering verification status.');
      }
      const target = getEngineeringVerifications2000().find((i) => i.code === options.code);
      if (!target) {
        throw AppError.notFound('CONTROL_NOT_FOUND', `Engineering control ${options.code} not found.`);
      }
      this.engineeringOverrides.set(options.code, options.status as EngineeringCheckStatus);
    } else {
      const valid: SecurityPracticeStatus[] = ['pendente', 'em_execucao', 'verificado', 'nao_aplicavel'];
      if (!valid.includes(options.status as SecurityPracticeStatus)) {
        throw AppError.badRequest('INVALID_COMPLIANCE_STATUS', 'Invalid security practice status.');
      }
      const target = getSecurityBestPractices500().find((i) => i.code === options.code);
      if (!target) {
        throw AppError.notFound('CONTROL_NOT_FOUND', `Security practice ${options.code} not found.`);
      }
      this.securityOverrides.set(options.code, options.status as SecurityPracticeStatus);
    }

    await this.appendAuditLog({
      correlationId: options.correlationId,
      actorId: options.actor.userId,
      actorRole: options.actor.role,
      ipHmac: null,
      eventCategory: 'compliance',
      action: 'compliance.status_updated',
      targetType: options.matrix,
      targetId: options.code,
      outcome: 'success',
      context: { newStatus: options.status },
    });

    return { code: options.code, status: options.status };
  }

  public getGovernanceSummary() {
    const eng = getEngineeringVerifications2000();
    const sec = getSecurityBestPractices500();
    const tools = getUnifiedToolCatalog();

    return {
      supabaseProjectRef: getAppConfig().SUPABASE_PROJECT_REF,
      liveSupabaseConnected: getAppConfig().hasLiveSupabase,
      toolsCatalog: {
        totalTools: tools.length,
        browserClientTools: tools.filter((t) => t.executionMode === 'client').length,
        serverSyncTools: tools.filter((t) => t.executionMode === 'server_sync').length,
        workerAsyncTools: tools.filter((t) => t.executionMode === 'worker_async').length,
        all10PublicationGatesPassed: tools.every(
          (t) => Object.values(t.publicationGates).every(Boolean)
        ),
      },
      engineeringMatrix2000: {
        totalChecks: eng.length,
        domainsCount: 40,
        p0Count: eng.filter((i) => i.priority === 'P0').length,
        p1Count: eng.filter((i) => i.priority === 'P1').length,
        p2Count: eng.filter((i) => i.priority === 'P2').length,
        approvedCount: eng.filter(
          (i) => (this.engineeringOverrides.get(i.code) ?? i.status) === 'aprovado'
        ).length,
      },
      securityPractices500: {
        totalPractices: sec.length,
        domainsCount: 25,
        p0Count: sec.filter((i) => i.priority === 'P0').length,
        p1Count: sec.filter((i) => i.priority === 'P1').length,
        p2Count: sec.filter((i) => i.priority === 'P2').length,
        verifiedCount: sec.filter(
          (i) => (this.securityOverrides.get(i.code) ?? i.status) === 'verificado'
        ).length,
      },
      auditChain: this.verifyAuditChainIntegrity(),
    };
  }
}

let singletonStore: PlatformDataStore | null = null;

export function getPlatformDataStore(): PlatformDataStore {
  if (!singletonStore) {
    singletonStore = new PlatformDataStore();
  }
  return singletonStore;
}

export function createIsolatedTestDataStore(): PlatformDataStore {
  return new PlatformDataStore();
}
