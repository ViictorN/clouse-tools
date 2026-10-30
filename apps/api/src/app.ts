import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import {
  AppError,
  CircuitBreaker,
  SloTracker,
  createLogger,
  getAppConfig,
  resolveCorrelationId,
  toProblemDetails,
} from '@clouse/core';
import { verifyOriginGuard } from '@clouse/security';
import { getPlatformDataStore, type PlatformDataStore } from '@clouse/data';
import { resolveActorFromHeaders } from './auth-resolver';
import { dispatchGatewayRoute } from './gateway-handlers';

export interface CreateApiAppOptions {
  store?: PlatformDataStore;
  rateLimitMaxPerMinute?: number;
}

export function createApiApp(options: CreateApiAppOptions = {}): Express {
  const cfg = getAppConfig();
  const store = options.store ?? getPlatformDataStore();
  const logger = createLogger('clouse-api');
  const sloTracker = new SloTracker('api-gateway', 99.9);
  const circuitBreaker = new CircuitBreaker('sandbox-execution', 5, 30_000);
  const ipRateLimitMax = options.rateLimitMaxPerMinute ?? 180;

  const app = express();

  // 1. Server Identification & Explicit Reverse Proxy Configuration (PDF 2 Domain 03 t3, t10)
  app.disable('x-powered-by');
  app.set('trust proxy', cfg.TRUST_PROXY_HOPS);

  // 2. Correlation ID & Request Telemetry Envelope (PDF 2 Domain 21 t3)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startMs = performance.now();
    const correlationId = resolveCorrelationId(req.header('x-correlation-id'));
    res.locals.correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);

    res.on('finish', () => {
      const durationMs = performance.now() - startMs;
      sloTracker.recordRequest(durationMs, res.statusCode);
    });
    next();
  });

  // 3. Helmet Strict HTTP Security Headers (PDF 2 Domain 03 t2, Domain 08 t5)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      frameguard: { action: 'deny' },
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: {
        maxAge: 31_536_000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // 4. Strict Allowlist CORS & Preflight Middleware (PDF 2 Domain 03 t9, Domain 09 t4..t6)
  app.use(
    cors({
      origin(requestOrigin, callback) {
        if (!requestOrigin) {
          callback(null, true);
          return;
        }
        if (cfg.corsOriginsList.includes(requestOrigin)) {
          callback(null, true);
          return;
        }
        callback(
          AppError.forbidden(
            'CORS_ORIGIN_DENIED',
            `Origin "${requestOrigin}" is not permitted by CORS policy.`
          )
        );
      },
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Correlation-Id',
        'X-Csrf-Token',
        'Idempotency-Key',
        'Stripe-Signature',
        'X-Webhook-Signature',
      ],
      exposedHeaders: ['X-Correlation-Id', 'X-RateLimit-Remaining'],
      credentials: true,
      maxAge: 600,
    })
  );

  // 5. IP Anti-Abuse Rate Limit Middleware (PDF 2 Domain 11 t7, Domain 22 t1)
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.path === '/api/v1/health') {
        next();
        return;
      }
      const ipKey = req.ip || '0.0.0.0';
      const rl = await store.consumeRateLimit(`ip:${ipKey}`, 60, ipRateLimitMax);
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, ipRateLimitMax - rl.currentCount)));
      if (!rl.allowed) {
        throw AppError.rateLimited(
          'IP_RATE_LIMIT_EXCEEDED',
          `IP rate limit exceeded. Window resets at ${rl.resetAt}.`
        );
      }
      next();
    } catch (err) {
      next(err);
    }
  });

  // 6. Explicit Scoped Body Parsers (PDF 2 Domain 03 t4, t5)
  // Raw body strictly for cryptographic webhook verification
  app.use(
    '/api/v1/webhooks/billing',
    express.raw({ type: 'application/json', limit: cfg.MAX_JSON_BODY_BYTES })
  );

  // Scoped base64 upload endpoints get explicit bounded limit; all other JSON routes strictly 64 KiB
  const uploadJsonParser = express.json({ limit: '38mb', strict: true });
  const strictSmallJsonParser = express.json({ limit: cfg.MAX_JSON_BODY_BYTES, strict: true });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/api/v1/webhooks/billing') {
      next();
      return;
    }
    if (req.path === '/api/v1/uploads' || /^\/api\/v1\/tools\/[a-z0-9-]+\/execute$/.test(req.path)) {
      uploadJsonParser(req, res, next);
      return;
    }
    strictSmallJsonParser(req, res, next);
  });

  // 7. Origin / CSRF Protection on Mutating Methods (PDF 2 Domain 09 t1..t3, t7)
  app.use((req: Request, _res: Response, next: NextFunction) => {
    try {
      if (req.path !== '/api/v1/webhooks/billing') {
        verifyOriginGuard({
          method: req.method,
          originHeader: req.header('origin'),
          refererHeader: req.header('referer'),
          allowedOrigins: cfg.corsOriginsList,
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  });

  // 8 & 9. Authentication Resolution + Versioned /api/v1/* Dispatcher
  app.all('/api/v1/*subpath', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const correlationId = String(res.locals.correlationId || resolveCorrelationId());
      const { actor, ipHmac } = await resolveActorFromHeaders({
        authorizationHeader: req.header('authorization'),
        clientIp: req.ip,
      });

      const rawParam = (req.params as unknown as { subpath?: string | string[] }).subpath;
      const subpath = Array.isArray(rawParam)
        ? `/${rawParam.join('/')}`
        : `/${rawParam ?? ''}`;

      const fullUrl = new URL(req.originalUrl, cfg.API_BASE_URL);
      const headerMap: Record<string, string | undefined> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        headerMap[k.toLowerCase()] = Array.isArray(v) ? v[0] : v;
      }

      const isRawBuffer = Buffer.isBuffer(req.body);
      const result = await dispatchGatewayRoute({
        method: req.method,
        subpath,
        query: fullUrl.searchParams,
        headers: headerMap,
        body: isRawBuffer ? undefined : req.body,
        rawBody: isRawBuffer ? (req.body as Buffer) : undefined,
        actor,
        ipHmac,
        correlationId,
        store,
        sloTracker,
        circuitBreaker,
      });

      if (result.headers) {
        for (const [hk, hv] of Object.entries(result.headers)) {
          res.setHeader(hk, hv);
        }
      }
      res.status(result.status).json(result.body);
    } catch (err) {
      next(err);
    }
  });

  // 10. Isolated Unknown-Route 404 Handler (PDF 2 Domain 03 t7)
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(
      AppError.notFound(
        'ROUTE_NOT_FOUND',
        `Unknown route "${req.method} ${req.path}". Use versioned /api/v1/* endpoints.`
      )
    );
  });

  // 11. Centralized 4-Argument Fail-Safe Error Handler (PDF 2 Domain 03 t6)
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const correlationId = String(res.locals.correlationId || resolveCorrelationId());
    const problem = toProblemDetails(err, correlationId);

    logger.error('api.request_error', {
      correlationId,
      method: req.method,
      path: req.path,
      status: problem.status,
      code: problem.code,
      authorization: req.header('authorization'),
      error: err instanceof Error ? err.message : String(err),
    });

    res
      .status(problem.status)
      .type('application/problem+json')
      .json(problem);
  });

  return app;
}
