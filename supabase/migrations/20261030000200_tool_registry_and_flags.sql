-- =============================================================================
-- Migration 0002: Modular Tool Registry, 10 Publication Gates & Feature Flags
-- Project: CLOUSE TOOLS (luytwttrgosmsfyjlonc)
-- Controls covered: PDF 1 Pillar 2 & Domains 02, 03, 34, 40 | PDF 2 Domains 01, 11
-- =============================================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tool_execution_mode') THEN
    CREATE TYPE public.tool_execution_mode AS ENUM ('client', 'server_sync', 'worker_async');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tool_risk_tier') THEN
    CREATE TYPE public.tool_risk_tier AS ENUM ('low', 'medium', 'high', 'critical');
  END IF;
END
$$;

-- Helper function enforcing the 10 mandatory Publication Gates from PDF 1 Section 2
CREATE OR REPLACE FUNCTION public.validate_publication_gates(gates jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    jsonb_typeof(gates) = 'object'
    AND (gates ->> 'manifest_valid')::boolean IS TRUE
    AND (gates ->> 'risk_review')::boolean IS TRUE
    AND (gates ->> 'schemas_and_tests')::boolean IS TRUE
    AND (gates ->> 'resource_evaluation')::boolean IS TRUE
    AND (gates ->> 'isolation_verified')::boolean IS TRUE
    AND (gates ->> 'auth_and_limits')::boolean IS TRUE
    AND (gates ->> 'telemetry_ready')::boolean IS TRUE
    AND (gates ->> 'gradual_rollout')::boolean IS TRUE
    AND (gates ->> 'monitoring_active')::boolean IS TRUE
    AND (gates ->> 'rollback_plan')::boolean IS TRUE;
$$;

-- 1. Versioned Tool Manifests Registry
CREATE TABLE IF NOT EXISTS public.tool_manifests (
  slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$'),
  version text NOT NULL DEFAULT '1.0.0' CHECK (version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  rollback_version text CHECK (rollback_version IS NULL OR rollback_version ~ '^[0-9]+\.[0-9]+\.[0-9]+$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 140),
  category text NOT NULL CHECK (char_length(category) BETWEEN 2 AND 60),
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 4 AND 600),
  owner_team text NOT NULL DEFAULT 'platform-core' CHECK (char_length(owner_team) BETWEEN 2 AND 80),
  execution_mode public.tool_execution_mode NOT NULL DEFAULT 'client',
  risk_tier public.tool_risk_tier NOT NULL DEFAULT 'low',
  min_role public.app_role NOT NULL DEFAULT 'anonymous',
  requires_upload boolean NOT NULL DEFAULT false,
  allowed_mime_types text[] NOT NULL DEFAULT '{}'::text[],
  max_input_bytes bigint NOT NULL DEFAULT 65536 CHECK (max_input_bytes BETWEEN 256 AND 104857600),
  max_pages integer CHECK (max_pages IS NULL OR max_pages BETWEEN 1 AND 2000),
  max_duration_seconds integer CHECK (max_duration_seconds IS NULL OR max_duration_seconds BETWEEN 1 AND 3600),
  timeout_ms integer NOT NULL DEFAULT 5000 CHECK (timeout_ms BETWEEN 100 AND 120000),
  cpu_quota_ms integer NOT NULL DEFAULT 1000 CHECK (cpu_quota_ms BETWEEN 50 AND 60000),
  memory_quota_mb integer NOT NULL DEFAULT 128 CHECK (memory_quota_mb BETWEEN 32 AND 2048),
  cost_units integer NOT NULL DEFAULT 1 CHECK (cost_units BETWEEN 0 AND 1000),
  rate_limit_per_minute integer NOT NULL DEFAULT 60 CHECK (rate_limit_per_minute BETWEEN 1 AND 6000),
  input_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  publication_gates jsonb NOT NULL DEFAULT '{
    "manifest_valid": true,
    "risk_review": true,
    "schemas_and_tests": true,
    "resource_evaluation": true,
    "isolation_verified": true,
    "auth_and_limits": true,
    "telemetry_ready": true,
    "gradual_rollout": true,
    "monitoring_active": true,
    "rollback_plan": true
  }'::jsonb,
  rollout_percentage integer NOT NULL DEFAULT 100 CHECK (rollout_percentage BETWEEN 0 AND 100),
  enabled boolean NOT NULL DEFAULT true,
  deprecated_at timestamptz,
  sunset_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT chk_enabled_requires_10_gates CHECK (
    (NOT enabled) OR public.validate_publication_gates(publication_gates)
  )
);

CREATE INDEX IF NOT EXISTS idx_tool_manifests_category ON public.tool_manifests(category);
CREATE INDEX IF NOT EXISTS idx_tool_manifests_mode ON public.tool_manifests(execution_mode, enabled);

DROP TRIGGER IF EXISTS trg_tool_manifests_updated_at ON public.tool_manifests;
CREATE TRIGGER trg_tool_manifests_updated_at
  BEFORE UPDATE ON public.tool_manifests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 2. Feature Flags & Gradual Rollout Switches
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key text PRIMARY KEY CHECK (key ~ '^[a-z0-9][a-z0-9._-]{1,98}[a-z0-9]$'),
  description text NOT NULL CHECK (char_length(description) <= 400),
  enabled boolean NOT NULL DEFAULT false,
  rollout_percentage integer NOT NULL DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  allowed_roles public.app_role[] NOT NULL DEFAULT ARRAY['admin']::public.app_role[],
  owner_team text NOT NULL DEFAULT 'platform-core',
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER trg_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. Per-Tool Plan Overrides & Resource Policies
CREATE TABLE IF NOT EXISTS public.tool_plan_policies (
  tool_slug text NOT NULL REFERENCES public.tool_manifests(slug) ON DELETE CASCADE,
  plan public.account_plan NOT NULL,
  allowed boolean NOT NULL DEFAULT true,
  max_input_bytes_override bigint CHECK (max_input_bytes_override IS NULL OR max_input_bytes_override > 0),
  rate_limit_per_minute_override integer CHECK (rate_limit_per_minute_override IS NULL OR rate_limit_per_minute_override > 0),
  daily_executions_limit integer NOT NULL DEFAULT 100 CHECK (daily_executions_limit >= 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (tool_slug, plan)
);

-- 4. RLS Policies for Tool Registry & Flags
ALTER TABLE public.tool_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_manifests FORCE ROW LEVEL SECURITY;

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags FORCE ROW LEVEL SECURITY;

ALTER TABLE public.tool_plan_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_plan_policies FORCE ROW LEVEL SECURITY;

-- Public/authenticated catalog read of enabled tools; admins see all
DROP POLICY IF EXISTS tool_manifests_read_enabled ON public.tool_manifests;
CREATE POLICY tool_manifests_read_enabled ON public.tool_manifests
  FOR SELECT TO anon, authenticated
  USING (enabled = true OR public.is_admin());

DROP POLICY IF EXISTS tool_manifests_admin_write ON public.tool_manifests;
CREATE POLICY tool_manifests_admin_write ON public.tool_manifests
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS feature_flags_read_all ON public.feature_flags;
CREATE POLICY feature_flags_read_all ON public.feature_flags
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS feature_flags_admin_write ON public.feature_flags;
CREATE POLICY feature_flags_admin_write ON public.feature_flags
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS tool_plan_policies_read ON public.tool_plan_policies;
CREATE POLICY tool_plan_policies_read ON public.tool_plan_policies
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS tool_plan_policies_admin_write ON public.tool_plan_policies;
CREATE POLICY tool_plan_policies_admin_write ON public.tool_plan_policies
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;
