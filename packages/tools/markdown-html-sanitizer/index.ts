import * as z from 'zod';
import { normalizeUnicodeInput, sanitizeHtmlFragment } from '@clouse/security';
import {
  ALL_PUBLICATION_GATES_PASSED,
  type ServerToolDefinition,
} from '@clouse/tool-sdk/src/manifest';

const HtmlSanitizerInputSchema = z.strictObject({
  markup: z.string().min(1).max(65_536),
});

export interface SanitizedMarkupResult {
  sanitizedHtml: string;
  originalLength: number;
  sanitizedLength: number;
  modified: boolean;
}

export const markdownHtmlSanitizerTool: ServerToolDefinition<
  z.infer<typeof HtmlSanitizerInputSchema>,
  SanitizedMarkupResult
> = {
  manifest: {
    slug: 'markdown-html-sanitizer',
    version: '1.0.0',
    rollbackVersion: '1.0.0',
    name: 'HTML & Markdown XSS Sanitizer',
    category: 'security-cloud',
    summary:
      'Normalizes Unicode input and strips script tags, inline event handlers, javascript: URIs, and DOM-clobbering id/name attributes on the server.',
    ownerTeam: 'appsec-team',
    executionMode: 'server_sync',
    riskTier: 'low',
    minRole: 'anonymous',
    requiresUpload: false,
    allowedMimeTypes: ['text/plain', 'text/markdown'],
    maxInputBytes: 65_536,
    maxPages: null,
    maxDurationSeconds: null,
    timeoutMs: 2000,
    cpuQuotaMs: 300,
    memoryQuotaMb: 64,
    costUnits: 1,
    rateLimitPerMinute: 60,
    publicationGates: ALL_PUBLICATION_GATES_PASSED,
    rolloutPercentage: 100,
    enabled: true,
  },
  inputSchema: HtmlSanitizerInputSchema,
  async execute(input) {
    const normalized = normalizeUnicodeInput(input.markup, 65_536);
    const sanitizedHtml = sanitizeHtmlFragment(normalized);
    return {
      sanitizedHtml,
      originalLength: input.markup.length,
      sanitizedLength: sanitizedHtml.length,
      modified: sanitizedHtml !== input.markup,
    };
  },
};
