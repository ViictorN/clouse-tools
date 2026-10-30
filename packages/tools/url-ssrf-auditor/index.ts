import * as z from 'zod';
import { validateExternalUrlAgainstSsrf, type SsrfAuditResult } from '@clouse/security';
import {
  ALL_PUBLICATION_GATES_PASSED,
  type ServerToolDefinition,
} from '@clouse/tool-sdk/src/manifest';

const UrlSsrfAuditorInputSchema = z.strictObject({
  url: z.string().min(8).max(2048),
  allowedHosts: z.array(z.string().min(1).max(255)).max(20).optional(),
});

export const urlSsrfAuditorTool: ServerToolDefinition<
  z.infer<typeof UrlSsrfAuditorInputSchema>,
  SsrfAuditResult
> = {
  manifest: {
    slug: 'url-ssrf-auditor',
    version: '1.0.0',
    rollbackVersion: '1.0.0',
    name: 'Outbound URL & SSRF Policy Auditor',
    category: 'security-cloud',
    summary:
      'Validates user-supplied webhook and integration URLs against HTTPS enforcement, DNS rebinding, RFC1918/CGNAT private ranges, and cloud metadata endpoints.',
    ownerTeam: 'appsec-team',
    executionMode: 'server_sync',
    riskTier: 'medium',
    minRole: 'anonymous',
    requiresUpload: false,
    allowedMimeTypes: [],
    maxInputBytes: 16_384,
    maxPages: null,
    maxDurationSeconds: null,
    timeoutMs: 5000,
    cpuQuotaMs: 500,
    memoryQuotaMb: 128,
    costUnits: 1,
    rateLimitPerMinute: 30,
    publicationGates: ALL_PUBLICATION_GATES_PASSED,
    rolloutPercentage: 100,
    enabled: true,
  },
  inputSchema: UrlSsrfAuditorInputSchema,
  async execute(input) {
    return validateExternalUrlAgainstSsrf(input.url, {
      allowedHosts: input.allowedHosts,
    });
  },
};
