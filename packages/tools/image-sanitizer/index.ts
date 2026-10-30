import * as z from 'zod';
import { inspectAndSanitizeImage } from '@clouse/security';
import {
  ALL_PUBLICATION_GATES_PASSED,
  type ServerToolDefinition,
} from '@clouse/tool-sdk/src/manifest';

const ImageSanitizerInputSchema = z.strictObject({
  imageBase64: z.string().min(8).max(35_000_000),
  maxDimension: z.number().int().min(64).max(8192).optional().default(4096),
});

export const imageSanitizerTool: ServerToolDefinition<
  z.infer<typeof ImageSanitizerInputSchema>,
  ReturnType<typeof inspectAndSanitizeImage>
> = {
  manifest: {
    slug: 'image-sanitizer',
    version: '1.0.0',
    rollbackVersion: '1.0.0',
    name: 'Image EXIF Stripper & SVG Sanitizer',
    category: 'security-cloud',
    summary:
      'Verifies binary image headers, blocks pixel decompression bombs, strips EXIF/IPTC/tEXt metadata from PNG/JPEG, and neutralizes XSS/XXE in SVG.',
    ownerTeam: 'appsec-team',
    executionMode: 'server_sync',
    riskTier: 'medium',
    minRole: 'anonymous',
    requiresUpload: true,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'],
    maxInputBytes: 15_728_640,
    maxPages: null,
    maxDurationSeconds: null,
    timeoutMs: 5000,
    cpuQuotaMs: 1500,
    memoryQuotaMb: 256,
    costUnits: 2,
    rateLimitPerMinute: 30,
    publicationGates: ALL_PUBLICATION_GATES_PASSED,
    rolloutPercentage: 100,
    enabled: true,
  },
  inputSchema: ImageSanitizerInputSchema,
  async execute(input) {
    const bytes = Buffer.from(input.imageBase64, 'base64');
    return inspectAndSanitizeImage(bytes, { maxDimension: input.maxDimension });
  },
};
