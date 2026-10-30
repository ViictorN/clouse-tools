import { GracefulShutdownCoordinator, createLogger, getAppConfig } from '@clouse/core';
import { createApiApp } from './app';

const cfg = getAppConfig();
const logger = createLogger('clouse-api-server');
const shutdown = new GracefulShutdownCoordinator();
const app = createApiApp();

const server = app.listen(cfg.API_PORT, () => {
  logger.info('api.server_started', {
    port: cfg.API_PORT,
    nodeEnv: cfg.NODE_ENV,
    supabaseProjectRef: cfg.SUPABASE_PROJECT_REF,
    liveSupabase: cfg.hasLiveSupabase,
  });
});

shutdown.register('http-server', () => {
  return new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sig, async () => {
    logger.info('api.shutdown_signal_received', { signal: sig });
    const result = await shutdown.drain(10_000);
    logger.info('api.shutdown_complete', result);
    process.exit(result.timedOut ? 1 : 0);
  });
}
