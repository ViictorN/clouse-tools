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
