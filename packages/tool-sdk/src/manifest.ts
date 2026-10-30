import * as z from 'zod';
import { AppError } from '@clouse/core';
import type { AuthenticatedActor } from '@clouse/security';

export const PublicationGatesSchema = z.strictObject({
  manifest_valid: z.boolean(),
  risk_review: z.boolean(),
  schemas_and_tests: z.boolean(),
  resource_evaluation: z.boolean(),
  isolation_verified: z.boolean(),
  auth_and_limits: z.boolean(),
  telemetry_ready: z.boolean(),
  gradual_rollout: z.boolean(),
  monitoring_active: z.boolean(),
  rollback_plan: z.boolean(),
});

export type PublicationGates = z.infer<typeof PublicationGatesSchema>;

export const ALL_PUBLICATION_GATES_PASSED: PublicationGates = {
  manifest_valid: true,
  risk_review: true,
  schemas_and_tests: true,
  resource_evaluation: true,
  isolation_verified: true,
  auth_and_limits: true,
  telemetry_ready: true,
  gradual_rollout: true,
  monitoring_active: true,
  rollback_plan: true,
};

export const ToolManifestSchema = z.strictObject({
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  rollbackVersion: z.string().regex(/^\d+\.\d+\.\d+$/).nullable(),
  name: z.string().min(2).max(140),
  category: z.string().min(2).max(60),
  summary: z.string().min(4).max(600),
  ownerTeam: z.string().min(2).max(80),
  executionMode: z.enum(['client', 'server_sync', 'worker_async']),
  riskTier: z.enum(['low', 'medium', 'high', 'critical']),
  minRole: z.enum(['anonymous', 'user', 'premium', 'support', 'admin']),
  requiresUpload: z.boolean(),
  allowedMimeTypes: z.array(z.string().max(120)).max(20),
  maxInputBytes: z.number().int().min(256).max(104_857_600),
  maxPages: z.number().int().min(1).max(2000).nullable(),
  maxDurationSeconds: z.number().int().min(1).max(3600).nullable(),
  timeoutMs: z.number().int().min(100).max(120_000),
  cpuQuotaMs: z.number().int().min(50).max(60_000),
  memoryQuotaMb: z.number().int().min(32).max(2048),
  costUnits: z.number().int().min(0).max(1000),
  rateLimitPerMinute: z.number().int().min(1).max(6000),
  publicationGates: PublicationGatesSchema,
  rolloutPercentage: z.number().int().min(0).max(100),
  enabled: z.boolean(),
});

export type ToolManifest = z.infer<typeof ToolManifestSchema>;

export interface ToolExecutionContext {
  correlationId: string;
  actor: AuthenticatedActor;
  abortSignal: AbortSignal;
  sandboxDir?: string;
}

export interface ServerToolDefinition<TInput = unknown, TOutput = unknown> {
  manifest: ToolManifest;
  inputSchema: z.ZodType<TInput>;
  execute: (input: TInput, ctx: ToolExecutionContext) => Promise<TOutput>;
}

export function verifyPublicationGates(manifest: ToolManifest): {
  passed: boolean;
  missingGates: string[];
} {
  const parsed = ToolManifestSchema.safeParse(manifest);
  if (!parsed.success) {
    return {
      passed: false,
      missingGates: ['manifest_valid'],
    };
  }
  const missingGates = Object.entries(parsed.data.publicationGates)
    .filter(([, ok]) => !ok)
    .map(([gate]) => gate);

  if (parsed.data.enabled && missingGates.length > 0) {
    throw AppError.forbidden(
      'PUBLICATION_GATE_BLOCKED',
      `Tool "${manifest.slug}" cannot be enabled; missing gates: ${missingGates.join(', ')}`
    );
  }
  return {
    passed: missingGates.length === 0,
    missingGates,
  };
}
