import * as z from 'zod';
import {
  AppError,
  CircuitBreaker,
  SloTracker,
  getAppConfig,
  type ControlPriority,
  type EngineeringCheckStatus,
  type SecurityPracticeStatus,
} from '@clouse/core';
import {
  createCsrfToken,
  parseStrictSchema,
  verifyWebhookHmacSignature,
  type AuthenticatedActor,
} from '@clouse/security';
import {
  executeServerToolBySlug,
  getToolManifestBySlug,
  getUnifiedToolCatalog,
} from '@clouse/tool-sdk';
import { getPlatformDataStore, type PlatformDataStore } from '@clouse/data';
import { buildOpenApiSpec } from './openapi';

const UploadRequestSchema = z.strictObject({
  filename: z.string().min(1).max(180),
  declaredMime: z.string().min(3).max(120),
  contentBase64: z.string().min(4).max(36_000_000),
  ttlSeconds: z.number().int().min(60).max(3600).optional(),
});

const EnqueueJobRequestSchema = z.strictObject({
  toolSlug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/),
  idempotencyKey: z.string().min(8).max(128).optional(),
  priority: z.number().int().min(-10).max(100).optional(),
  inputArtifactId: z.string().uuid().optional().nullable(),
  inputPayload: z.record(z.string(), z.unknown()).default({}),
});

const LgpdConsentRequestSchema = z.strictObject({
  purpose: z.enum(['essential_service', 'cloud_processing', 'billing', 'product_updates']),
  legalBasis: z.enum(['consent', 'contract_execution', 'legal_obligation', 'legitimate_interest']),
  granted: z.boolean(),
});

const LgpdSubjectRightSchema = z.strictObject({
  email: z.string().email().max(320),
});

const AdminCompliancePatchSchema = z.strictObject({
  status: z.string().min(3).max(40),
});

const BillingWebhookPayloadSchema = z.strictObject({
  id: z.string().min(4).max(160),
  type: z.string().min(3).max(120),
  livemode: z.boolean().optional().default(false),
  data: z.record(z.string(), z.unknown()).optional().default({}),
});

export interface GatewayRequestInput {
  method: string;
  subpath: string; // e.g. "/health", "/tools", "/tools/image-sanitizer/execute"
  query: URLSearchParams;
  headers: Record<string, string | undefined>;
  body: unknown;
  rawBody?: string | Buffer;
  actor: AuthenticatedActor;
  ipHmac: string;
  correlationId: string;
  store?: PlatformDataStore;
  sloTracker?: SloTracker;
  circuitBreaker?: CircuitBreaker;
}

export interface GatewayResponseOutput {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

const defaultSlo = new SloTracker('api-gateway', 99.9);
const defaultBreaker = new CircuitBreaker('sandbox-execution', 5, 30_000);

export function getDefaultGatewayTelemetry() {
  return { sloTracker: defaultSlo, circuitBreaker: defaultBreaker };
}

export async function dispatchGatewayRoute(req: GatewayRequestInput): Promise<GatewayResponseOutput> {
  const cfg = getAppConfig();
  const store = req.store ?? getPlatformDataStore();
  const slo = req.sloTracker ?? defaultSlo;
  const breaker = req.circuitBreaker ?? defaultBreaker;
  const method = req.method.toUpperCase();
  const cleanPath = req.subpath.replace(/\/+$/, '') || '/';
  const segments = cleanPath.split('/').filter(Boolean);

  // 1. GET /api/v1/health
  if (method === 'GET' && cleanPath === '/health') {
    return {
      status: 200,
      body: {
        status: 'ok',
        service: 'clouse-tools-api',
        version: cfg.APP_VERSION,
        uptimeSeconds: Math.floor(process.uptime()),
        correlationId: req.correlationId,
      },
    };
  }

  // 2. GET /api/v1/ready
  if (method === 'GET' && cleanPath === '/ready') {
    const auditIntegrity = store.verifyAuditChainIntegrity();
    return {
      status: auditIntegrity.valid ? 200 : 503,
      body: {
        ready: auditIntegrity.valid,
        supabaseProjectRef: cfg.SUPABASE_PROJECT_REF,
        liveSupabaseConfigured: cfg.hasLiveSupabase,
        slo: slo.snapshot(),
        circuitBreaker: breaker.snapshot(),
        auditChain: auditIntegrity,
        correlationId: req.correlationId,
      },
    };
  }

  // 3. GET /api/v1/openapi.json
  if (method === 'GET' && cleanPath === '/openapi.json') {
    return {
      status: 200,
      body: buildOpenApiSpec(cfg.API_BASE_URL),
    };
  }

  // 4. GET /api/v1/csrf-token
  if (method === 'GET' && cleanPath === '/csrf-token') {
    const token = createCsrfToken(req.actor.actorKey, cfg.CSRF_HMAC_SECRET);
    const cookieFlags = [
      `clouse_csrf_bind=${encodeURIComponent(req.actor.actorKey)}`,
      'Path=/api',
      'HttpOnly',
      'SameSite=Strict',
      ...(cfg.NODE_ENV === 'production' ? ['Secure'] : []),
    ].join('; ');
    return {
      status: 200,
      headers: { 'Set-Cookie': cookieFlags },
      body: { csrfToken: token, expiresInSeconds: 7200 },
    };
  }

  // 5. GET /api/v1/tools
  if (method === 'GET' && cleanPath === '/tools') {
    const modeFilter = req.query.get('mode');
    const catFilter = req.query.get('category');
    const page = Math.max(1, Number(req.query.get('page') ?? '1') || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.get('pageSize') ?? '50') || 50));

