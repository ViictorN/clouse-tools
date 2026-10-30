import { createHmac, timingSafeEqual } from 'node:crypto';
import { AppError, getAppConfig } from '@clouse/core';
import {
  assertSessionFreshness,
  createAnonymousActor,
  hashIpAddress,
  type AccountPlan,
  type AppRole,
  type AuthenticatedActor,
} from '@clouse/security';
import { createUserScopedSupabaseClient } from '@clouse/data';

export interface SignedTestJwtPayload {
  sub: string;
  role: AppRole;
  plan?: AccountPlan;
  accountId?: string;
  iss: string;
  aud: string;
  exp: number;
  idleExp?: number;
}

/**
 * Issues a cryptographically HMAC-SHA256 signed JWT for local dev & automated security tests
 * verifying issuer, audience, role, and idle/absolute expiration.
 */
export function signLocalGatewayJwt(
  claims: Omit<SignedTestJwtPayload, 'iss' | 'aud' | 'exp'> & {
    expiresInSeconds?: number;
    iss?: string;
    aud?: string;
  },
  secret = getAppConfig().CSRF_HMAC_SECRET
): string {
  const cfg = getAppConfig();
  const nowSec = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadObj: SignedTestJwtPayload = {
    sub: claims.sub,
    role: claims.role,
    plan: claims.plan ?? 'free',
    accountId: claims.accountId,
    iss: claims.iss ?? cfg.JWT_ISSUER,
    aud: claims.aud ?? cfg.JWT_AUDIENCE,
    exp: nowSec + (claims.expiresInSeconds ?? 900),
    idleExp: claims.idleExp,
  };
  const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const sig = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

export async function resolveActorFromHeaders(options: {
  authorizationHeader?: string | null;
  clientIp?: string | null;
}): Promise<{ actor: AuthenticatedActor; ipHmac: string }> {
  const cfg = getAppConfig();
  const ipHmac = hashIpAddress(options.clientIp, cfg.CSRF_HMAC_SECRET);
  const authHeader = options.authorizationHeader?.trim() ?? '';

  if (!authHeader) {
    return { actor: createAnonymousActor(ipHmac), ipHmac };
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw AppError.unauthorized('INVALID_AUTH_SCHEME', 'Authorization header must use Bearer token scheme.');
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token || token.length > 4096) {
    throw AppError.unauthorized('INVALID_TOKEN', 'Malformed Bearer token.');
  }

  // 1. Live Supabase Auth verification when live credentials are configured
  const sb = createUserScopedSupabaseClient(token);
  if (sb) {
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data.user) {
      throw AppError.unauthorized('SUPABASE_JWT_INVALID', 'Invalid or expired Supabase session token.');
    }

    const { data: profile } = await sb
      .from('profiles')
      .select('role, locked_until')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile?.locked_until && Date.parse(profile.locked_until) > Date.now()) {
      throw AppError.forbidden('ACCOUNT_LOCKED', 'Account is temporarily locked due to brute-force protection.');
    }

    const role = (profile?.role as AppRole | undefined) ?? 'user';
    return {
      ipHmac,
      actor: {
        userId: data.user.id,
        accountId: null,
        role,
        plan: role === 'premium' || role === 'admin' ? 'pro' : 'free',
        actorKey: `user:${data.user.id}`,
        scopes: ['tools:execute', 'uploads:write', 'jobs:write'],
      },
    };
  }

  // 2. Cryptographically signed local/CI gateway JWT verification (strict alg, sig, iss, aud, exp)
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw AppError.unauthorized('MALFORMED_JWT', 'JWT must contain three dot-separated segments.');
  }

  const [headerB64, payloadB64, sigB64] = parts;
  let headerObj: { alg?: string; typ?: string };
  let payloadObj: SignedTestJwtPayload;

  try {
    headerObj = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    payloadObj = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    throw AppError.unauthorized('MALFORMED_JWT_JSON', 'JWT header or payload could not be decoded.');
  }

  // Reject alg: none and algorithm confusion attacks (PDF 2 Domain 06 t7)
  if (headerObj.alg !== 'HS256') {
    throw AppError.unauthorized('JWT_ALG_REJECTED', 'Unsupported or insecure JWT signing algorithm.');
  }

  const expectedSig = createHmac('sha256', cfg.CSRF_HMAC_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  const sigBuf = Buffer.from(sigB64);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    throw AppError.unauthorized('JWT_SIGNATURE_INVALID', 'JWT cryptographic signature verification failed.');
  }

  // Verify issuer, audience, and expiration (PDF 2 Domain 06 t8)
  if (payloadObj.iss !== cfg.JWT_ISSUER || payloadObj.aud !== cfg.JWT_AUDIENCE) {
    throw AppError.unauthorized('JWT_CLAIMS_MISMATCH', 'JWT issuer or audience claim rejected.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (!payloadObj.exp || payloadObj.exp <= nowSec) {
    throw AppError.unauthorized('JWT_EXPIRED', 'JWT token has expired.');
  }

  if (payloadObj.idleExp) {
    assertSessionFreshness({
      idleExpiresAtIso: new Date(payloadObj.idleExp * 1000).toISOString(),
      absoluteExpiresAtIso: new Date(payloadObj.exp * 1000).toISOString(),
    });
  }

  const validRoles: AppRole[] = ['anonymous', 'user', 'premium', 'support', 'admin'];
  if (!payloadObj.sub || !validRoles.includes(payloadObj.role)) {
    throw AppError.unauthorized('JWT_SUBJECT_INVALID', 'JWT subject or role claim is invalid.');
  }

  return {
    ipHmac,
    actor: {
      userId: payloadObj.sub,
      accountId: payloadObj.accountId ?? null,
      role: payloadObj.role,
      plan: payloadObj.plan ?? (payloadObj.role === 'premium' || payloadObj.role === 'admin' ? 'pro' : 'free'),
      actorKey: `user:${payloadObj.sub}`,
      scopes: ['tools:execute', 'uploads:write', 'jobs:write'],
    },
  };
}
