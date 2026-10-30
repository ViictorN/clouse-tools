# Technical Findings — CLOUSE TOOLS Architecture & Security

## 1. Existing Codebase Baseline
- **Framework:** Next.js `^16.4.3` (App Router, ESM `"type": "module"`), React `^19.3.1`, TypeScript `^7.0.2`.
- **Middleware (`middleware.ts`):** Already bypasses `/api` paths (`pathname.startsWith('/api')`), allowing `/api/v1/*` routes to operate cleanly without locale redirects.
- **Design System (`app/globals.css`):** Apple HIG Light (`#f5f5f7`) and OLED Dark (`#000000` / `#121216`) tokens (`--r-xs`..`--r-xl`, `--sh-sm`..`--sh-lg`, `--ease-spring`, `--fs-hero`..`--fs-xs`). Local rule forbids hardcoded magic pixel/hex values and requires WCAG AA 4.5:1 contrast + `prefers-reduced-motion` support + no language selector in top Header.

## 2. Canonical Library Findings (`context7`)
- **`@supabase/supabase-js`:** Server/worker clients must pass `{ auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }` so per-request JWTs and service-role keys never leak across requests in memory. `storage.from(bucket).createSignedUrl(path, ttlSeconds, { download: safeFilename })` enforces short-lived authorized downloads.
- **`express` (v5):** Supports `express.json({ limit: '64kb', strict: true })` and `express.raw({ type: 'application/json', limit: '64kb' })` for webhook HMAC verification; error handlers require exact 4-argument `(err, req, res, next)` signature.
- **`zod` (v4/v3):** `z.strictObject({...})` (or `.strict()`) compiles a `never` catchall that rejects unrecognized keys (`unrecognized_keys`) including enumerable inherited properties, directly enforcing anti-mass-assignment (PDF 2 Domain 07 & 11).

## 3. Compliance Matrices Generative Formulas
- **Engineering Matrix (`CT-0001`..`CT-2000`):** 40 domains × 10 controls × 5 lifecycle stages (`projeto`, `implementacao`, `implantacao`, `operacao`, `auditoria`).
- **Security Best Practices (`CT-001`..`CT-500`):** 25 domains × 20 templates mapped over 10 domain-specific topics `t1..t10` (`P0` for items 1–8, `P1` for items 9–16, `P2` for items 17–20).
