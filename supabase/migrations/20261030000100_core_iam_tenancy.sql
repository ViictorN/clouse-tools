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
