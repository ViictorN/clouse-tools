import * as z from 'zod';
import { inspectMediaContainer, type MediaInspectionReport } from '@clouse/security';
import {
  ALL_PUBLICATION_GATES_PASSED,
  type ServerToolDefinition,
} from '@clouse/tool-sdk/src/manifest';

const MediaInspectorInputSchema = z.strictObject({
  mediaBase64: z.string().min(16).max(35_000_000),
  maxDurationSeconds: z.number().int().min(1).max(600).optional().default(300),
});

export const mediaStreamInspectorTool: ServerToolDefinition<
  z.infer<typeof MediaInspectorInputSchema>,
  MediaInspectionReport
> = {
  manifest: {
    slug: 'media-stream-inspector',
    version: '1.0.0',
    rollbackVersion: '1.0.0',
    name: 'Audio & Video Stream Sandbox Inspector',
    category: 'security-cloud',
    summary:
      'Inspects MP4, MP3, and WAV media headers, enforces duration and codec allowlists, and builds shell-free FFmpeg sandbox arguments.',
    ownerTeam: 'media-platform',
    executionMode: 'worker_async',
    riskTier: 'high',
    minRole: 'anonymous',
    requiresUpload: true,
    allowedMimeTypes: ['video/mp4', 'audio/mpeg', 'audio/wav'],
    maxInputBytes: 26_214_400,
    maxPages: null,
    maxDurationSeconds: 300,
    timeoutMs: 15_000,
    cpuQuotaMs: 5000,
    memoryQuotaMb: 512,
    costUnits: 8,
    rateLimitPerMinute: 15,
    publicationGates: ALL_PUBLICATION_GATES_PASSED,
    rolloutPercentage: 100,
    enabled: true,
  },
  inputSchema: MediaInspectorInputSchema,
  async execute(input) {
    const bytes = Buffer.from(input.mediaBase64, 'base64');
    return inspectMediaContainer(bytes, {
      maxDurationSeconds: input.maxDurationSeconds,
    });
  },
};
