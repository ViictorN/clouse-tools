import * as z from 'zod';
import { inspectZipArchive } from '@clouse/security';
import {
  ALL_PUBLICATION_GATES_PASSED,
  type ServerToolDefinition,
} from '@clouse/tool-sdk/src/manifest';

const ArchiveAuditorInputSchema = z.strictObject({
  zipBase64: z.string().min(16).max(35_000_000),
  maxEntries: z.number().int().min(1).max(200).optional().default(150),
  maxRatio: z.number().int().min(5).max(100).optional().default(80),
});

export const archiveSafetyAuditorTool: ServerToolDefinition<
  z.infer<typeof ArchiveAuditorInputSchema>,
  ReturnType<typeof inspectZipArchive>
> = {
  manifest: {
    slug: 'archive-safety-auditor',
    version: '1.0.0',
    rollbackVersion: '1.0.0',
    name: 'Archive Zip-Bomb & Zip-Slip Auditor',
    category: 'security-cloud',
    summary:
      'Audits ZIP archives without extracting to host filesystem, detecting Zip-Slip path traversal, encrypted headers, and compression ratio bombs.',
    ownerTeam: 'appsec-team',
    executionMode: 'worker_async',
    riskTier: 'high',
    minRole: 'anonymous',
    requiresUpload: true,
    allowedMimeTypes: ['application/zip'],
    maxInputBytes: 26_214_400,
    maxPages: null,
    maxDurationSeconds: null,
    timeoutMs: 8000,
    cpuQuotaMs: 2000,
    memoryQuotaMb: 256,
    costUnits: 4,
    rateLimitPerMinute: 20,
    publicationGates: ALL_PUBLICATION_GATES_PASSED,
    rolloutPercentage: 100,
    enabled: true,
  },
  inputSchema: ArchiveAuditorInputSchema,
  async execute(input) {
    const bytes = Buffer.from(input.zipBase64, 'base64');
    return inspectZipArchive(bytes, {
      maxEntries: input.maxEntries,
      maxRatio: input.maxRatio,
    });
  },
};
