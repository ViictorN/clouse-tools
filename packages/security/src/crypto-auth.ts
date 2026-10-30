import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { AppError } from '@clouse/core';

const COMMON_COMPROMISED_PASSWORDS = new Set([
  '123456789012',
  'password1234',
  'password123!',
  'password1234!',
  'qwertyuiop12',
  'qwertyuiop1!',
  'admin1234567',
  'admin123456!',
  'clousetools1',
  'clousetools!',
  'iloveyou1234',
  'welcome12345',
  'welcome1234!',
  'letmein12345',
]);

export function assertPasswordPolicy(password: string): void {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    throw AppError.badRequest(
      'WEAK_PASSWORD',
      'Password must be between 12 and 128 characters long.'
    );
  }
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  if (!hasLower || !hasUpper || !hasDigit || !hasSymbol) {
    throw AppError.badRequest(
      'WEAK_PASSWORD',
      'Password must contain uppercase, lowercase, numeric, and symbol characters.'
    );
  }
  if (COMMON_COMPROMISED_PASSWORDS.has(password.toLowerCase())) {
    throw AppError.badRequest(
      'COMPROMISED_PASSWORD',
      'Password appears in known breached credential lists and cannot be used.'
    );
  }
}

export function hashPassword(password: string, pepper: string): string {
  assertPasswordPolicy(password);
  const salt = randomBytes(16);
  const preHashed = createHmac('sha256', pepper).update(password, 'utf8').digest();
  const N = 16384;
  const r = 8;
  const p = 1;
  const derived = scryptSync(preHashed, salt, 64, { N, r, p, maxmem: 32 * 1024 * 1024 });
  return `$clouse-scrypt$n=${N},r=${r},p=${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
}

export function verifyPassword(password: string, encodedHash: string, pepper: string): boolean {
  const parts = encodedHash.split('$');
  // ['', 'clouse-scrypt', 'n=16384,r=8,p=1', '<salt>', '<hash>']
  if (parts.length !== 5 || parts[1] !== 'clouse-scrypt') {
    return false;
  }
  const params = Object.fromEntries(
    parts[2].split(',').map((kv) => {
      const [k, v] = kv.split('=');
      return [k, Number(v)];
    })
  );
  if (!params.n || !params.r || !params.p) {
    return false;
  }
  const salt = Buffer.from(parts[3], 'base64url');
  const expected = Buffer.from(parts[4], 'base64url');
  const preHashed = createHmac('sha256', pepper).update(password, 'utf8').digest();
  const actual = scryptSync(preHashed, salt, expected.length, {
    N: params.n,
    r: params.r,
    p: params.p,
    maxmem: 32 * 1024 * 1024,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function sha256Hex(input: string | Uint8Array): string {
  return createHash('sha256').update(input).digest('hex');
}

export function hashIpAddress(ip: string | undefined | null, secret: string): string {
  const normalized = (ip || '0.0.0.0').trim();
  return createHmac('sha256', secret).update(`ip:${normalized}`).digest('hex');
}

export function generateScopedApiToken(): {
  rawToken: string;
  tokenPrefix: string;
  tokenSha256: string;
} {
  const entropy = randomBytes(32).toString('base64url');
  const rawToken = `ct_live_${entropy}`;
  return {
    rawToken,
    tokenPrefix: rawToken.slice(0, 12),
    tokenSha256: sha256Hex(rawToken),
  };
}

export function createCsrfToken(sessionKey: string, secret: string, nowMs = Date.now()): string {
  const ts = Math.floor(nowMs / 1000);
  const nonce = randomBytes(12).toString('base64url');
  const payload = `${ts}.${nonce}`;
  const sig = createHmac('sha256', secret)
    .update(`${sessionKey}:${payload}`)
    .digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyCsrfToken(
  token: string | undefined | null,
  sessionKey: string,
  secret: string,
  maxAgeSeconds = 7200,
  nowMs = Date.now()
): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  const [tsRaw, nonce, providedSig] = parts;
  const ts = Number(tsRaw);
  if (!Number.isFinite(ts) || !nonce || !providedSig) {
    return false;
  }
  const nowSec = Math.floor(nowMs / 1000);
  if (ts > nowSec + 60 || nowSec - ts > maxAgeSeconds) {
    return false;
  }
  const expectedSig = createHmac('sha256', secret)
    .update(`${sessionKey}:${tsRaw}.${nonce}`)
    .digest('base64url');

  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyOriginGuard(options: {
  method: string;
  originHeader?: string | null;
  refererHeader?: string | null;
  allowedOrigins: string[];
}): void {
  const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
  if (safeMethods.has(options.method.toUpperCase())) {
    return;
  }

  let candidateOrigin: string | null = null;
  if (options.originHeader) {
    candidateOrigin = options.originHeader.trim();
  } else if (options.refererHeader) {
    try {
      candidateOrigin = new URL(options.refererHeader).origin;
    } catch {
      throw AppError.forbidden('INVALID_ORIGIN_HEADER', 'Malformed Referer header on mutating request.');
    }
  }

  // Non-browser server-to-server requests without Origin/Referer are permitted when using Bearer/API token,
  // whereas browser requests supplying an Origin MUST match the strict allowlist.
  if (candidateOrigin && !options.allowedOrigins.includes(candidateOrigin)) {
    throw AppError.forbidden(
      'CSRF_ORIGIN_MISMATCH',
      `Origin "${candidateOrigin}" is not in the trusted CORS/CSRF allowlist.`
    );
  }
}

export function verifyWebhookHmacSignature(options: {
  rawBody: string | Buffer;
  signatureHeader: string | undefined | null;
  secret: string;
  toleranceSeconds?: number;
  nowMs?: number;
}): { timestamp: number } {
  const tolerance = options.toleranceSeconds ?? 300;
  const nowSec = Math.floor((options.nowMs ?? Date.now()) / 1000);

  if (!options.secret || options.secret.length < 16) {
    throw AppError.serviceUnavailable('WEBHOOK_SECRET_UNCONFIGURED', 'Webhook verification secret is not configured.');
  }
  if (!options.signatureHeader) {
    throw AppError.unauthorized('WEBHOOK_SIGNATURE_MISSING', 'Missing webhook signature header.');
  }

  const pairs = options.signatureHeader.split(',').map((part) => part.trim().split('='));
  const tEntry = pairs.find(([k]) => k === 't')?.[1];
  const v1Entry = pairs.find(([k]) => k === 'v1')?.[1];

  const timestamp = Number(tEntry);
  if (!Number.isFinite(timestamp) || !v1Entry || !/^[0-9a-f]{64}$/i.test(v1Entry)) {
    throw AppError.unauthorized('WEBHOOK_SIGNATURE_MALFORMED', 'Malformed webhook signature header.');
  }

  if (Math.abs(nowSec - timestamp) > tolerance) {
    throw AppError.unauthorized('WEBHOOK_TIMESTAMP_EXPIRED', 'Webhook timestamp is outside replay protection window.');
  }

  const bodyText = Buffer.isBuffer(options.rawBody)
    ? options.rawBody.toString('utf8')
    : options.rawBody;

  const expectedHex = createHmac('sha256', options.secret)
    .update(`${timestamp}.${bodyText}`, 'utf8')
    .digest('hex');

  const a = Buffer.from(v1Entry.toLowerCase(), 'hex');
  const b = Buffer.from(expectedHex, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw AppError.unauthorized('WEBHOOK_SIGNATURE_INVALID', 'Webhook cryptographic signature mismatch.');
  }

  return { timestamp };
}
