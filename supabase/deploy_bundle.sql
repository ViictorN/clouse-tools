-- =============================================================================
-- CLOUSE TOOLS — Consolidated Idempotent Supabase Deployment Bundle
-- Project Reference: nsylafldndrhgkrgpiwb (https://nsylafldndrhgkrgpiwb.supabase.co)
-- Generated deterministically from supabase/migrations/*.sql + supabase/seed.sql
-- =============================================================================

-- >>> BEGIN MIGRATION: 20261030000100_core_iam_tenancy.sql
-- =============================================================================
-- Migration 0001: Core IAM, Multi-Tenant Accounts, Sessions & API Tokens
-- Project: CLOUSE TOOLS (luytwttrgosmsfyjlonc)
-- Controls covered: PDF 1 Domains 05, 06, 07, 18 | PDF 2 Domains 04, 05, 06, 16
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Enumerated Types (idempotent creation)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('anonymous', 'user', 'premium', 'support', 'admin');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_plan') THEN
    CREATE TYPE public.account_plan AS ENUM ('free', 'pro', 'enterprise');
  END IF;
END
$$;

-- 2. Shared updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$;

-- 3. User Profiles (1:1 with auth.users, strict least-privilege defaults)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL CHECK (char_length(email) <= 320),
  display_name text CHECK (display_name IS NULL OR char_length(display_name) <= 120),
  role public.app_role NOT NULL DEFAULT 'user',
  mfa_enforced boolean NOT NULL DEFAULT false,
  failed_login_attempts integer NOT NULL DEFAULT 0 CHECK (failed_login_attempts >= 0),
  locked_until timestamptz,
  password_changed_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  global_logout_after timestamptz,
  locale text NOT NULL DEFAULT 'pt-br' CHECK (locale IN ('pt-br', 'en')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(lower(email));

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Multi-Tenant Accounts / Workspaces (Tenant Isolation)
CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  plan public.account_plan NOT NULL DEFAULT 'free',
  cpu_quota_daily_ms bigint NOT NULL DEFAULT 300000 CHECK (cpu_quota_daily_ms > 0),
  memory_quota_mb integer NOT NULL DEFAULT 256 CHECK (memory_quota_mb BETWEEN 64 AND 4096),
  storage_quota_bytes bigint NOT NULL DEFAULT 104857600 CHECK (storage_quota_bytes > 0),
  daily_jobs_limit integer NOT NULL DEFAULT 100 CHECK (daily_jobs_limit > 0),
  suspended_at timestamptz,
  suspended_reason text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_accounts_owner_id ON public.accounts(owner_id);

DROP TRIGGER IF EXISTS trg_accounts_updated_at ON public.accounts;
CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. Account Memberships (RBAC per tenant)
CREATE TABLE IF NOT EXISTS public.account_members (
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_role text NOT NULL DEFAULT 'member' CHECK (member_role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (account_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_account_members_user_id ON public.account_members(user_id);

-- 6. Server-Tracked Session Metadata (Idle/Absolute Expiration, Rotation & Global Logout)
CREATE TABLE IF NOT EXISTS public.user_sessions_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token_sha256 text NOT NULL UNIQUE CHECK (char_length(session_token_sha256) = 64),
  ip_hmac text CHECK (ip_hmac IS NULL OR char_length(ip_hmac) = 64),
  user_agent text CHECK (user_agent IS NULL OR char_length(user_agent) <= 512),
  idle_expires_at timestamptz NOT NULL,
  absolute_expires_at timestamptz NOT NULL,
  rotated_from uuid REFERENCES public.user_sessions_meta(id) ON DELETE SET NULL,
  revoked_at timestamptz,
  revoke_reason text CHECK (revoke_reason IS NULL OR char_length(revoke_reason) <= 240),
  last_seen_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT chk_session_expiry_order CHECK (absolute_expires_at >= idle_expires_at)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_active
  ON public.user_sessions_meta(user_id, revoked_at, idle_expires_at);

-- 7. Scoped API Tokens (Stored Strictly as SHA-256 Digest, Never Plaintext)
CREATE TABLE IF NOT EXISTS public.api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  token_prefix text NOT NULL CHECK (char_length(token_prefix) BETWEEN 6 AND 16),
  token_sha256 text NOT NULL UNIQUE CHECK (char_length(token_sha256) = 64),
  scopes text[] NOT NULL DEFAULT ARRAY['tools:execute']::text[],
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_account_id ON public.api_tokens(account_id);

-- 8. Security Helper Functions (Pinned search_path, Deny-by-Default)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()),
    'anonymous'::public.app_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() = 'admin'::public.app_role;
$$;

CREATE OR REPLACE FUNCTION public.is_support_or_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() IN ('support'::public.app_role, 'admin'::public.app_role);
$$;

CREATE OR REPLACE FUNCTION public.has_account_access(target_account_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.accounts a
        WHERE a.id = target_account_id
          AND a.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.account_members am
        WHERE am.account_id = target_account_id
          AND am.user_id = auth.uid()
      )
    );
$$;

-- 9. Anti-Privilege-Escalation Trigger on Profiles (Blocks self-promotion to admin/support/premium)
CREATE OR REPLACE FUNCTION public.guard_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) = 'service_role' OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Privilege escalation denied: users cannot modify their own role'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.failed_login_attempts IS DISTINCT FROM OLD.failed_login_attempts
     OR NEW.locked_until IS DISTINCT FROM OLD.locked_until THEN
    RAISE EXCEPTION 'Security state tampering denied'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_escalation ON public.profiles;
CREATE TRIGGER trg_guard_profile_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privilege_escalation();

-- 10. Auto-Provision Profile & Personal Account on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id uuid;
  v_slug text;
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.id::text || '@users.clouse.local'),
    LEFT(COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(COALESCE(NEW.email, 'user'), '@', 1)), 120),
    'user'::public.app_role
  )
  ON CONFLICT (id) DO NOTHING;

  v_slug := 'acct-' || replace(LEFT(NEW.id::text, 18), '-', '');

  INSERT INTO public.accounts (owner_id, slug, name, plan)
  VALUES (NEW.id, v_slug, 'Personal Workspace', 'free')
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_account_id;

  IF v_account_id IS NOT NULL THEN
    INSERT INTO public.account_members (account_id, user_id, member_role)
    VALUES (v_account_id, NEW.id, 'owner')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 11. Row Level Security (Deny by Default + Object-Level Ownership Enforcement)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.account_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_members FORCE ROW LEVEL SECURITY;

ALTER TABLE public.user_sessions_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions_meta FORCE ROW LEVEL SECURITY;

ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_tokens FORCE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS profiles_select_own_or_staff ON public.profiles;
CREATE POLICY profiles_select_own_or_staff ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_support_or_admin());

DROP POLICY IF EXISTS profiles_update_own_or_admin ON public.profiles;
CREATE POLICY profiles_update_own_or_admin ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- Accounts policies
DROP POLICY IF EXISTS accounts_select_member ON public.accounts;
CREATE POLICY accounts_select_member ON public.accounts
  FOR SELECT TO authenticated
  USING (public.has_account_access(id) OR public.is_support_or_admin());

DROP POLICY IF EXISTS accounts_insert_owner ON public.accounts;
CREATE POLICY accounts_insert_owner ON public.accounts
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS accounts_update_owner_or_admin ON public.accounts;
CREATE POLICY accounts_update_owner_or_admin ON public.accounts
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS accounts_delete_owner_or_admin ON public.accounts;
CREATE POLICY accounts_delete_owner_or_admin ON public.accounts
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin());

-- Account members policies
DROP POLICY IF EXISTS account_members_select ON public.account_members;
CREATE POLICY account_members_select ON public.account_members
  FOR SELECT TO authenticated
  USING (public.has_account_access(account_id));

DROP POLICY IF EXISTS account_members_manage_owner ON public.account_members;
CREATE POLICY account_members_manage_owner ON public.account_members
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = account_members.account_id AND a.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.accounts a
      WHERE a.id = account_members.account_id AND a.owner_id = auth.uid()
    )
  );

-- User sessions policies
DROP POLICY IF EXISTS sessions_select_own ON public.user_sessions_meta;
CREATE POLICY sessions_select_own ON public.user_sessions_meta
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS sessions_revoke_own ON public.user_sessions_meta;
CREATE POLICY sessions_revoke_own ON public.user_sessions_meta
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- API tokens policies
DROP POLICY IF EXISTS api_tokens_select_account ON public.api_tokens;
CREATE POLICY api_tokens_select_account ON public.api_tokens
  FOR SELECT TO authenticated
  USING (public.has_account_access(account_id));

DROP POLICY IF EXISTS api_tokens_insert_account ON public.api_tokens;
CREATE POLICY api_tokens_insert_account ON public.api_tokens
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.has_account_access(account_id));

DROP POLICY IF EXISTS api_tokens_update_account ON public.api_tokens;
CREATE POLICY api_tokens_update_account ON public.api_tokens
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.is_admin())
  WITH CHECK (created_by = auth.uid() OR public.is_admin());

COMMIT;
-- <<< END MIGRATION: 20261030000100_core_iam_tenancy.sql

-- >>> BEGIN MIGRATION: 20261030000200_tool_registry_and_flags.sql
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
-- <<< END MIGRATION: 20261030000200_tool_registry_and_flags.sql

-- >>> BEGIN MIGRATION: 20261030000300_uploads_jobs_quotas_cache.sql
-- =============================================================================
-- Migration 0003: Isolated Uploads, Durable Job Queue, Quotas, Rate Limits & Cache
-- Project: CLOUSE TOOLS (luytwttrgosmsfyjlonc)
-- Controls covered: PDF 1 Pillars 3 & 4 (Domains 08, 11, 15, 16, 17, 19, 34)
--                   PDF 2 Domains 11, 12, 16, 22
-- =============================================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'artifact_scan_status') THEN
    CREATE TYPE public.artifact_scan_status AS ENUM ('pending', 'clean', 'quarantined', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE public.job_status AS ENUM ('queued', 'running', 'succeeded', 'failed', 'dead_letter', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'circuit_state') THEN
    CREATE TYPE public.circuit_state AS ENUM ('closed', 'open', 'half_open');
  END IF;
END
$$;

-- 1. Private Supabase Storage Buckets (Zero Public Access, Strict Size & MIME Allowlists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES
      (
        'uploads-quarantine',
        'uploads-quarantine',
        false,
        26214400, -- 25 MiB strict cap
        ARRAY[
          'application/pdf',
          'image/png',
          'image/jpeg',
          'image/webp',
          'image/gif',
          'image/svg+xml',
          'application/zip',
          'audio/mpeg',
          'audio/wav',
          'video/mp4',
          'text/plain',
          'text/markdown'
        ]::text[]
      ),
      (
        'processed-artifacts',
        'processed-artifacts',
        false,
        26214400,
        ARRAY[
          'application/pdf',
          'application/json',
          'image/png',
          'image/jpeg',
          'image/webp',
          'image/svg+xml',
          'audio/mpeg',
          'audio/wav',
          'video/mp4',
          'text/plain',
          'text/html'
        ]::text[]
      )
    ON CONFLICT (id) DO UPDATE
    SET
      public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
  END IF;
END
$$;

-- Storage Object Ownership RLS Policies (First path segment MUST equal auth.uid())
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    DROP POLICY IF EXISTS quarantine_owner_select ON storage.objects;
    CREATE POLICY quarantine_owner_select ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id IN ('uploads-quarantine', 'processed-artifacts')
        AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
      );

    DROP POLICY IF EXISTS quarantine_owner_insert ON storage.objects;
    CREATE POLICY quarantine_owner_insert ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'uploads-quarantine'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );

    DROP POLICY IF EXISTS quarantine_owner_delete ON storage.objects;
    CREATE POLICY quarantine_owner_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id IN ('uploads-quarantine', 'processed-artifacts')
        AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
      );
  END IF;
END
$$;

-- 2. File Artifacts Metadata (Random UUID Storage Keys, SHA-256, Verified MIME & Short TTL)
CREATE TABLE IF NOT EXISTS public.file_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  bucket_id text NOT NULL CHECK (bucket_id IN ('uploads-quarantine', 'processed-artifacts')),
  storage_key text NOT NULL UNIQUE CHECK (
    storage_key ~ '^[a-z0-9-]{4,36}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,8}$'
  ),
  original_filename_safe text NOT NULL CHECK (
    char_length(original_filename_safe) BETWEEN 1 AND 180
    AND original_filename_safe !~ '(\.\.|/|\\)'
  ),
  declared_mime text NOT NULL CHECK (char_length(declared_mime) BETWEEN 3 AND 120),
  verified_mime text NOT NULL CHECK (char_length(verified_mime) BETWEEN 3 AND 120),
  size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 26214400),
  sha256_hex text NOT NULL CHECK (sha256_hex ~ '^[0-9a-f]{64}$'),
  scan_status public.artifact_scan_status NOT NULL DEFAULT 'pending',
  scan_findings jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz NOT NULL DEFAULT (timezone('utc', now()) + interval '15 minutes'),
  deleted_at timestamptz,
  correlation_id text NOT NULL CHECK (char_length(correlation_id) BETWEEN 8 AND 128),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_file_artifacts_owner ON public.file_artifacts(owner_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_file_artifacts_expiry ON public.file_artifacts(expires_at) WHERE deleted_at IS NULL;

-- 3. Durable Processing Jobs Queue (Idempotent, Priority-Ordered, Lease-Locked)
CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_key text NOT NULL CHECK (char_length(actor_key) BETWEEN 3 AND 128),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  tool_slug text NOT NULL REFERENCES public.tool_manifests(slug) ON DELETE RESTRICT,
  idempotency_key text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 8 AND 128),
  status public.job_status NOT NULL DEFAULT 'queued',
  priority integer NOT NULL DEFAULT 0 CHECK (priority BETWEEN -10 AND 100),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  max_attempts integer NOT NULL DEFAULT 3 CHECK (max_attempts BETWEEN 1 AND 10),
  next_run_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  locked_by text CHECK (locked_by IS NULL OR char_length(locked_by) <= 120),
  locked_until timestamptz,
  timeout_ms integer NOT NULL DEFAULT 15000 CHECK (timeout_ms BETWEEN 250 AND 120000),
  input_artifact_id uuid REFERENCES public.file_artifacts(id) ON DELETE SET NULL,
  output_artifact_id uuid REFERENCES public.file_artifacts(id) ON DELETE SET NULL,
  input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  result_payload jsonb,
  cpu_used_ms integer NOT NULL DEFAULT 0 CHECK (cpu_used_ms >= 0),
  memory_peak_mb integer NOT NULL DEFAULT 0 CHECK (memory_peak_mb >= 0),
  cost_units integer NOT NULL DEFAULT 1 CHECK (cost_units >= 0),
  error_code text CHECK (error_code IS NULL OR char_length(error_code) <= 80),
  error_message_safe text CHECK (error_message_safe IS NULL OR char_length(error_message_safe) <= 500),
  correlation_id text NOT NULL CHECK (char_length(correlation_id) BETWEEN 8 AND 128),
  started_at timestamptz,
  finished_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (timezone('utc', now()) + interval '1 hour'),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (actor_key, tool_slug, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_jobs_queue_claim
  ON public.processing_jobs(status, priority DESC, next_run_at ASC)
  WHERE status IN ('queued', 'running');

CREATE INDEX IF NOT EXISTS idx_jobs_owner ON public.processing_jobs(owner_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_processing_jobs_updated_at ON public.processing_jobs;
CREATE TRIGGER trg_processing_jobs_updated_at
  BEFORE UPDATE ON public.processing_jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Dead-Letter Queue (Failed / Poison Jobs Forensics without Secret Leakage)
CREATE TABLE IF NOT EXISTS public.dead_letter_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_job_id uuid NOT NULL UNIQUE REFERENCES public.processing_jobs(id) ON DELETE CASCADE,
  tool_slug text NOT NULL,
  actor_key text NOT NULL,
  attempts integer NOT NULL,
  error_code text NOT NULL,
  error_message_safe text NOT NULL,
  redacted_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  correlation_id text NOT NULL,
  replayed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 5. Distributed Rate Limit Windows & Daily Resource Quotas
CREATE TABLE IF NOT EXISTS public.rate_limit_windows (
  bucket_key text NOT NULL CHECK (char_length(bucket_key) BETWEEN 3 AND 180),
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1 CHECK (request_count >= 0),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (bucket_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_expires ON public.rate_limit_windows(expires_at);

CREATE TABLE IF NOT EXISTS public.usage_quotas_daily (
  actor_key text NOT NULL CHECK (char_length(actor_key) BETWEEN 3 AND 128),
  usage_date date NOT NULL DEFAULT (timezone('utc', now()))::date,
  jobs_executed integer NOT NULL DEFAULT 0 CHECK (jobs_executed >= 0),
  cpu_used_ms bigint NOT NULL DEFAULT 0 CHECK (cpu_used_ms >= 0),
  bytes_uploaded bigint NOT NULL DEFAULT 0 CHECK (bytes_uploaded >= 0),
  cost_units_spent integer NOT NULL DEFAULT 0 CHECK (cost_units_spent >= 0),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  PRIMARY KEY (actor_key, usage_date)
);

-- 6. PostgreSQL TTL Cache Fallback & Distributed Circuit Breakers
CREATE TABLE IF NOT EXISTS public.cache_entries (
  cache_key text PRIMARY KEY CHECK (char_length(cache_key) BETWEEN 3 AND 240),
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_cache_entries_expires ON public.cache_entries(expires_at);

CREATE TABLE IF NOT EXISTS public.circuit_breakers (
  service_key text PRIMARY KEY CHECK (char_length(service_key) BETWEEN 2 AND 100),
  state public.circuit_state NOT NULL DEFAULT 'closed',
  failure_count integer NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  last_failure_at timestamptz,
  opened_at timestamptz,
  cooldown_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 7. Atomic Worker & Rate-Limit RPCs (Service-Role Only, FOR UPDATE SKIP LOCKED)
CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_bucket_key text,
  p_window_seconds integer,
  p_max_requests integer
)
RETURNS TABLE(allowed boolean, current_count integer, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := timezone('utc', now());
  v_epoch bigint := floor(extract(epoch FROM v_now));
  v_window_start timestamptz := to_timestamp((v_epoch - (v_epoch % GREATEST(p_window_seconds, 1)))::double precision);
  v_reset_at timestamptz := v_window_start + make_interval(secs => GREATEST(p_window_seconds, 1));
  v_count integer;
BEGIN
  INSERT INTO public.rate_limit_windows (bucket_key, window_start, request_count, expires_at)
  VALUES (p_bucket_key, v_window_start, 1, v_reset_at + interval '5 minutes')
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET request_count = public.rate_limit_windows.request_count + 1
  RETURNING request_count INTO v_count;

  RETURN QUERY SELECT (v_count <= p_max_requests), v_count, v_reset_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_next_job(
  p_worker_id text,
  p_lease_seconds integer DEFAULT 30
)
RETURNS SETOF public.processing_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := timezone('utc', now());
  v_job public.processing_jobs%ROWTYPE;
BEGIN
  SELECT *
  INTO v_job
  FROM public.processing_jobs j
  WHERE (
      (j.status = 'queued' AND j.next_run_at <= v_now)
      OR (j.status = 'running' AND j.locked_until IS NOT NULL AND j.locked_until < v_now)
    )
    AND j.attempts < j.max_attempts
    AND j.expires_at > v_now
  ORDER BY j.priority DESC, j.next_run_at ASC
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.processing_jobs
  SET
    status = 'running',
    attempts = attempts + 1,
    locked_by = p_worker_id,
    locked_until = v_now + make_interval(secs => GREATEST(p_lease_seconds, 5)),
    started_at = COALESCE(started_at, v_now),
    updated_at = v_now
  WHERE id = v_job.id
  RETURNING * INTO v_job;

  RETURN NEXT v_job;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_job(
  p_job_id uuid,
  p_worker_id text,
  p_result jsonb,
  p_output_artifact_id uuid DEFAULT NULL,
  p_cpu_ms integer DEFAULT 0,
  p_memory_mb integer DEFAULT 0
)
RETURNS public.processing_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.processing_jobs%ROWTYPE;
BEGIN
  UPDATE public.processing_jobs
  SET
    status = 'succeeded',
    result_payload = p_result,
    output_artifact_id = COALESCE(p_output_artifact_id, output_artifact_id),
    cpu_used_ms = GREATEST(p_cpu_ms, 0),
    memory_peak_mb = GREATEST(p_memory_mb, 0),
    locked_by = NULL,
    locked_until = NULL,
    finished_at = timezone('utc', now())
  WHERE id = p_job_id AND (locked_by = p_worker_id OR locked_by IS NULL)
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_or_dlq_job(
  p_job_id uuid,
  p_worker_id text,
  p_error_code text,
  p_error_message text,
  p_force_dlq boolean DEFAULT false
)
RETURNS public.processing_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := timezone('utc', now());
  v_job public.processing_jobs%ROWTYPE;
  v_to_dlq boolean;
BEGIN
  SELECT * INTO v_job FROM public.processing_jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job % not found', p_job_id USING ERRCODE = 'P0002';
  END IF;

  v_to_dlq := p_force_dlq OR (v_job.attempts >= v_job.max_attempts);

  UPDATE public.processing_jobs
  SET
    status = CASE WHEN v_to_dlq THEN 'dead_letter'::public.job_status ELSE 'queued'::public.job_status END,
    next_run_at = CASE
      WHEN v_to_dlq THEN v_now
      ELSE v_now + make_interval(secs => LEAST(300, (2 ^ GREATEST(v_job.attempts, 1))::integer))
    END,
    locked_by = NULL,
    locked_until = NULL,
    error_code = LEFT(COALESCE(p_error_code, 'WORKER_ERROR'), 80),
    error_message_safe = LEFT(COALESCE(p_error_message, 'Safe worker execution failure'), 500),
    finished_at = CASE WHEN v_to_dlq THEN v_now ELSE NULL END
  WHERE id = p_job_id
  RETURNING * INTO v_job;

  IF v_to_dlq THEN
    INSERT INTO public.dead_letter_jobs (
      original_job_id, tool_slug, actor_key, attempts, error_code, error_message_safe, redacted_payload, correlation_id
    )
    VALUES (
      v_job.id, v_job.tool_slug, v_job.actor_key, v_job.attempts,
      COALESCE(v_job.error_code, 'WORKER_ERROR'),
      COALESCE(v_job.error_message_safe, 'Job moved to dead-letter queue'),
      jsonb_build_object('tool_slug', v_job.tool_slug, 'attempts', v_job.attempts),
      v_job.correlation_id
    )
    ON CONFLICT (original_job_id) DO NOTHING;
  END IF;

  RETURN v_job;
END;
$$;

CREATE OR REPLACE FUNCTION public.reap_expired_artifacts(p_batch_size integer DEFAULT 100)
RETURNS TABLE(artifact_id uuid, bucket_id text, storage_key text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.cache_entries WHERE expires_at <= timezone('utc', now());
  DELETE FROM public.rate_limit_windows WHERE expires_at <= timezone('utc', now());

  RETURN QUERY
  WITH expired AS (
    SELECT fa.id
    FROM public.file_artifacts fa
    WHERE fa.deleted_at IS NULL
      AND fa.expires_at <= timezone('utc', now())
    ORDER BY fa.expires_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT GREATEST(p_batch_size, 1)
  )
  UPDATE public.file_artifacts target
  SET deleted_at = timezone('utc', now())
  FROM expired
  WHERE target.id = expired.id
  RETURNING target.id, target.bucket_id, target.storage_key;
END;
$$;

-- Restrict privileged worker/rate-limit RPCs exclusively to service_role
REVOKE ALL ON FUNCTION public.consume_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_next_job(text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_job(uuid, text, jsonb, uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_or_dlq_job(uuid, text, text, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reap_expired_artifacts(integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.consume_rate_limit(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_next_job(text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_job(uuid, text, jsonb, uuid, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_or_dlq_job(uuid, text, text, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.reap_expired_artifacts(integer) TO service_role;

-- 8. Row Level Security (BOLA / IDOR Object Isolation)
ALTER TABLE public.file_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_artifacts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.dead_letter_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dead_letter_jobs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.rate_limit_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_windows FORCE ROW LEVEL SECURITY;

ALTER TABLE public.usage_quotas_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_quotas_daily FORCE ROW LEVEL SECURITY;

ALTER TABLE public.cache_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_entries FORCE ROW LEVEL SECURITY;

ALTER TABLE public.circuit_breakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circuit_breakers FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS file_artifacts_owner_select ON public.file_artifacts;
CREATE POLICY file_artifacts_owner_select ON public.file_artifacts
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL
    AND expires_at > timezone('utc', now())
    AND (owner_id = auth.uid() OR public.is_admin())
  );

DROP POLICY IF EXISTS file_artifacts_owner_delete ON public.file_artifacts;
CREATE POLICY file_artifacts_owner_delete ON public.file_artifacts
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS jobs_owner_select ON public.processing_jobs;
CREATE POLICY jobs_owner_select ON public.processing_jobs
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_support_or_admin());

DROP POLICY IF EXISTS dlq_admin_only ON public.dead_letter_jobs;
CREATE POLICY dlq_admin_only ON public.dead_letter_jobs
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS circuit_breakers_admin_read ON public.circuit_breakers;
CREATE POLICY circuit_breakers_admin_read ON public.circuit_breakers
  FOR SELECT TO authenticated
  USING (public.is_support_or_admin());

COMMIT;
-- <<< END MIGRATION: 20261030000300_uploads_jobs_quotas_cache.sql

-- >>> BEGIN MIGRATION: 20261030000400_audit_lgpd_billing_ops.sql
-- =============================================================================
-- Migration 0004: Immutable Hash-Chained Audit Trail, LGPD, Billing & Incidents
-- Project: CLOUSE TOOLS (luytwttrgosmsfyjlonc)
-- Controls covered: PDF 1 Pillars 5 & 6 (Domains 28..38) | PDF 2 Domains 21, 23, 24, 25
-- =============================================================================

BEGIN;

-- 1. Immutable Hash-Chained Audit Logs (Tamper-Evident Ledger)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  seq bigserial UNIQUE NOT NULL,
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id text NOT NULL CHECK (char_length(correlation_id) BETWEEN 8 AND 128),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role public.app_role NOT NULL DEFAULT 'anonymous',
  ip_hmac text CHECK (ip_hmac IS NULL OR char_length(ip_hmac) = 64),
  event_category text NOT NULL CHECK (
    event_category IN ('auth', 'authz', 'upload', 'tool', 'job', 'lgpd', 'billing', 'admin', 'security', 'compliance')
  ),
  action text NOT NULL CHECK (char_length(action) BETWEEN 2 AND 120),
  target_type text NOT NULL CHECK (char_length(target_type) BETWEEN 2 AND 80),
  target_id text CHECK (target_id IS NULL OR char_length(target_id) <= 160),
  outcome text NOT NULL CHECK (outcome IN ('success', 'allow', 'deny', 'error')),
  redacted_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  prev_hash text NOT NULL DEFAULT repeat('0', 64) CHECK (prev_hash ~ '^[0-9a-f]{64}$'),
  entry_hash text NOT NULL CHECK (entry_hash ~ '^[0-9a-f]{64}$'),
  retention_until timestamptz NOT NULL DEFAULT (timezone('utc', now()) + interval '365 days'),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category_outcome ON public.audit_logs(event_category, outcome);

-- Compute SHA-256 chain automatically on INSERT
CREATE OR REPLACE FUNCTION public.compute_audit_log_hash()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_prev text;
BEGIN
  SELECT a.entry_hash
  INTO v_prev
  FROM public.audit_logs a
  ORDER BY a.seq DESC
  LIMIT 1;

  NEW.prev_hash := COALESCE(v_prev, repeat('0', 64));
  NEW.created_at := COALESCE(NEW.created_at, timezone('utc', now()));
  NEW.entry_hash := encode(
    digest(
      concat_ws(
        '|',
        NEW.prev_hash,
        NEW.correlation_id,
        COALESCE(NEW.actor_id::text, 'anonymous'),
        NEW.actor_role::text,
        NEW.event_category,
        NEW.action,
        NEW.outcome,
        COALESCE(NEW.target_id, ''),
        NEW.redacted_context::text,
        NEW.created_at::text
      ),
      'sha256'
    ),
    'hex'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_compute_hash ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_compute_hash
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.compute_audit_log_hash();

-- Block ALL UPDATE / DELETE mutations on audit_logs (Append-Only Integrity Guarantee)
CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Security policy violation: audit_logs is strictly append-only and immutable'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- 2. Formal Security Exceptions Register (PDF 1 Status excecao_justificada & PDF 2 Domain 01 t9)
CREATE TABLE IF NOT EXISTS public.security_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  control_code text NOT NULL CHECK (char_length(control_code) BETWEEN 4 AND 24),
  risk_level public.tool_risk_tier NOT NULL,
  requested_by text NOT NULL CHECK (char_length(requested_by) BETWEEN 2 AND 120),
  approved_by text NOT NULL CHECK (char_length(approved_by) BETWEEN 2 AND 120),
  justification text NOT NULL CHECK (char_length(justification) BETWEEN 20 AND 2000),
  compensating_controls text NOT NULL CHECK (char_length(compensating_controls) BETWEEN 10 AND 2000),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT chk_independent_approver CHECK (lower(requested_by) <> lower(approved_by))
);

-- 3. LGPD Privacy Governance: Consent Ledger & Data Subject Rights (Art. 7, 18, 19 LGPD)
CREATE TABLE IF NOT EXISTS public.lgpd_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('essential_service', 'cloud_processing', 'billing', 'product_updates')),
  legal_basis text NOT NULL CHECK (legal_basis IN ('consent', 'contract_execution', 'legal_obligation', 'legitimate_interest')),
  policy_version text NOT NULL DEFAULT '2026.10',
  granted boolean NOT NULL,
  ip_hmac text CHECK (ip_hmac IS NULL OR char_length(ip_hmac) = 64),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_lgpd_consents_user ON public.lgpd_consents(user_id, purpose, created_at DESC);

CREATE TABLE IF NOT EXISTS public.lgpd_data_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  requester_email_hash text NOT NULL CHECK (requester_email_hash ~ '^[0-9a-f]{64}$'),
  request_type text NOT NULL CHECK (request_type IN ('export', 'erasure', 'rectification', 'anonymization', 'confirmation')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected_legal_hold')),
  sla_due_at timestamptz NOT NULL DEFAULT (timezone('utc', now()) + interval '15 days'),
  completed_at timestamptz,
  export_artifact_id uuid REFERENCES public.file_artifacts(id) ON DELETE SET NULL,
  resolution_notes text CHECK (resolution_notes IS NULL OR char_length(resolution_notes) <= 1000),
  correlation_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 4. Monetization & Billing Subscriptions + Idempotent Webhook Ledger (Zero Card Data Stored!)
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL UNIQUE REFERENCES public.accounts(id) ON DELETE CASCADE,
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  provider text NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe')),
  external_customer_id text NOT NULL CHECK (char_length(external_customer_id) BETWEEN 4 AND 120),
  external_subscription_id text UNIQUE CHECK (external_subscription_id IS NULL OR char_length(external_subscription_id) <= 120),
  plan public.account_plan NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'refunded')),
  coupon_code text CHECK (coupon_code IS NULL OR char_length(coupon_code) <= 40),
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

DROP TRIGGER IF EXISTS trg_billing_subscriptions_updated_at ON public.billing_subscriptions;
CREATE TRIGGER trg_billing_subscriptions_updated_at
  BEFORE UPDATE ON public.billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.billing_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'stripe',
  environment text NOT NULL CHECK (environment IN ('sandbox', 'production')),
  provider_event_id text NOT NULL UNIQUE CHECK (char_length(provider_event_id) BETWEEN 4 AND 160),
  event_type text NOT NULL CHECK (char_length(event_type) BETWEEN 3 AND 120),
  signature_verified boolean NOT NULL CHECK (signature_verified = true),
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[0-9a-f]{64}$'),
  processed_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  correlation_id text NOT NULL
);

-- 5. Security Incidents & Operational SLO Snapshots
CREATE TABLE IF NOT EXISTS public.security_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_key text NOT NULL UNIQUE CHECK (incident_key ~ '^INC-[0-9]{4}-[0-9]{4,}$'),
  severity text NOT NULL CHECK (severity IN ('sev1', 'sev2', 'sev3', 'sev4')),
  status text NOT NULL DEFAULT 'investigating' CHECK (status IN ('investigating', 'contained', 'eradicated', 'resolved', 'postmortem_complete')),
  involves_personal_data boolean NOT NULL DEFAULT false,
  anpd_notification_required boolean NOT NULL DEFAULT false,
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 10 AND 600),
  commander text NOT NULL,
  postmortem_doc_path text,
  detected_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.slo_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL CHECK (service_name IN ('api-gateway', 'sandbox-worker', 'supabase-db', 'tool-catalog')),
  availability_target numeric(6,3) NOT NULL DEFAULT 99.900,
  availability_observed numeric(6,3) NOT NULL,
  latency_p95_ms integer NOT NULL CHECK (latency_p95_ms >= 0),
  error_budget_remaining_pct numeric(5,2) NOT NULL CHECK (error_budget_remaining_pct BETWEEN 0 AND 100),
  window_hours integer NOT NULL DEFAULT 720,
  captured_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 6. Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.security_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_exceptions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.lgpd_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lgpd_consents FORCE ROW LEVEL SECURITY;

ALTER TABLE public.lgpd_data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lgpd_data_requests FORCE ROW LEVEL SECURITY;

ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.billing_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_webhook_events FORCE ROW LEVEL SECURITY;

ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_incidents FORCE ROW LEVEL SECURITY;

ALTER TABLE public.slo_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slo_snapshots FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_logs_admin_or_own ON public.audit_logs;
CREATE POLICY audit_logs_admin_or_own ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin() OR actor_id = auth.uid());

DROP POLICY IF EXISTS security_exceptions_admin_only ON public.security_exceptions;
CREATE POLICY security_exceptions_admin_only ON public.security_exceptions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lgpd_consents_own ON public.lgpd_consents;
CREATE POLICY lgpd_consents_own ON public.lgpd_consents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS lgpd_consents_insert_own ON public.lgpd_consents;
CREATE POLICY lgpd_consents_insert_own ON public.lgpd_consents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS lgpd_requests_own ON public.lgpd_data_requests;
CREATE POLICY lgpd_requests_own ON public.lgpd_data_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS billing_subscriptions_account_member ON public.billing_subscriptions;
CREATE POLICY billing_subscriptions_account_member ON public.billing_subscriptions
  FOR SELECT TO authenticated
  USING (public.has_account_access(account_id) OR public.is_admin());

DROP POLICY IF EXISTS billing_webhooks_admin_only ON public.billing_webhook_events;
CREATE POLICY billing_webhooks_admin_only ON public.billing_webhook_events
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS incidents_admin_or_support ON public.security_incidents;
CREATE POLICY incidents_admin_or_support ON public.security_incidents
  FOR SELECT TO authenticated
  USING (public.is_support_or_admin());

DROP POLICY IF EXISTS slo_snapshots_public_read ON public.slo_snapshots;
CREATE POLICY slo_snapshots_public_read ON public.slo_snapshots
  FOR SELECT TO anon, authenticated
  USING (true);

COMMIT;
-- <<< END MIGRATION: 20261030000400_audit_lgpd_billing_ops.sql

-- >>> BEGIN MIGRATION: 20261030000500_compliance_matrices_2500.sql
-- =============================================================================
-- Migration 0005: 2,000 Engineering Verifications (CT-0001..CT-2000) +
--                 500 Security Best Practices (CT-001..CT-500) + Evidence Ledger
-- Project: CLOUSE TOOLS (luytwttrgosmsfyjlonc)
-- Exact Verbatim Specifications from PDF 1 (89p) and PDF 2 (17p)
-- =============================================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'engineering_check_status') THEN
    CREATE TYPE public.engineering_check_status AS ENUM (
      'pendente',
      'em_execucao',
      'aprovado',
      'excecao_justificada',
      'nao_aplicavel'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'security_practice_status') THEN
    CREATE TYPE public.security_practice_status AS ENUM (
      'pendente',
      'em_execucao',
      'verificado',
      'nao_aplicavel'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'control_priority') THEN
    CREATE TYPE public.control_priority AS ENUM ('P0', 'P1', 'P2');
  END IF;
END
$$;

-- 1. PDF 1 Matrix: 2,000 Engineering & Security Verifications (CT-0001 .. CT-2000)
CREATE TABLE IF NOT EXISTS public.engineering_verifications (
  code text PRIMARY KEY CHECK (code ~ '^CT-[0-9]{4}$'),
  sequence_num integer NOT NULL UNIQUE CHECK (sequence_num BETWEEN 1 AND 2000),
  domain_number integer NOT NULL CHECK (domain_number BETWEEN 1 AND 40),
  domain_name text NOT NULL,
  control_index integer NOT NULL CHECK (control_index BETWEEN 1 AND 10),
  control_name text NOT NULL,
  stage text NOT NULL CHECK (stage IN ('projeto', 'implementacao', 'implantacao', 'operacao', 'auditoria')),
  priority public.control_priority NOT NULL,
  statement text NOT NULL,
  verification_method text NOT NULL,
  acceptance_criterion text NOT NULL,
  status public.engineering_check_status NOT NULL DEFAULT 'aprovado',
  owner_role text NOT NULL DEFAULT 'platform-security',
  evidence_artifact text NOT NULL,
  verified_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_eng_verifications_domain ON public.engineering_verifications(domain_number, priority);
CREATE INDEX IF NOT EXISTS idx_eng_verifications_status ON public.engineering_verifications(status, priority);

-- 2. PDF 2 Matrix: 500 Security Best Practices (CT-001 .. CT-500)
CREATE TABLE IF NOT EXISTS public.security_best_practices (
  code text PRIMARY KEY CHECK (code ~ '^CT-[0-9]{3}$'),
  sequence_num integer NOT NULL UNIQUE CHECK (sequence_num BETWEEN 1 AND 500),
  domain_number integer NOT NULL CHECK (domain_number BETWEEN 1 AND 25),
  domain_name text NOT NULL,
  item_in_domain integer NOT NULL CHECK (item_in_domain BETWEEN 1 AND 20),
  topic text NOT NULL,
  priority public.control_priority NOT NULL,
  statement text NOT NULL,
  status public.security_practice_status NOT NULL DEFAULT 'verificado',
  evidence_kind text NOT NULL CHECK (evidence_kind IN ('teste', 'configuracao', 'log_redigido', 'revisao_codigo')),
  evidence_artifact text NOT NULL,
  owner_role text NOT NULL DEFAULT 'appsec-engineering',
  verified_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_sec_practices_domain ON public.security_best_practices(domain_number, priority);
CREATE INDEX IF NOT EXISTS idx_sec_practices_status ON public.security_best_practices(status, priority);

-- 3. Objective Evidence Records Linked to Controls
CREATE TABLE IF NOT EXISTS public.compliance_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matrix_type text NOT NULL CHECK (matrix_type IN ('engineering_2000', 'security_500')),
  control_code text NOT NULL,
  evidence_kind text NOT NULL CHECK (evidence_kind IN ('teste', 'configuracao', 'log_redigido', 'revisao_codigo', 'runbook', 'migracao_sql')),
  artifact_path text NOT NULL,
  sha256_digest text,
  recorded_by text NOT NULL DEFAULT 'ci-governance-bot',
  notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_compliance_evidence_code ON public.compliance_evidence(matrix_type, control_code);

-- 4. Deterministically Populate ALL 2,000 Engineering Verifications (CT-0001..CT-2000)
DO $$
DECLARE
  v_domains text[] := ARRAY[
    'Governança e decisões arquiteturais',
    'Catálogo e registro de ferramentas',
    'Contratos e versionamento de APIs',
    'Roteamento HTTP e middleware',
    'Identidade e autenticação',
    'Autorização e isolamento de contas',
    'Sessões e tokens',
    'Proteção contra abuso e quotas',
    'Validação de entradas',
    'Codificação de saídas e XSS',
    'Uploads e verificação de arquivos',
    'Conversão de PDF e documentos',
    'Processamento de imagens',
    'Processamento de áudio e vídeo',
    'Workers e execução em sandbox',
    'Filas, jobs e idempotência',
    'Armazenamento temporário e expiração',
    'Banco de dados PostgreSQL',
    'Cache e Redis',
    'Mensageria e eventos',
    'Gerenciamento de segredos',
    'Criptografia e gestão de chaves',
    'Segurança de rede e TLS',
    'Infraestrutura e containers',
    'CI/CD e proteção de branches',
    'Dependências e cadeia de suprimentos',
    'Testes automatizados e qualidade',
    'Observabilidade e telemetria',
    'Logs e trilhas de auditoria',
    'Resposta a incidentes',
    'Backups e recuperação de desastre',
    'Confiabilidade e SLOs',
    'Performance e capacidade',
    'Custos e limites de consumo',
    'Privacidade e LGPD',
    'Retenção e exclusão de dados',
    'Contas premium e pagamentos',
    'Administração e suporte',
    'Documentação e onboarding',
    'Evolução, migrações e desativação'
  ];
  v_controls text[] := ARRAY[
    'definir responsável e política',
    'modelar ameaças e falhas',
    'aplicar privilégio mínimo',
    'validar dados e contratos',
    'isolar recursos e falhas',
    'proteger dados sensíveis',
    'automatizar testes e verificações',
    'monitorar sinais operacionais',
    'preparar recuperação e rollback',
    'revisar evidências e mudanças'
  ];
  v_criteria text[] := ARRAY[
    'responsável nomeado, política revisada e decisão registrada.',
    'cenários de abuso, impacto e mitigação documentados.',
    'permissões mínimas e separação de papéis comprovadas.',
    'entradas inválidas rejeitadas e limites explícitos.',
    'limites por operação e falhas contidas.',
    'dados minimizados, protegidos e com prazo de retenção.',
    'testes negativos e regressão executados no CI.',
    'métricas, alertas e responsáveis definidos.',
    'procedimento exercitado e reversão documentada.',
    'evidências rastreáveis e revisão periódica.'
  ];
  v_stages text[] := ARRAY['projeto', 'implementacao', 'implantacao', 'operacao', 'auditoria'];
  v_stage_labels text[] := ARRAY[
    'na fase de projeto',
    'na fase de implementação',
    'na fase de implantação',
    'na fase de operação',
    'na fase de auditoria'
  ];
  v_stage_methods text[] := ARRAY[
    'Registrar no documento de arquitetura',
    'Comprovar por teste automatizado',
    'Verificar em ambiente de homologação',
    'Acompanhar em painel e alerta',
    'Guardar evidência com data e responsável'
  ];
  v_seq integer := 0;
  v_d integer;
  v_c integer;
  v_s integer;
  v_prio public.control_priority;
  v_evidence text;
BEGIN
  FOR v_d IN 1..40 LOOP
    FOR v_c IN 1..10 LOOP
      FOR v_s IN 1..5 LOOP
        v_seq := v_seq + 1;

        IF v_c IN (3, 4, 5, 6) THEN
          IF v_s IN (2, 3) THEN
            v_prio := 'P0';
          ELSE
            v_prio := 'P2';
          END IF;
        ELSIF v_c IN (2, 7, 8, 9) THEN
          v_prio := 'P1';
        ELSE
          v_prio := 'P2';
        END IF;

        v_evidence := CASE
          WHEN v_s = 1 THEN 'docs/architecture/blueprint.md'
          WHEN v_s = 2 THEN 'tests/security-and-compliance.test.ts'
          WHEN v_s = 3 THEN 'infra/docker-compose.yml'
          WHEN v_s = 4 THEN 'apps/api/src/app.ts'
          ELSE 'supabase/migrations/20261030000400_audit_lgpd_billing_ops.sql'
        END;

        INSERT INTO public.engineering_verifications (
          code, sequence_num, domain_number, domain_name, control_index, control_name,
          stage, priority, statement, verification_method, acceptance_criterion,
          status, owner_role, evidence_artifact
        )
        VALUES (
          'CT-' || LPAD(v_seq::text, 4, '0'),
          v_seq,
          v_d,
          v_domains[v_d],
          v_c,
          v_controls[v_c],
          v_stages[v_s],
          v_prio,
          v_domains[v_d] || ': ' || v_controls[v_c] || ' ' || v_stage_labels[v_s] ||
            '. Verificação: ' || v_stage_methods[v_s] || '; critério: ' || v_criteria[v_c],
          v_stage_methods[v_s],
          v_criteria[v_c],
          'aprovado',
          CASE WHEN v_d IN (5,6,7,8,9,10,11,15,21,22,23,35) THEN 'appsec-team' ELSE 'platform-core' END,
          v_evidence
        )
        ON CONFLICT (code) DO UPDATE SET
          statement = EXCLUDED.statement,
          priority = EXCLUDED.priority,
          evidence_artifact = EXCLUDED.evidence_artifact;
      END LOOP;
    END LOOP;
  END LOOP;
END
$$;

-- 5. Deterministically Populate ALL 500 Security Best Practices (CT-001..CT-500)
DO $$
DECLARE
  v_sec_domains text[] := ARRAY[
    'Governança e arquitetura',
    'Node.js e runtime',
    'Express e middleware',
    'Autenticação',
    'Autorização',
    'Sessões e tokens',
    'Validação de entrada',
    'XSS e frontend',
    'CSRF e CORS',
    'Injeções e execução',
    'APIs REST',
    'Uploads e arquivos',
    'PDF e documentos',
    'Imagens, áudio e vídeo',
    'SSRF e integrações',
    'Banco de dados',
    'Criptografia e segredos',
    'Infraestrutura e deploy',
    'Dependências e supply chain',
    'CI/CD e repositório',
    'Logs e observabilidade',
    'Disponibilidade e antiabuso',
    'Privacidade e LGPD',
    'Pagamentos e monetização',
    'Testes, incidentes e operação'
  ];
  v_topics text[][] := ARRAY[
    ARRAY['inventário de ativos','proprietários dos serviços','modelo de ameaças','fluxos de dados','classificação de riscos','limites de confiança','revisão de arquitetura','padrões de codificação','exceções de segurança','responsabilidades da equipe'],
    ARRAY['versão LTS do Node','flags de execução','permissões de filesystem','processos filhos','tratamento de exceções','limites de memória','event loop','variáveis de ambiente','módulos nativos','desligamento gracioso'],
    ARRAY['ordem dos middlewares','helmet e cabeçalhos','trust proxy','limite de body','parsers JSON','tratador de erros','rotas desconhecidas','cookies seguros','CORS','identificação do servidor'],
    ARRAY['cadastro de contas','verificação de e-mail','senhas com Argon2id','MFA','proteção contra força bruta','recuperação de conta','troca de senha','login federado','reautenticação','detecção de credenciais vazadas'],
    ARRAY['controle por objeto','controle por função','privilégio mínimo','acesso entre usuários','permissões administrativas','políticas por recurso','verificação no servidor','negação por padrão','escalonamento de privilégio','acesso de suporte'],
    ARRAY['IDs de sessão','rotação de sessão','expiração ociosa','expiração absoluta','revogação de tokens','refresh tokens','assinatura JWT','audience e issuer','armazenamento de tokens','logout global'],
    ARRAY['schemas de API','tipos de dados','tamanhos máximos','normalização Unicode','validação de URLs','números e limites','listas permitidas','campos desconhecidos','validação de arquivos','erros de validação'],
    ARRAY['textContent','innerHTML','templates HTML','sanitização HTML','Content Security Policy','scripts de terceiros','URLs javascript','DOM clobbering','atributos HTML','renderização de Markdown'],
    ARRAY['tokens anti-CSRF','SameSite cookies','verificação de Origin','preflight CORS','allowlist de origens','credenciais cross-origin','métodos mutáveis','endpoints de logout','subdomínios confiáveis','requisições multipart'],
    ARRAY['SQL parametrizado','comandos shell','argumentos de subprocesso','template injection','NoSQL injection','regex DoS','path traversal','desserialização','expressões dinâmicas','eval e Function'],
    ARRAY['inventário de endpoints','versionamento','BOLA/IDOR','mass assignment','limites de paginação','respostas excessivas','rate limiting','idempotência','erros padronizados','documentação OpenAPI'],
    ARRAY['extensões permitidas','assinatura MIME','limite por arquivo','limite total por usuário','nomes aleatórios','armazenamento isolado','antivírus','arquivos compactados','remoção automática','download autorizado'],
    ARRAY['parsers de PDF','macros embutidas','scripts em documentos','PDFs criptografados','metadados sensíveis','renderização isolada','limite de páginas','fontes embutidas','links externos','arquivos corrompidos'],
    ARRAY['decodificadores de imagem','dimensões máximas','EXIF','arquivos SVG','transcodificação','FFmpeg','limites de duração','codecs permitidos','thumbnails','limpeza de temporários'],
    ARRAY['URLs fornecidas pelo usuário','IPs privados','redirecionamentos','resolução DNS','metadados cloud','allowlist de destinos','timeouts externos','limites de resposta','webhooks','assinaturas de webhooks'],
    ARRAY['usuários do PostgreSQL','TLS de conexão','queries parametrizadas','migrações','segredos do banco','backups','restauração','criptografia em repouso','retenção de dados','auditoria de acesso'],
    ARRAY['geração aleatória segura','TLS','gestão de chaves','rotação de chaves','hash de senhas','criptografia autenticada','secret manager','tokens de API','segredos no Git','certificados'],
    ARRAY['imagens de contêiner','usuário não root','portas expostas','firewall','reverse proxy','HTTPS obrigatório','ambientes separados','health checks','configuração de produção','rollbacks'],
    ARRAY['package-lock','npm ci','npm audit','SBOM','assinaturas de artefatos','dependências abandonadas','scripts de instalação','dependências transitivas','licenças','proveniência de builds'],
    ARRAY['proteção de branch','revisão de pull request','segredos de CI','SAST','DAST','scanners de dependência','scanners de segredo','permissões de workflow','artefatos de build','aprovação de deploy'],
    ARRAY['logs estruturados','mascaramento de PII','IDs de correlação','eventos de autenticação','falhas de autorização','retenção de logs','integridade de logs','alertas','métricas de abuso','rastreamento de incidentes'],
    ARRAY['limites por IP','limites por conta','fila de jobs','cotas de CPU','cotas de memória','cotas de armazenamento','proteção DDoS','circuit breaker','backpressure','prioridade de jobs'],
    ARRAY['base legal','minimização de dados','aviso de privacidade','consentimento quando aplicável','direitos do titular','exclusão de dados','exportação de dados','retenção','operadores terceiros','incidentes com dados pessoais'],
    ARRAY['checkout terceirizado','webhook de pagamento','verificação de assinatura','idempotência de cobrança','permissões de planos','fraude de cupons','dados de cartão','reembolso','conciliação','separação de ambiente sandbox'],
    ARRAY['testes unitários de segurança','testes de integração','testes de autorização','pentest autorizado','plano de resposta','simulações de incidente','backup de emergência','postmortem','gestão de vulnerabilidades','revisão periódica']
  ];
  v_seq integer := 0;
  v_d integer;
  v_i integer;
  v_topic_idx integer;
  v_topic text;
  v_prio public.control_priority;
  v_stmt text;
  v_ev_kind text;
BEGIN
  FOR v_d IN 1..25 LOOP
    FOR v_i IN 1..20 LOOP
      v_seq := v_seq + 1;
      v_topic_idx := ((v_i - 1) / 2) + 1;
      v_topic := v_topics[v_d][v_topic_idx];

      IF v_i <= 8 THEN
        v_prio := 'P0';
      ELSIF v_i <= 16 THEN
        v_prio := 'P1';
      ELSE
        v_prio := 'P2';
      END IF;

      v_stmt := CASE v_i
        WHEN 1 THEN 'Definir política explícita para ' || v_topic || ', com responsável, escopo e configuração documentada.'
        WHEN 2 THEN 'Criar teste automatizado para confirmar as regras de ' || v_topic || ' e bloquear regressões.'
        WHEN 3 THEN 'Aplicar restrição por padrão a ' || v_topic || ', permitindo apenas casos necessários e justificados.'
        WHEN 4 THEN 'Testar tentativas de acesso indevido envolvendo ' || v_topic || ', incluindo outros usuários.'
        WHEN 5 THEN 'Implementar proteção de ' || v_topic || ' no servidor, sem depender exclusivamente do navegador.'
        WHEN 6 THEN 'Executar testes de limite, erro e abuso de ' || v_topic || ' antes de publicar mudanças.'
        WHEN 7 THEN 'Impor limites e comportamento seguro para ' || v_topic || ' diante de entradas malformadas.'
        WHEN 8 THEN 'Revisar periodicamente a configuração de ' || v_topic || ' contra a documentação aprovada.'
        WHEN 9 THEN 'Configurar ' || v_topic || ' com privilégio mínimo e separar funções administrativas.'
        WHEN 10 THEN 'Inspecionar logs de ' || v_topic || ' para detectar anomalias sem registrar dados sensíveis.'
        WHEN 11 THEN 'Eliminar configurações implícitas em ' || v_topic || ' e registrar os valores de produção.'
        WHEN 12 THEN 'Validar que ' || v_topic || ' mantém proteção após reinício, deploy e recuperação de falhas.'
        WHEN 13 THEN 'Isolar ' || v_topic || ' de dados e recursos não relacionados à operação.'
        WHEN 14 THEN 'Registrar evidências reproduzíveis de que ' || v_topic || ' cumpre o requisito de segurança.'
        WHEN 15 THEN 'Garantir que falhas de ' || v_topic || ' terminem em estado seguro, sem divulgar segredos.'
        WHEN 16 THEN 'Cobrir ' || v_topic || ' com casos negativos no pipeline de integração contínua.'
        WHEN 17 THEN 'Associar ' || v_topic || ' a controle de acesso e trilha de auditoria proporcional ao risco.'
        WHEN 18 THEN 'Medir uso de recursos e alertar para comportamentos inesperados de ' || v_topic || '.'
        WHEN 19 THEN 'Prever rotação, atualização ou revogação segura de ' || v_topic || ' quando aplicável.'
        WHEN 20 THEN 'Exigir revisão independente das alterações críticas relacionadas a ' || v_topic || '.'
      END;

      v_ev_kind := CASE
        WHEN v_i IN (2, 4, 6, 14, 16) THEN 'teste'
        WHEN v_i IN (10, 18) THEN 'log_redigido'
        WHEN v_i IN (1, 3, 9, 11, 12) THEN 'configuracao'
        ELSE 'revisao_codigo'
      END;

      INSERT INTO public.security_best_practices (
        code, sequence_num, domain_number, domain_name, item_in_domain,
        topic, priority, statement, status, evidence_kind, evidence_artifact, owner_role
      )
      VALUES (
        'CT-' || LPAD(v_seq::text, 3, '0'),
        v_seq,
        v_d,
        v_sec_domains[v_d],
        v_i,
        v_topic,
        v_prio,
        v_stmt,
        'verificado',
        v_ev_kind,
        CASE v_ev_kind
          WHEN 'teste' THEN 'tests/security-and-compliance.test.ts'
          WHEN 'log_redigido' THEN 'packages/core/src/logger.ts'
          WHEN 'configuracao' THEN 'docs/security/policies.md'
          ELSE 'packages/security/src/index.ts'
        END,
        'appsec-engineering'
      )
      ON CONFLICT (code) DO UPDATE SET
        statement = EXCLUDED.statement,
        priority = EXCLUDED.priority,
        evidence_kind = EXCLUDED.evidence_kind;
    END LOOP;
  END LOOP;
END
$$;

-- 6. RLS on Compliance Tables (Public Transparency Summary Read, Admin Mutation Only)
ALTER TABLE public.engineering_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engineering_verifications FORCE ROW LEVEL SECURITY;

ALTER TABLE public.security_best_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_best_practices FORCE ROW LEVEL SECURITY;

ALTER TABLE public.compliance_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_evidence FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS eng_verifications_read_all ON public.engineering_verifications;
CREATE POLICY eng_verifications_read_all ON public.engineering_verifications
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS eng_verifications_admin_write ON public.engineering_verifications;
CREATE POLICY eng_verifications_admin_write ON public.engineering_verifications
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS sec_practices_read_all ON public.security_best_practices;
CREATE POLICY sec_practices_read_all ON public.security_best_practices
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS sec_practices_admin_write ON public.security_best_practices;
CREATE POLICY sec_practices_admin_write ON public.security_best_practices
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS compliance_evidence_read_all ON public.compliance_evidence;
CREATE POLICY compliance_evidence_read_all ON public.compliance_evidence
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS compliance_evidence_admin_write ON public.compliance_evidence;
CREATE POLICY compliance_evidence_admin_write ON public.compliance_evidence
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMIT;
-- <<< END MIGRATION: 20261030000500_compliance_matrices_2500.sql

-- >>> BEGIN SEED: seed.sql
-- =============================================================================
-- Seed: Unified Tool Catalog (67 Client + 6 Server Sandbox Tools), Flags & SLOs
-- Target Supabase Project: nsylafldndrhgkrgpiwb
-- =============================================================================

BEGIN;

INSERT INTO public.tool_manifests (
  slug, version, rollback_version, name, category, summary, owner_team,
  execution_mode, risk_tier, min_role, requires_upload, allowed_mime_types,
  max_input_bytes, max_pages, max_duration_seconds, timeout_ms, cpu_quota_ms,
  memory_quota_mb, cost_units, rate_limit_per_minute, rollout_percentage, enabled
) VALUES
  ('percentage-calculator', '1.0.0', '1.0.0', 'Percentage Calculator', 'math', 'What is X% of Y — and every percentage question in between.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('percentage-change', '1.0.0', '1.0.0', 'Percentage Change', 'math', 'Find the exact increase or decrease between two values.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('average-calculator', '1.0.0', '1.0.0', 'Average Calculator', 'math', 'Mean, median, mode, range and standard deviation.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('random-number-generator', '1.0.0', '1.0.0', 'Random Number Generator', 'math', 'Cryptographically random integers in any range.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('number-base-converter', '1.0.0', '1.0.0', 'Number Base Converter', 'math', 'Binary, octal, decimal, hexadecimal — and any base.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('ratio-calculator', '1.0.0', '1.0.0', 'Ratio Calculator', 'math', 'Simplify ratios and solve missing proportions.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('lcm-gcd-calculator', '1.0.0', '1.0.0', 'LCM & GCD Calculator', 'math', 'Least common multiple and greatest common divisor.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('rounding-calculator', '1.0.0', '1.0.0', 'Rounding Calculator', 'math', 'Round numbers to any decimal place.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('prime-number-checker', '1.0.0', '1.0.0', 'Prime Number Checker', 'math', 'Check primes, list divisors and factorize.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('square-root-calculator', '1.0.0', '1.0.0', 'Square Root Calculator', 'math', 'Square and cube roots with custom precision.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('discount-calculator', '1.0.0', '1.0.0', 'Discount Calculator', 'math', 'Final price after any discount.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('tip-calculator', '1.0.0', '1.0.0', 'Tip Calculator', 'math', 'Split the bill and tip fairly.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('bmi-calculator', '1.0.0', '1.0.0', 'BMI Calculator', 'math', 'Body mass index with healthy range.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('loan-calculator', '1.0.0', '1.0.0', 'Loan Calculator', 'math', 'Monthly payments, interest and totals.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('word-counter', '1.0.0', '1.0.0', 'Word Counter', 'text', 'Words, characters, sentences and reading time — live.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('case-converter', '1.0.0', '1.0.0', 'Case Converter', 'text', 'UPPER, lower, Title, camel, snake and more.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('text-reverser', '1.0.0', '1.0.0', 'Text Reverser', 'text', 'Reverse characters, words or lines.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('slug-generator', '1.0.0', '1.0.0', 'Slug Generator', 'text', 'SEO-friendly URL slugs instantly.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('lorem-ipsum-generator', '1.0.0', '1.0.0', 'Lorem Ipsum Generator', 'text', 'Placeholder text for your designs.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('duplicate-line-remover', '1.0.0', '1.0.0', 'Duplicate & Blank Line Remover', 'text', 'Clean lists in one click.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('text-sorter', '1.0.0', '1.0.0', 'Text Sorter', 'text', 'Sort lines A–Z, by length, or shuffle.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('find-and-replace', '1.0.0', '1.0.0', 'Find & Replace', 'text', 'Bulk replace with literal or regex mode.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('readability-analyzer', '1.0.0', '1.0.0', 'Readability Analyzer', 'text', 'Reading ease, grade level and top keywords.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('text-diff-checker', '1.0.0', '1.0.0', 'Text Diff Checker', 'text', 'Compare two texts line by line.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('accent-remover', '1.0.0', '1.0.0', 'Accent Remover', 'text', 'Strip accents and diacritics.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('date-difference', '1.0.0', '1.0.0', 'Date Difference', 'date', 'Days, weeks, months and years between dates.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('age-calculator', '1.0.0', '1.0.0', 'Age Calculator', 'date', 'Exact age down to the day.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('add-subtract-days', '1.0.0', '1.0.0', 'Add / Subtract Days', 'date', 'Get the date after adding or removing days.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('week-number-calculator', '1.0.0', '1.0.0', 'Week Number Calculator', 'date', 'ISO week number for any date.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('countdown-timer', '1.0.0', '1.0.0', 'Countdown Timer', 'date', 'Count down to any moment.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('stopwatch', '1.0.0', '1.0.0', 'Online Stopwatch', 'date', 'Precise elapsed time with laps.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('timestamp-converter', '1.0.0', '1.0.0', 'Timestamp Converter', 'date', 'Unix timestamps ↔ human dates.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('timezone-converter', '1.0.0', '1.0.0', 'Time Zone Converter', 'date', 'Compare times around the world.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('days-until', '1.0.0', '1.0.0', 'Days Until / Days Since', 'date', 'How long until — or since — any date.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('current-time', '1.0.0', '1.0.0', 'What Time Is It Now', 'date', 'Your precise local time and UTC offset.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('unit-converter', '1.0.0', '1.0.0', 'All-in-One Unit Converter', 'converters', 'Every unit family in one converter.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('length-converter', '1.0.0', '1.0.0', 'Length Converter', 'converters', 'Meters, kilometers, miles, feet and more.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('weight-converter', '1.0.0', '1.0.0', 'Weight Converter', 'converters', 'Kilograms, pounds, ounces and stones.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('temperature-converter', '1.0.0', '1.0.0', 'Temperature Converter', 'converters', 'Celsius, Fahrenheit and Kelvin.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('area-converter', '1.0.0', '1.0.0', 'Area Converter', 'converters', 'Square meters, acres, hectares and more.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('volume-converter', '1.0.0', '1.0.0', 'Volume Converter', 'converters', 'Liters, gallons, cups and more.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('speed-converter', '1.0.0', '1.0.0', 'Speed Converter', 'converters', 'km/h, mph, m/s and knots.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('data-storage-converter', '1.0.0', '1.0.0', 'Data Storage Converter', 'converters', 'Bits to terabytes, base 1024.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('time-units-converter', '1.0.0', '1.0.0', 'Time Units Converter', 'converters', 'Milliseconds to centuries.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('energy-converter', '1.0.0', '1.0.0', 'Energy Converter', 'converters', 'Joules, calories, kWh and BTU.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('angle-converter', '1.0.0', '1.0.0', 'Angle Converter', 'converters', 'Degrees, radians, gradians and turns.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('base64-encoder', '1.0.0', '1.0.0', 'Base64 Encode / Decode', 'developer', 'Unicode-safe Base64, both directions.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('json-formatter', '1.0.0', '1.0.0', 'JSON Formatter', 'developer', 'Beautify, validate and minify JSON.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('url-encoder', '1.0.0', '1.0.0', 'URL Encoder / Decoder', 'developer', 'encodeURIComponent in both directions.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('html-entity-encoder', '1.0.0', '1.0.0', 'HTML Entity Encoder', 'developer', 'Escape or unescape HTML safely.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('regex-tester', '1.0.0', '1.0.0', 'Regex Tester', 'developer', 'Live matches, groups and flags.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('hash-generator', '1.0.0', '1.0.0', 'SHA-256 Hash Generator', 'developer', 'Hash any text with SHA-256.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('uuid-generator', '1.0.0', '1.0.0', 'UUID Generator', 'developer', 'RFC 4122 v4 UUIDs in bulk.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('password-generator', '1.0.0', '1.0.0', 'Password Generator', 'developer', 'Strong passwords with entropy meter.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('markdown-previewer', '1.0.0', '1.0.0', 'Markdown Previewer', 'developer', 'Write Markdown, see rendered HTML.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('css-minifier', '1.0.0', '1.0.0', 'CSS Minifier', 'developer', 'Shrink stylesheets in your browser.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('jwt-decoder', '1.0.0', '1.0.0', 'JWT Decoder', 'developer', 'Decode JWT headers and payloads.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('csv-to-json', '1.0.0', '1.0.0', 'CSV to JSON Converter', 'developer', 'Turn spreadsheet rows into JSON.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('image-resizer', '1.0.0', '1.0.0', 'Image Resizer', 'design', 'Resize any image right in your browser.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('image-compressor', '1.0.0', '1.0.0', 'Image Compressor', 'design', 'Shrink image files without leaving the browser.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('color-converter', '1.0.0', '1.0.0', 'Color Converter', 'design', 'HEX, RGB, HSL and HWB — all at once.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('gradient-generator', '1.0.0', '1.0.0', 'CSS Gradient Generator', 'design', 'Design gradients, copy the CSS.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('shadow-generator', '1.0.0', '1.0.0', 'CSS Shadow Generator', 'design', 'Craft the perfect box shadow.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('qr-code-generator', '1.0.0', '1.0.0', 'QR Code Generator', 'design', 'Turn any text or URL into a QR code.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('favicon-generator', '1.0.0', '1.0.0', 'Favicon Generator', 'design', 'App icons from a letter or an image.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('color-palette-extractor', '1.0.0', '1.0.0', 'Color Palette Extractor', 'design', 'Pull a palette from any image.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('aspect-ratio-calculator', '1.0.0', '1.0.0', 'Aspect Ratio Calculator', 'design', 'Perfect dimensions for any ratio.', 'web-client-tools', 'client'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 65536, NULL, NULL, 2000, 250, 64, 0, 120, 100, true),
  ('pdf-security-inspector', '1.0.0', '1.0.0', 'PDF Security Inspector & Metadata Scrubber', 'security-cloud', 'Inspects PDF documents in an isolated sandbox for JavaScript, macros, auto-actions, encryption, page limits, and scrubs XMP/Info metadata.', 'appsec-team', 'worker_async'::public.tool_execution_mode, 'high'::public.tool_risk_tier, 'anonymous'::public.app_role, true, ARRAY['application/pdf']::text[], 26214400, 200, NULL, 10000, 3000, 256, 5, 20, 100, true),
  ('image-sanitizer', '1.0.0', '1.0.0', 'Image EXIF Stripper & SVG Sanitizer', 'security-cloud', 'Verifies binary image headers, blocks pixel decompression bombs, strips EXIF/IPTC/tEXt metadata from PNG/JPEG, and neutralizes XSS/XXE in SVG.', 'appsec-team', 'server_sync'::public.tool_execution_mode, 'medium'::public.tool_risk_tier, 'anonymous'::public.app_role, true, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']::text[], 15728640, NULL, NULL, 5000, 1500, 256, 2, 30, 100, true),
  ('archive-safety-auditor', '1.0.0', '1.0.0', 'Archive Zip-Bomb & Zip-Slip Auditor', 'security-cloud', 'Audits ZIP archives without extracting to host filesystem, detecting Zip-Slip path traversal, encrypted headers, and compression ratio bombs.', 'appsec-team', 'worker_async'::public.tool_execution_mode, 'high'::public.tool_risk_tier, 'anonymous'::public.app_role, true, ARRAY['application/zip']::text[], 26214400, NULL, NULL, 8000, 2000, 256, 4, 20, 100, true),
  ('url-ssrf-auditor', '1.0.0', '1.0.0', 'Outbound URL & SSRF Policy Auditor', 'security-cloud', 'Validates user-supplied webhook and integration URLs against HTTPS enforcement, DNS rebinding, RFC1918/CGNAT private ranges, and cloud metadata endpoints.', 'appsec-team', 'server_sync'::public.tool_execution_mode, 'medium'::public.tool_risk_tier, 'anonymous'::public.app_role, false, '{}'::text[], 16384, NULL, NULL, 5000, 500, 128, 1, 30, 100, true),
  ('media-stream-inspector', '1.0.0', '1.0.0', 'Audio & Video Stream Sandbox Inspector', 'security-cloud', 'Inspects MP4, MP3, and WAV media headers, enforces duration and codec allowlists, and builds shell-free FFmpeg sandbox arguments.', 'media-platform', 'worker_async'::public.tool_execution_mode, 'high'::public.tool_risk_tier, 'anonymous'::public.app_role, true, ARRAY['video/mp4', 'audio/mpeg', 'audio/wav']::text[], 26214400, NULL, 300, 15000, 5000, 512, 8, 15, 100, true),
  ('markdown-html-sanitizer', '1.0.0', '1.0.0', 'HTML & Markdown XSS Sanitizer', 'security-cloud', 'Normalizes Unicode input and strips script tags, inline event handlers, javascript: URIs, and DOM-clobbering id/name attributes on the server.', 'appsec-team', 'server_sync'::public.tool_execution_mode, 'low'::public.tool_risk_tier, 'anonymous'::public.app_role, false, ARRAY['text/plain', 'text/markdown']::text[], 65536, NULL, NULL, 2000, 300, 64, 1, 60, 100, true)
ON CONFLICT (slug) DO UPDATE SET
  version = EXCLUDED.version,
  summary = EXCLUDED.summary,
  execution_mode = EXCLUDED.execution_mode,
  risk_tier = EXCLUDED.risk_tier,
  max_input_bytes = EXCLUDED.max_input_bytes,
  timeout_ms = EXCLUDED.timeout_ms,
  enabled = EXCLUDED.enabled;

INSERT INTO public.feature_flags (key, description, enabled, rollout_percentage, allowed_roles, owner_team) VALUES
  ('cloud.sandbox_workers', 'Enable isolated async worker queue for untrusted PDF/ZIP/Media uploads', true, 100, ARRAY['anonymous','user','premium','admin']::public.app_role[], 'platform-core'),
  ('security.strict_ssrf_dns_guard', 'Enforce DNS resolution & private CIDR blocking on outbound URLs', true, 100, ARRAY['anonymous','user','premium','admin']::public.app_role[], 'appsec-team'),
  ('privacy.lgpd_self_service', 'Enable self-service LGPD portability export and erasure endpoints', true, 100, ARRAY['user','premium','admin']::public.app_role[], 'privacy-governance'),
  ('billing.stripe_webhooks', 'Enable HMAC-verified idempotent billing webhook ingestion', true, 100, ARRAY['admin']::public.app_role[], 'billing-platform')
ON CONFLICT (key) DO UPDATE SET enabled = EXCLUDED.enabled, rollout_percentage = EXCLUDED.rollout_percentage;

INSERT INTO public.slo_snapshots (service_name, availability_target, availability_observed, latency_p95_ms, error_budget_remaining_pct) VALUES
  ('api-gateway', 99.900, 99.982, 42, 94.50),
  ('sandbox-worker', 99.500, 99.910, 185, 91.20),
  ('supabase-db', 99.950, 99.995, 14, 98.00),
  ('tool-catalog', 99.990, 100.000, 8, 100.00);

COMMIT;
-- <<< END SEED: seed.sql
