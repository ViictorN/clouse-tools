import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { getUnifiedToolCatalog } from '../packages/tool-sdk';
import { buildOpenApiSpec } from '../apps/api/src/openapi';

function sqlLit(val: string | null | undefined): string {
  if (val === null || val === undefined) return 'NULL';
  return `'${val.replace(/'/g, "''")}'`;
}

async function main() {
  const rootDir = process.cwd();
  const catalog = getUnifiedToolCatalog();

  const seedLines: string[] = [
    '-- =============================================================================',
    '-- Seed: Unified Tool Catalog (67 Client + 6 Server Sandbox Tools), Flags & SLOs',
    '-- Target Supabase Project: nsylafldndrhgkrgpiwb',
    '-- =============================================================================',
    '',
    'BEGIN;',
    '',
    'INSERT INTO public.tool_manifests (',
    '  slug, version, rollback_version, name, category, summary, owner_team,',
    '  execution_mode, risk_tier, min_role, requires_upload, allowed_mime_types,',
    '  max_input_bytes, max_pages, max_duration_seconds, timeout_ms, cpu_quota_ms,',
    '  memory_quota_mb, cost_units, rate_limit_per_minute, rollout_percentage, enabled',
    ') VALUES',
  ];

  const valueRows = catalog.map((t) => {
    const mimesSql =
      t.allowedMimeTypes.length === 0
        ? "'{}'::text[]"
        : `ARRAY[${t.allowedMimeTypes.map(sqlLit).join(', ')}]::text[]`;
    return `  (${sqlLit(t.slug)}, ${sqlLit(t.version)}, ${sqlLit(t.rollbackVersion)}, ${sqlLit(
      t.name
    )}, ${sqlLit(t.category)}, ${sqlLit(t.summary)}, ${sqlLit(t.ownerTeam)}, ${sqlLit(
      t.executionMode
    )}::public.tool_execution_mode, ${sqlLit(t.riskTier)}::public.tool_risk_tier, ${sqlLit(
      t.minRole
    )}::public.app_role, ${t.requiresUpload}, ${mimesSql}, ${t.maxInputBytes}, ${
      t.maxPages ?? 'NULL'
    }, ${t.maxDurationSeconds ?? 'NULL'}, ${t.timeoutMs}, ${t.cpuQuotaMs}, ${t.memoryQuotaMb}, ${
      t.costUnits
    }, ${t.rateLimitPerMinute}, ${t.rolloutPercentage}, ${t.enabled})`;
  });

  seedLines.push(valueRows.join(',\n'));
  seedLines.push(
    'ON CONFLICT (slug) DO UPDATE SET',
    '  version = EXCLUDED.version,',
    '  summary = EXCLUDED.summary,',
    '  execution_mode = EXCLUDED.execution_mode,',
    '  risk_tier = EXCLUDED.risk_tier,',
    '  max_input_bytes = EXCLUDED.max_input_bytes,',
    '  timeout_ms = EXCLUDED.timeout_ms,',
    '  enabled = EXCLUDED.enabled;',
    '',
    'INSERT INTO public.feature_flags (key, description, enabled, rollout_percentage, allowed_roles, owner_team) VALUES',
    "  ('cloud.sandbox_workers', 'Enable isolated async worker queue for untrusted PDF/ZIP/Media uploads', true, 100, ARRAY['anonymous','user','premium','admin']::public.app_role[], 'platform-core'),",
    "  ('security.strict_ssrf_dns_guard', 'Enforce DNS resolution & private CIDR blocking on outbound URLs', true, 100, ARRAY['anonymous','user','premium','admin']::public.app_role[], 'appsec-team'),",
    "  ('privacy.lgpd_self_service', 'Enable self-service LGPD portability export and erasure endpoints', true, 100, ARRAY['user','premium','admin']::public.app_role[], 'privacy-governance'),",
    "  ('billing.stripe_webhooks', 'Enable HMAC-verified idempotent billing webhook ingestion', true, 100, ARRAY['admin']::public.app_role[], 'billing-platform')",
    'ON CONFLICT (key) DO UPDATE SET enabled = EXCLUDED.enabled, rollout_percentage = EXCLUDED.rollout_percentage;',
    '',
    'INSERT INTO public.slo_snapshots (service_name, availability_target, availability_observed, latency_p95_ms, error_budget_remaining_pct) VALUES',
    "  ('api-gateway', 99.900, 99.982, 42, 94.50),",
    "  ('sandbox-worker', 99.500, 99.910, 185, 91.20),",
    "  ('supabase-db', 99.950, 99.995, 14, 98.00),",
    "  ('tool-catalog', 99.990, 100.000, 8, 100.00);",
    '',
    'COMMIT;',
    ''
  );

  const seedPath = path.join(rootDir, 'supabase', 'seed.sql');
  await writeFile(seedPath, seedLines.join('\n'), 'utf8');

  const migrationsDir = path.join(rootDir, 'supabase', 'migrations');
  const migrationFiles = (await readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const bundleParts: string[] = [
    '-- =============================================================================',
    '-- CLOUSE TOOLS — Consolidated Idempotent Supabase Deployment Bundle',
    '-- Project Reference: nsylafldndrhgkrgpiwb (https://nsylafldndrhgkrgpiwb.supabase.co)',
    '-- Generated deterministically from supabase/migrations/*.sql + supabase/seed.sql',
    '-- =============================================================================',
    '',
  ];

  for (const file of migrationFiles) {
    const content = await readFile(path.join(migrationsDir, file), 'utf8');
    bundleParts.push(`-- >>> BEGIN MIGRATION: ${file}`);
    bundleParts.push(content.trim());
    bundleParts.push(`-- <<< END MIGRATION: ${file}\n`);
  }

  bundleParts.push('-- >>> BEGIN SEED: seed.sql');
  bundleParts.push(seedLines.join('\n').trim());
  bundleParts.push('-- <<< END SEED: seed.sql\n');

  await writeFile(path.join(rootDir, 'supabase', 'deploy_bundle.sql'), bundleParts.join('\n'), 'utf8');

  const apiDocsDir = path.join(rootDir, 'docs', 'api');
  await mkdir(apiDocsDir, { recursive: true });
  await writeFile(
    path.join(apiDocsDir, 'openapi.json'),
    JSON.stringify(buildOpenApiSpec('https://clouse.app'), null, 2) + '\n',
    'utf8'
  );

  console.log(
    `Generated supabase/seed.sql (${catalog.length} tools), supabase/deploy_bundle.sql, and docs/api/openapi.json`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
