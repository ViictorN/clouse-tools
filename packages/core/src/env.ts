import { randomUUID } from 'node:crypto';
import * as z from 'zod';

const CORRELATION_ID_PATTERN = /^[a-zA-Z0-9._:-]{8,96}$/;

export function resolveCorrelationId(incoming?: string | null): string {
  if (typeof incoming === 'string') {
    const trimmed = incoming.trim();
    if (CORRELATION_ID_PATTERN.test(trimmed)) {
      return trimmed;
    }
  }
  return `ct_${randomUUID()}`;
}

const RawEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  APP_VERSION: z.string().min(1).max(32).default('1.0.0'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  API_BASE_URL: z.string().url().default('http://localhost:4000'),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000,https://clouse.app'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(1),
  SUPABASE_PROJECT_REF: z.string().min(4).max(64).default('luytwttrgosmsfyjlonc'),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url()
    .default('https://luytwttrgosmsfyjlonc.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(''),
  DATABASE_URL: z.string().optional().default(''),
  JWT_ISSUER: z
    .string()
    .url()
    .default('https://luytwttrgosmsfyjlonc.supabase.co/auth/v1'),
  JWT_AUDIENCE: z.string().min(2).max(120).default('authenticated'),
  CSRF_HMAC_SECRET: z
    .string()
    .default('dev-only-csrf-hmac-secret-change-in-production-32b'),
  PASSWORD_PEPPER: z
    .string()
    .default('dev-only-password-pepper-change-in-production-32b'),
  SESSION_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().min(60).max(86400).default(1800),
  SESSION_ABSOLUTE_TIMEOUT_SECONDS: z.coerce.number().int().min(300).max(604800).default(43200),
  MAX_JSON_BODY_BYTES: z.coerce.number().int().min(1024).max(1048576).default(65536),
  MAX_UPLOAD_FILE_BYTES: z.coerce.number().int().min(1024).max(104857600).default(26214400),
  MAX_USER_STORAGE_QUOTA_BYTES: z.coerce
    .number()
    .int()
    .min(65536)
    .max(10737418240)
    .default(104857600),
  ARTIFACT_TTL_SECONDS: z.coerce.number().int().min(60).max(86400).default(900),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().min(200).max(60000).default(2000),
  WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(16).default(2),
  WORKER_JOB_TIMEOUT_MS: z.coerce.number().int().min(500).max(120000).default(15000),
  WORKER_MAX_MEMORY_MB: z.coerce.number().int().min(64).max(2048).default(256),
  FFMPEG_BINARY_PATH: z.string().min(1).max(260).default('ffmpeg'),
  FFPROBE_BINARY_PATH: z.string().min(1).max(260).default('ffprobe'),
  UPSTASH_REDIS_REST_URL: z.string().optional().default(''),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(''),
  BILLING_ENVIRONMENT: z.enum(['sandbox', 'production']).default('sandbox'),
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
});

export interface AppConfig extends z.infer<typeof RawEnvSchema> {
  corsOriginsList: string[];
  hasLiveSupabase: boolean;
  hasLiveServiceRole: boolean;
  hasUpstashRedis: boolean;
}

export function loadAppConfig(sourceEnv: Record<string, string | undefined> = process.env): AppConfig {
  const parsed = RawEnvSchema.safeParse(sourceEnv);
  if (!parsed.success) {
    const failedKeys = parsed.error.issues.map((i) => i.path.join('.')).filter(Boolean);
    throw new Error(
      `Invalid environment configuration for keys: [${Array.from(new Set(failedKeys)).join(', ')}]`
    );
  }

  const cfg = parsed.data;
  const corsOriginsList = cfg.CORS_ALLOWED_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  const isStaticBuildPhase = sourceEnv.NEXT_PHASE === 'phase-production-build';
  const isLocalPreview = sourceEnv.CLOUSE_ALLOW_LOCAL_PREVIEW === 'true';

  if (cfg.NODE_ENV === 'production' && !isStaticBuildPhase && !isLocalPreview) {
    const prodViolations: string[] = [];
    if (corsOriginsList.includes('*')) {
      prodViolations.push('CORS_ALLOWED_ORIGINS must not contain wildcard (*) in production');
    }
    if (
      cfg.CSRF_HMAC_SECRET.startsWith('dev-only-') ||
      cfg.CSRF_HMAC_SECRET.length < 32
    ) {
      prodViolations.push('CSRF_HMAC_SECRET must be explicitly set (>= 32 chars) in production');
    }
    if (
      cfg.PASSWORD_PEPPER.startsWith('dev-only-') ||
      cfg.PASSWORD_PEPPER.length < 32
    ) {
      prodViolations.push('PASSWORD_PEPPER must be explicitly set (>= 32 chars) in production');
    }
    if (
      !cfg.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      cfg.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('replace-')
    ) {
      prodViolations.push('NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured in production');
    }
    if (
      cfg.DATABASE_URL &&
      !cfg.DATABASE_URL.includes('sslmode=require') &&
      !cfg.DATABASE_URL.includes('sslmode=verify-full')
    ) {
      prodViolations.push('DATABASE_URL must enforce TLS (sslmode=require or sslmode=verify-full)');
    }
    if (cfg.BILLING_ENVIRONMENT === 'production' && cfg.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
      prodViolations.push('Sandbox Stripe key cannot be used when BILLING_ENVIRONMENT=production');
    }
    if (prodViolations.length > 0) {
      throw new Error(`Production security gate failed: ${prodViolations.join('; ')}`);
    }
  }

  const hasLiveSupabase =
    Boolean(cfg.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(cfg.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
    !cfg.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('replace-');

  const hasLiveServiceRole =
    hasLiveSupabase &&
    Boolean(cfg.SUPABASE_SERVICE_ROLE_KEY) &&
    !cfg.SUPABASE_SERVICE_ROLE_KEY.startsWith('replace-');

  const hasUpstashRedis =
    Boolean(cfg.UPSTASH_REDIS_REST_URL) && Boolean(cfg.UPSTASH_REDIS_REST_TOKEN);

  return {
    ...cfg,
    corsOriginsList,
    hasLiveSupabase,
    hasLiveServiceRole,
    hasUpstashRedis,
  };
}

let cachedConfig: AppConfig | null = null;

export function getAppConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = loadAppConfig(process.env);
  }
  return cachedConfig;
}

export function resetAppConfigCache(): void {
  cachedConfig = null;
}
