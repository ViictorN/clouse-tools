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
