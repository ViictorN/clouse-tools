import { TOOLS as CLIENT_BROWSER_TOOLS } from '@/lib/data';
import { AppError } from '@clouse/core';
import { assertRoleAtLeast, parseStrictSchema } from '@clouse/security';
import {
  ALL_PUBLICATION_GATES_PASSED,
  ToolManifestSchema,
  verifyPublicationGates,
  type ServerToolDefinition,
  type ToolExecutionContext,
  type ToolManifest,
} from './src/manifest';
import { pdfSecurityInspectorTool } from '@clouse/tools/pdf-security-inspector';
import { imageSanitizerTool } from '@clouse/tools/image-sanitizer';
import { archiveSafetyAuditorTool } from '@clouse/tools/archive-safety-auditor';
import { urlSsrfAuditorTool } from '@clouse/tools/url-ssrf-auditor';
import { mediaStreamInspectorTool } from '@clouse/tools/media-stream-inspector';
import { markdownHtmlSanitizerTool } from '@clouse/tools/markdown-html-sanitizer';

export * from './src/manifest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SERVER_TOOL_REGISTRY: ReadonlyMap<string, ServerToolDefinition<any, any>> = new Map<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ServerToolDefinition<any, any>
>([
  [pdfSecurityInspectorTool.manifest.slug, pdfSecurityInspectorTool],
  [imageSanitizerTool.manifest.slug, imageSanitizerTool],
  [archiveSafetyAuditorTool.manifest.slug, archiveSafetyAuditorTool],
  [urlSsrfAuditorTool.manifest.slug, urlSsrfAuditorTool],
  [mediaStreamInspectorTool.manifest.slug, mediaStreamInspectorTool],
  [markdownHtmlSanitizerTool.manifest.slug, markdownHtmlSanitizerTool],
]);

let cachedCatalog: ToolManifest[] | null = null;

export function getUnifiedToolCatalog(): ToolManifest[] {
  if (cachedCatalog) {
    return cachedCatalog;
  }

  const clientManifests: ToolManifest[] = CLIENT_BROWSER_TOOLS.map((tool) => ({
    slug: tool.slug,
    version: '1.0.0',
    rollbackVersion: '1.0.0',
    name: tool.name,
    category: tool.cat,
    summary: tool.desc,
    ownerTeam: 'web-client-tools',
    executionMode: 'client',
    riskTier: 'low',
    minRole: 'anonymous',
    requiresUpload: false,
    allowedMimeTypes: [],
    maxInputBytes: 65_536,
    maxPages: null,
    maxDurationSeconds: null,
    timeoutMs: 2000,
    cpuQuotaMs: 250,
    memoryQuotaMb: 64,
    costUnits: 0,
    rateLimitPerMinute: 120,
    publicationGates: ALL_PUBLICATION_GATES_PASSED,
    rolloutPercentage: 100,
    enabled: true,
  }));

  const serverManifests: ToolManifest[] = Array.from(SERVER_TOOL_REGISTRY.values()).map((def) => {
    verifyPublicationGates(def.manifest);
    return ToolManifestSchema.parse(def.manifest);
  });

  cachedCatalog = [...clientManifests, ...serverManifests];
  return cachedCatalog;
}

export function getToolManifestBySlug(slug: string): ToolManifest | null {
  return getUnifiedToolCatalog().find((m) => m.slug === slug) ?? null;
}

export async function executeServerToolBySlug(
  slug: string,
  rawInput: unknown,
  ctx: Omit<ToolExecutionContext, 'abortSignal'> & { abortSignal?: AbortSignal }
): Promise<{
  manifest: ToolManifest;
  output: unknown;
  durationMs: number;
}> {
  const def = SERVER_TOOL_REGISTRY.get(slug);
  if (!def) {
    const maybeClient = getToolManifestBySlug(slug);
    if (maybeClient?.executionMode === 'client') {
      throw AppError.badRequest(
        'CLIENT_SIDE_ONLY_TOOL',
        `Tool "${slug}" runs 100% locally in the browser and does not accept server payloads.`
      );
    }
    throw AppError.notFound('TOOL_NOT_FOUND', `Tool "${slug}" does not exist in the registry.`);
  }

  verifyPublicationGates(def.manifest);
  if (!def.manifest.enabled) {
    throw AppError.forbidden('TOOL_DISABLED', `Tool "${slug}" is currently disabled.`);
  }

  assertRoleAtLeast(ctx.actor, def.manifest.minRole);
  const validatedInput = parseStrictSchema(def.inputSchema, rawInput);

  const timeoutController = new AbortController();
  const timeoutHandle = setTimeout(() => {
    timeoutController.abort(new Error('TOOL_EXECUTION_TIMEOUT'));
  }, def.manifest.timeoutMs);
  timeoutHandle.unref?.();

  const combinedSignal = ctx.abortSignal
    ? AbortSignal.any([ctx.abortSignal, timeoutController.signal])
    : timeoutController.signal;

  const startMs = performance.now();
  try {
    const executionPromise = def.execute(validatedInput, {
      correlationId: ctx.correlationId,
      actor: ctx.actor,
      sandboxDir: ctx.sandboxDir,
      abortSignal: combinedSignal,
    });

    const timeoutGuard = new Promise<never>((_resolve, reject) => {
      combinedSignal.addEventListener(
        'abort',
        () => {
          reject(
            AppError.serviceUnavailable(
              'TOOL_EXECUTION_TIMEOUT',
              `Tool "${slug}" exceeded its ${def.manifest.timeoutMs}ms execution budget.`
            )
          );
        },
        { once: true }
      );
    });

    const output = await Promise.race([executionPromise, timeoutGuard]);
    const durationMs = Math.max(1, Math.round(performance.now() - startMs));
    return {
      manifest: def.manifest,
      output,
      durationMs,
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}
