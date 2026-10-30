import { randomUUID } from 'node:crypto';
import { GracefulShutdownCoordinator, createLogger, getAppConfig } from '@clouse/core';
import { getPlatformDataStore } from '@clouse/data';
import { processNextQueuedJobOnce } from './sandbox-runner';

const cfg = getAppConfig();
const workerId = `worker-${randomUUID().slice(0, 8)}`;
const logger = createLogger('clouse-worker-daemon');
const shutdown = new GracefulShutdownCoordinator();
const store = getPlatformDataStore();

let activeLoops = 0;
let stopRequested = false;

async function runWorkerLoop(): Promise<void> {
  logger.info('worker.started', {
    workerId,
    concurrency: cfg.WORKER_CONCURRENCY,
    pollIntervalMs: cfg.WORKER_POLL_INTERVAL_MS,
  });

  const reaperTimer = setInterval(async () => {
    if (stopRequested) return;
    const purged = await store.reapExpiredArtifacts();
    if (purged > 0) {
      logger.info('worker.expired_artifacts_reaped', { purged });
    }
  }, 30_000);
  reaperTimer.unref?.();

  shutdown.register('artifact-reaper', async () => {
    clearInterval(reaperTimer);
  });

  while (!stopRequested) {
    if (activeLoops < cfg.WORKER_CONCURRENCY) {
      activeLoops += 1;
      processNextQueuedJobOnce({ workerId, store })
        .catch((err) => {
          logger.error('worker.tick_unhandled', { error: err instanceof Error ? err.message : String(err) });
        })
        .finally(() => {
          activeLoops -= 1;
        });
    }
    await new Promise((resolve) => setTimeout(resolve, cfg.WORKER_POLL_INTERVAL_MS));
  }

  while (activeLoops > 0) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

shutdown.register('worker-poll-loop', async () => {
  stopRequested = true;
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    logger.info('worker.shutdown_signal', { signal: sig, workerId });
    const res = await shutdown.drain(15_000);
    logger.info('worker.shutdown_complete', res);
    process.exit(res.timedOut ? 1 : 0);
  });
}

runWorkerLoop().catch((err) => {
  logger.error('worker.fatal_exit', { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
