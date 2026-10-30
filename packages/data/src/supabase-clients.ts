import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppError, getAppConfig } from '@clouse/core';

/**
 * Creates a request-scoped Supabase client bound to the caller's JWT (or anon role).
 * Enforces PostgreSQL Row Level Security (RLS) with zero session persistence in server memory.
 */
export function createUserScopedSupabaseClient(userAccessToken?: string | null): SupabaseClient | null {
  const cfg = getAppConfig();
  if (!cfg.hasLiveSupabase) {
    return null;
  }

  return createClient(cfg.NEXT_PUBLIC_SUPABASE_URL, cfg.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: userAccessToken
        ? {
            Authorization: `Bearer ${userAccessToken}`,
            'X-Client-Info': `clouse-tools-gateway/${cfg.APP_VERSION}`,
          }
        : {
            'X-Client-Info': `clouse-tools-gateway/${cfg.APP_VERSION}`,
          },
    },
  });
}

/**
 * Creates a privileged service-role Supabase client strictly for isolated worker RPCs,
 * rate-limit counters, webhook ledgers, and hash-chained audit ingestion.
 * NEVER expose this client or key to browser bundles!
 */
export function createServiceRoleSupabaseClient(): SupabaseClient | null {
  if (typeof window !== 'undefined') {
    throw AppError.forbidden(
      'SERVICE_ROLE_IN_BROWSER_FORBIDDEN',
      'Service role Supabase client cannot be instantiated in a browser context.'
    );
  }

  const cfg = getAppConfig();
  if (!cfg.hasLiveServiceRole) {
    return null;
  }

  return createClient(cfg.NEXT_PUBLIC_SUPABASE_URL, cfg.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': `clouse-tools-service-worker/${cfg.APP_VERSION}`,
      },
    },
  });
}