    let list = getUnifiedToolCatalog();
    if (modeFilter) {
      list = list.filter((t) => t.executionMode === modeFilter);
    }
    if (catFilter) {
      list = list.filter((t) => t.category === catFilter);
    }

    const start = (page - 1) * pageSize;
    return {
      status: 200,
      body: {
        total: list.length,
        page,
        pageSize,
        items: list.slice(start, start + pageSize),
      },
    };
  }

  // 6. GET /api/v1/tools/:slug
  if (method === 'GET' && segments.length === 2 && segments[0] === 'tools') {
    const manifest = getToolManifestBySlug(segments[1]);
    if (!manifest) {
      throw AppError.notFound('TOOL_NOT_FOUND', `Tool "${segments[1]}" was not found.`);
    }
    return { status: 200, body: manifest };
  }

  // 7. POST /api/v1/tools/:slug/execute
  if (method === 'POST' && segments.length === 3 && segments[0] === 'tools' && segments[2] === 'execute') {
    const slug = segments[1];
    const manifest = getToolManifestBySlug(slug);
    if (!manifest) {
      throw AppError.notFound('TOOL_NOT_FOUND', `Tool "${slug}" was not found.`);
    }

    // Per-tool rate limit
    const rl = await store.consumeRateLimit(
      `tool:${slug}:${req.actor.actorKey}`,
      60,
      manifest.rateLimitPerMinute
    );
    if (!rl.allowed) {
      throw AppError.rateLimited(
        'TOOL_RATE_LIMIT_EXCEEDED',
        `Rate limit exceeded for tool "${slug}". Reset at ${rl.resetAt}.`
      );
    }

    const waitSync = req.query.get('wait') === 'true';
    if (manifest.executionMode === 'worker_async' && !waitSync) {
      const idemHeader =
        req.headers['idempotency-key'] ?? `${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const payloadObj =
        req.body && typeof req.body === 'object' && !Array.isArray(req.body)
          ? (req.body as Record<string, unknown>)
          : {};

      const queued = await store.enqueueJob({
        actor: req.actor,
        toolSlug: slug,
        idempotencyKey: idemHeader,
        inputPayload: payloadObj,
        correlationId: req.correlationId,
      });

      return {
        status: 202,
        body: {
          mode: 'worker_async',
          deduplicated: queued.deduplicated,
          job: queued.job,
        },
      };
    }

    const result = await breaker.execute(async () => {
      const execOut = await executeServerToolBySlug(slug, req.body, {
        correlationId: req.correlationId,
        actor: req.actor,
      });
      store.assertAndConsumeQuota(req.actor, {
        jobs: 1,
        cpuMs: execOut.durationMs,
        costUnits: execOut.manifest.costUnits,
      });
      return execOut;
    });

    await store.appendAuditLog({
      correlationId: req.correlationId,
      actorId: req.actor.userId,
      actorRole: req.actor.role,
      ipHmac: req.ipHmac,
      eventCategory: 'tool',
      action: `tool.executed.${slug}`,
      targetType: 'tool',
      targetId: slug,
      outcome: 'success',
      context: { durationMs: result.durationMs, costUnits: result.manifest.costUnits },
    });

    return {
      status: 200,
      body: {
        tool: slug,
        version: result.manifest.version,
        durationMs: result.durationMs,
        result: result.output,
        correlationId: req.correlationId,
      },
    };
  }

  // 8. POST /api/v1/uploads
  if (method === 'POST' && cleanPath === '/uploads') {
    if (!req.actor.userId) {
      throw AppError.unauthorized('AUTH_REQUIRED', 'Authenticated session is required for file uploads.');
    }
    const parsed = parseStrictSchema(UploadRequestSchema, req.body);
    const bytes = Buffer.from(parsed.contentBase64, 'base64');

    const stored = await store.storeQuarantinedUpload({
      actor: req.actor,
      filename: parsed.filename,
      declaredMime: parsed.declaredMime,
      bytes,
      ttlSeconds: parsed.ttlSeconds,
      correlationId: req.correlationId,
    });

    return {
      status: 201,
      body: {
        artifact: stored,
        correlationId: req.correlationId,
      },
    };
  }

  // 9. GET /api/v1/uploads/:id/download
  if (method === 'GET' && segments.length === 3 && segments[0] === 'uploads' && segments[2] === 'download') {
    try {
      const download = await store.getAuthorizedArtifactDownload(
        segments[1],
        req.actor,
        req.correlationId
      );
      return { status: 200, body: download };
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 403) {
        await store.appendAuditLog({
          correlationId: req.correlationId,
          actorId: req.actor.userId,
          actorRole: req.actor.role,
          ipHmac: req.ipHmac,
          eventCategory: 'authz',
          action: 'upload.unauthorized_download_attempt',
          targetType: 'file_artifact',
          targetId: segments[1],
          outcome: 'deny',
        });
      }
      throw err;
    }
  }

  // 10. POST /api/v1/jobs
  if (method === 'POST' && cleanPath === '/jobs') {
    const parsed = parseStrictSchema(EnqueueJobRequestSchema, req.body);
    const idemKey =
      req.headers['idempotency-key'] ?? parsed.idempotencyKey;
    if (!idemKey) {
      throw AppError.badRequest(
        'IDEMPOTENCY_KEY_REQUIRED',
        'Provide an Idempotency-Key header or idempotencyKey body field.'
      );
    }

    const res = await store.enqueueJob({
      actor: req.actor,
      toolSlug: parsed.toolSlug,
      idempotencyKey: idemKey,
      priority: parsed.priority,
      inputArtifactId: parsed.inputArtifactId,
      inputPayload: parsed.inputPayload,
      correlationId: req.correlationId,
    });

    return {
      status: 202,
      body: {
        deduplicated: res.deduplicated,
        job: res.job,
      },
    };
  }

  // 11. GET /api/v1/jobs/:id
  if (method === 'GET' && segments.length === 2 && segments[0] === 'jobs') {
    try {
      const job = store.getJobAuthorized(segments[1], req.actor);
      return { status: 200, body: { job } };
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 403) {
        await store.appendAuditLog({
          correlationId: req.correlationId,
          actorId: req.actor.userId,
          actorRole: req.actor.role,
          ipHmac: req.ipHmac,
          eventCategory: 'authz',
          action: 'job.unauthorized_read_attempt',
          targetType: 'processing_job',
          targetId: segments[1],
          outcome: 'deny',
        });
      }
      throw err;
    }
  }

  // 12. GET /api/v1/admin/dlq
  if (method === 'GET' && cleanPath === '/admin/dlq') {
    const items = store.getDeadLetterJobs(req.actor);
    return { status: 200, body: { total: items.length, items } };
  }

  // 13. GET /api/v1/compliance/summary
  if (method === 'GET' && cleanPath === '/compliance/summary') {
    const cached = await store.cacheGet<ReturnType<PlatformDataStore['getGovernanceSummary']>>(
      'compliance:summary'
    );
    if (cached) {
      return { status: 200, body: cached };
    }
    const summary = store.getGovernanceSummary();
    await store.cacheSet('compliance:summary', summary, 15);
    return { status: 200, body: summary };
  }

  // 14. GET /api/v1/compliance/engineering
  if (method === 'GET' && cleanPath === '/compliance/engineering') {
    const domain = req.query.get('domain');
    const priority = req.query.get('priority') as ControlPriority | null;
    const stage = req.query.get('stage') ?? undefined;
    const status = req.query.get('status') as EngineeringCheckStatus | null;
    const search = req.query.get('q') ?? undefined;
    const page = Number(req.query.get('page') ?? '1') || 1;
    const pageSize = Number(req.query.get('pageSize') ?? '25') || 25;

    return {
      status: 200,
      body: store.queryEngineeringMatrix({
        domainNumber: domain ? Number(domain) : undefined,
        priority: priority && ['P0', 'P1', 'P2'].includes(priority) ? priority : undefined,
        stage,
        status: status ?? undefined,
        search,
        page,
        pageSize,
      }),
    };
  }

  // 15. GET /api/v1/compliance/security
  if (method === 'GET' && cleanPath === '/compliance/security') {
    const domain = req.query.get('domain');
    const priority = req.query.get('priority') as ControlPriority | null;
    const status = req.query.get('status') as SecurityPracticeStatus | null;
    const search = req.query.get('q') ?? undefined;
    const page = Number(req.query.get('page') ?? '1') || 1;
    const pageSize = Number(req.query.get('pageSize') ?? '25') || 25;

    return {
      status: 200,
      body: store.querySecurityPractices({
        domainNumber: domain ? Number(domain) : undefined,
        priority: priority && ['P0', 'P1', 'P2'].includes(priority) ? priority : undefined,
        status: status ?? undefined,
        search,
        page,
        pageSize,
      }),
    };
  }

  // 16. PATCH /api/v1/admin/compliance/:matrix/:code
  if (
    method === 'PATCH' &&
    segments.length === 4 &&
    segments[0] === 'admin' &&
    segments[1] === 'compliance'
  ) {
    const matrix = segments[2];
    if (matrix !== 'engineering' && matrix !== 'security') {
      throw AppError.badRequest('INVALID_MATRIX', 'Matrix must be "engineering" or "security".');
    }
    const parsed = parseStrictSchema(AdminCompliancePatchSchema, req.body);
    try {
      const updated = await store.updateComplianceStatus({
        actor: req.actor,
        matrix,
        code: segments[3],
        status: parsed.status,
        correlationId: req.correlationId,
      });
      return { status: 200, body: updated };
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 403) {
        await store.appendAuditLog({
          correlationId: req.correlationId,
          actorId: req.actor.userId,
          actorRole: req.actor.role,
          ipHmac: req.ipHmac,
          eventCategory: 'authz',
          action: 'admin.compliance_mutation_denied',
          targetType: matrix,
          targetId: segments[3],
          outcome: 'deny',
        });
      }
      throw err;
    }
  }

  // 17. LGPD Endpoints: /lgpd/consent, /lgpd/export, /lgpd/delete
  if (method === 'POST' && cleanPath === '/lgpd/consent') {
    const parsed = parseStrictSchema(LgpdConsentRequestSchema, req.body);
    const consent = await store.recordLgpdConsent({
      actor: req.actor,
      purpose: parsed.purpose,
      legalBasis: parsed.legalBasis,
      granted: parsed.granted,
      ipHmac: req.ipHmac,
      correlationId: req.correlationId,
    });
    return { status: 201, body: { consent } };
  }

  if (method === 'POST' && (cleanPath === '/lgpd/export' || cleanPath === '/lgpd/delete')) {
    const parsed = parseStrictSchema(LgpdSubjectRightSchema, req.body);
    const rightOut = await store.executeLgpdRight({
      actor: req.actor,
      email: parsed.email,
      requestType: cleanPath === '/lgpd/export' ? 'export' : 'erasure',
      correlationId: req.correlationId,
    });
    return { status: 200, body: rightOut };
  }

  // 18. Billing Webhook: POST /api/v1/webhooks/billing
  if (method === 'POST' && cleanPath === '/webhooks/billing') {
    const rawStr =
      typeof req.rawBody === 'string'
        ? req.rawBody
        : Buffer.isBuffer(req.rawBody)
          ? req.rawBody.toString('utf8')
          : JSON.stringify(req.body ?? {});

    const sigHeader = req.headers['stripe-signature'] ?? req.headers['x-webhook-signature'];
    verifyWebhookHmacSignature({
      rawBody: rawStr,
      signatureHeader: sigHeader,
      secret: cfg.STRIPE_WEBHOOK_SECRET || 'whsec_dev_test_secret_minimum_32_bytes',
    });

    let jsonBody: unknown;
    try {
      jsonBody = JSON.parse(rawStr);
    } catch {
      throw AppError.badRequest('WEBHOOK_INVALID_JSON', 'Webhook body is not valid JSON.');
    }

    const parsedEvent = parseStrictSchema(BillingWebhookPayloadSchema, jsonBody);
    const webhookEnv = parsedEvent.livemode ? 'production' : 'sandbox';
    const ledger = await store.recordVerifiedBillingWebhook({
      providerEventId: parsedEvent.id,
      eventType: parsedEvent.type,
      environment: webhookEnv,
      rawBody: rawStr,
      correlationId: req.correlationId,
    });

    return {
      status: 200,
      body: {
        received: true,
        duplicate: ledger.duplicate,
        eventId: ledger.providerEventId,
      },
    };
  }

  // 19. Unknown Route -> Isolated 404 RFC 7807 ProblemDetails (PDF 2 Domain 03 t7)
  throw AppError.notFound('ENDPOINT_NOT_FOUND', `API route "${method} /api/v1${cleanPath}" does not exist.`);
}
