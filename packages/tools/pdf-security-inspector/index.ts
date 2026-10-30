import * as z from 'zod';
import { inspectAndScrubPdf } from '@clouse/security';
import {
  ALL_PUBLICATION_GATES_PASSED,
  type ServerToolDefinition,
} from '@clouse/tool-sdk/src/manifest';

const PdfInspectorInputSchema = z.strictObject({
  pdfBase64: z.string().min(16).max(35_000_000),
  maxPages: z.number().int().min(1).max(500).optional().default(200),
  rejectExternalLinks: z.boolean().optional().default(false),
});

export const pdfSecurityInspectorTool: ServerToolDefinition<
  z.infer<typeof PdfInspectorInputSchema>,
  ReturnType<typeof inspectAndScrubPdf>
> = {
  manifest: {
    slug: 'pdf-security-inspector',
    version: '1.0.0',
    rollbackVersion: '1.0.0',
    name: 'PDF Security Inspector & Metadata Scrubber',
    category: 'security-cloud',
    summary:
      'Inspects PDF documents in an isolated sandbox for JavaScript, macros, auto-actions, encryption, page limits, and scrubs XMP/Info metadata.',
    ownerTeam: 'appsec-team',
    executionMode: 'worker_async',
    riskTier: 'high',
    minRole: 'anonymous',
    requiresUpload: true,
    allowedMimeTypes: ['application/pdf'],
    maxInputBytes: 26_214_400,
    maxPages: 200,
    maxDurationSeconds: null,
    timeoutMs: 10_000,
    cpuQuotaMs: 3000,
    memoryQuotaMb: 256,
    costUnits: 5,
    rateLimitPerMinute: 20,
    publicationGates: ALL_PUBLICATION_GATES_PASSED,
    rolloutPercentage: 100,
    enabled: true,
  },
  inputSchema: PdfInspectorInputSchema,
  async execute(input) {
    const bytes = Buffer.from(input.pdfBase64, 'base64');
    return inspectAndScrubPdf(bytes, {
      maxPages: input.maxPages,
      rejectExternalLinks: input.rejectExternalLinks,
    });
  },
};
