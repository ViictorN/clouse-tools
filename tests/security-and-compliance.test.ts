import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHmac } from 'node:crypto';
import * as z from 'zod';
import {
  AppError,
  CircuitBreaker,
  SloTracker,
  createLogger,
  getEngineeringVerifications2000,
  getSecurityBestPractices500,
  loadAppConfig,
  redactPiiAndSecrets,
} from '@clouse/core';
import {
  assertAdminMutationAccess,
  assertObjectOwnership,
  assertPasswordPolicy,
  assertSafeObjectStructure,
  assertSessionFreshness,
  buildIsolatedStorageKey,
  buildSafeFfmpegArgs,
  createCsrfToken,
  generateScopedApiToken,
  hashPassword,
  inspectAndSanitizeImage,
  inspectAndScrubPdf,
  inspectMediaContainer,
  inspectZipArchive,
  isPrivateOrReservedIp,
  normalizeUnicodeInput,
  parseStrictSchema,
  sanitizeFilename,
  sanitizeHtmlFragment,
  sanitizeSvgMarkup,
  sha256Hex,
  validateExternalUrlAgainstSsrf,
  verifyCsrfToken,
  verifyOriginGuard,
  verifyPassword,
  verifyUploadedFile,
  verifyWebhookHmacSignature,
  type AuthenticatedActor,
} from '@clouse/security';

function buildMinimalPngBuffer(options: {
  width: number;
  height: number;
  includeTextChunk?: boolean;
}): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(options.width, 0);
  ihdrData.writeUInt32BE(options.height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // truecolor
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const makeChunk = (type: string, data: Buffer): Buffer => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4); // structural chunk trailer
    return Buffer.concat([len, typeBuf, data, crc]);
  };

  const chunks: Buffer[] = [sig, makeChunk('IHDR', ihdrData)];
  if (options.includeTextChunk) {
    chunks.push(makeChunk('tEXt', Buffer.from('Author\0SecretGPSCoordinates', 'latin1')));
    chunks.push(makeChunk('eXIf', Buffer.from('MM\x00*\x00\x00\x00\x08', 'latin1')));
  }
  chunks.push(makeChunk('IDAT', Buffer.from([0x78, 0x9c, 0x63, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01])));
  chunks.push(makeChunk('IEND', Buffer.alloc(0)));
  return Buffer.concat(chunks);
}

function buildMinimalJpegWithExif(width: number, height: number): Buffer {
  const soi = Buffer.from([0xff, 0xd8]);
  // APP1 EXIF segment (0xFFE1)
  const exifData = Buffer.from('Exif\0\0SecretCameraSerialNumber12345', 'ascii');
  const app1Len = Buffer.alloc(2);
  app1Len.writeUInt16BE(exifData.length + 2, 0);
  const app1 = Buffer.concat([Buffer.from([0xff, 0xe1]), app1Len, exifData]);

  // SOF0 segment (0xFFC0): length=11 (2 + 1 precision + 2 height + 2 width + 1 components + 3 comp spec)
  const sofPayload = Buffer.alloc(9);
  sofPayload[0] = 8;
  sofPayload.writeUInt16BE(height, 1);
  sofPayload.writeUInt16BE(width, 3);
  sofPayload[5] = 1;
  const sofLen = Buffer.alloc(2);
  sofLen.writeUInt16BE(sofPayload.length + 2, 0);
  const sof0 = Buffer.concat([Buffer.from([0xff, 0xc0]), sofLen, sofPayload]);

  // SOS (0xFFDA) + scan byte + EOI (0xFFD9)
  const sos = Buffer.from([0xff, 0xda, 0x00, 0x02, 0x00, 0xff, 0xd9]);
  return Buffer.concat([soi, app1, sof0, sos]);
}

function buildZipLocalFileBuffer(options: {
  entryName: string;
  compressedSize: number;
  uncompressedSize: number;
  encrypted?: boolean;
}): Buffer {
  const nameBuf = Buffer.from(options.entryName, 'utf8');
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0); // PK\x03\x04
  header.writeUInt16LE(20, 4); // version needed
  header.writeUInt16LE(options.encrypted ? 0x0001 : 0x0000, 6); // general purpose bit flag
  header.writeUInt16LE(8, 8); // deflate
  header.writeUInt32LE(options.compressedSize, 18);
  header.writeUInt32LE(options.uncompressedSize, 22);
  header.writeUInt16LE(nameBuf.length, 26);
  header.writeUInt16LE(0, 28);

  const body = Buffer.alloc(options.compressedSize, 0x41);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  return Buffer.concat([header, nameBuf, body, eocd]);
}

describe('Phase 7A — 2,500 Compliance Matrices & Supabase SQL Governance', () => {
  it('verifies all 2,000 Engineering Verifications (CT-0001..CT-2000 across 40 domains x 50)', () => {
    const items = getEngineeringVerifications2000();
    assert.equal(items.length, 2000);
    assert.equal(items[0]?.code, 'CT-0001');
    assert.equal(items[1999]?.code, 'CT-2000');

    const uniqueCodes = new Set(items.map((i) => i.code));
    assert.equal(uniqueCodes.size, 2000);

    const byDomain = new Map<number, number>();
    for (const item of items) {
      byDomain.set(item.domainNumber, (byDomain.get(item.domainNumber) ?? 0) + 1);
      assert.ok(['P0', 'P1', 'P2'].includes(item.priority));
      assert.ok(item.statement.length >= 12);
    }
    assert.equal(byDomain.size, 40);
    for (let d = 1; d <= 40; d++) {
      assert.equal(byDomain.get(d), 50, `Domain ${d} must have 50 verifications`);
    }
  });

  it('verifies all 500 Security Best Practices (CT-001..CT-500 across 25 domains x 20)', () => {
    const practices = getSecurityBestPractices500();
    assert.equal(practices.length, 500);
    assert.equal(practices[0]?.code, 'CT-001');
    assert.equal(practices[499]?.code, 'CT-500');

    const uniqueCodes = new Set(practices.map((p) => p.code));
    assert.equal(uniqueCodes.size, 500);

    const byDomain = new Map<number, number>();
    for (const p of practices) {
      byDomain.set(p.domainNumber, (byDomain.get(p.domainNumber) ?? 0) + 1);
      assert.ok(['P0', 'P1', 'P2'].includes(p.priority));
      assert.ok(p.statement.length >= 12);
    }
    assert.equal(byDomain.size, 25);
    for (let d = 1; d <= 25; d++) {
      assert.equal(byDomain.get(d), 20, `Security domain ${d} must have 20 practices`);
    }
  });

  it('audits Supabase migrations, FORCE RLS on every table, SECURITY DEFINER search_path, and 73-tool seed', () => {
    const repoRoot = process.cwd();
    const configToml = fs.readFileSync(path.join(repoRoot, 'supabase', 'config.toml'), 'utf8');
    assert.match(configToml, /project_id\s*=\s*"luytwttrgosmsfyjlonc"/);

    const migrationsDir = path.join(repoRoot, 'supabase', 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    assert.ok(migrationFiles.length >= 5);

    const combinedMigrations = migrationFiles
      .map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8'))
      .join('\n');

    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.([a-z0-9_]+)/gi;
    const createdTables = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = tableRegex.exec(combinedMigrations)) !== null) {
      createdTables.add(match[1]);
    }
    assert.ok(createdTables.size >= 14, `Expected >= 14 public tables, found ${createdTables.size}`);

    for (const tbl of createdTables) {
      assert.match(
        combinedMigrations,
        new RegExp(`ALTER\\s+TABLE\\s+public\\.${tbl}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i'),
        `Table public.${tbl} must ENABLE ROW LEVEL SECURITY`
      );
      assert.match(
        combinedMigrations,
        new RegExp(`ALTER\\s+TABLE\\s+public\\.${tbl}\\s+FORCE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i'),
        `Table public.${tbl} must FORCE ROW LEVEL SECURITY`
      );
    }

    // Verify SECURITY DEFINER functions pin search_path = public
    const definerBlocks = combinedMigrations.split(/CREATE\s+OR\s+REPLACE\s+FUNCTION/i).slice(1);
    let securityDefinerCount = 0;
    for (const block of definerBlocks) {
      if (/SECURITY\s+DEFINER/i.test(block)) {
        securityDefinerCount += 1;
        assert.match(block, /SET\s+search_path\s*=\s*public/i);
      }
    }
    assert.ok(securityDefinerCount >= 4);

    // Verify seed.sql registers all 73 tools (67 client + 6 server/worker) and deploy_bundle.sql exists
    const seedSql = fs.readFileSync(path.join(repoRoot, 'supabase', 'seed.sql'), 'utf8');
    const seededSlugs = seedSql.match(/'(?:client|server_sync|worker_async)'::public\.tool_execution_mode/g) ?? [];
    assert.equal(seededSlugs.length, 73);

    const bundleSql = fs.readFileSync(path.join(repoRoot, 'supabase', 'deploy_bundle.sql'), 'utf8');
    assert.ok(bundleSql.length > 20_000);
    assert.match(bundleSql, /uploads-quarantine/);
    assert.match(bundleSql, /processed-artifacts/);
  });
});

describe('Phase 7B — Fail-Closed Env, Redaction, Crypto, Authz & Validation', () => {
  it('enforces fail-closed production environment validation without leaking secret values', () => {
    const leakedCandidate = 'sk_test_SUPER_SENSITIVE_VALUE_DO_NOT_ECHO_999';
    assert.throws(
      () =>
        loadAppConfig({
          NODE_ENV: 'production',
          CORS_ALLOWED_ORIGINS: '*',
          CSRF_HMAC_SECRET: 'dev-only-weak',
          PASSWORD_PEPPER: 'dev-only-weak',
          DATABASE_URL: 'postgresql://postgres:pass@db.example.com:5432/postgres',
          BILLING_ENVIRONMENT: 'production',
          STRIPE_SECRET_KEY: leakedCandidate,
        }),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.match(err.message, /Production security gate failed/);
        assert.ok(!err.message.includes(leakedCandidate), 'Error message must never echo raw secret values');
        return true;
      }
    );

    const validProd = loadAppConfig({
      NODE_ENV: 'production',
      CORS_ALLOWED_ORIGINS: 'https://clouse.app',
      NEXT_PUBLIC_SUPABASE_URL: 'https://luytwttrgosmsfyjlonc.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon.valid',
      CSRF_HMAC_SECRET: 'prod_csrf_hmac_secret_with_at_least_32_random_bytes_ok',
      PASSWORD_PEPPER: 'prod_password_pepper_with_at_least_32_random_bytes_ok',
      DATABASE_URL: 'postgresql://user:pass@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require',
      BILLING_ENVIRONMENT: 'production',
      STRIPE_SECRET_KEY: 'sk_live_valid_prod_placeholder_key',
    });
    assert.equal(validProd.SUPABASE_PROJECT_REF, 'luytwttrgosmsfyjlonc');
    assert.equal(validProd.hasLiveSupabase, true);
  });

  it('redacts secrets, tokens, cookies, CPF, and masks emails in structured logs', () => {
    const captured: string[] = [];
    const logger = createLogger('security-test', {
      minLevel: 'info',
      sink: (line) => captured.push(line),
    });

    logger.info('auth.attempt Bearer superSecretToken123456', {
      password: 'MyPlainPassword!123',
      authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature12345',
      cookie: 'session=secret_cookie_val',
      email: 'victor.gomes@clouse.app',
      notes: 'Customer CPF 123.456.789-01 key sk_live_ABCDEF1234567890',
    });

    assert.equal(captured.length, 1);
    const line = captured[0];
    assert.ok(!line.includes('MyPlainPassword!123'));
    assert.ok(!line.includes('secret_cookie_val'));
    assert.ok(!line.includes('123.456.789-01'));
    assert.ok(!line.includes('sk_live_ABCDEF1234567890'));
    assert.ok(!line.includes('victor.gomes@clouse.app'));
    assert.ok(line.includes('v***@clouse.app'));

    const direct = redactPiiAndSecrets({ apiKey: 'secret-1', nested: { token: 'secret-2' } }) as Record<
      string,
      unknown
    >;
    assert.equal(direct.apiKey, '[REDACTED]');
  });

  it('enforces password policy, scrypt+pepper hashing, scoped API tokens, CSRF, and Webhook HMAC', () => {
    assert.throws(
      () => assertPasswordPolicy('short1!A'),
      (e: unknown) => e instanceof AppError && e.code === 'WEAK_PASSWORD'
    );
    assert.throws(
      () => assertPasswordPolicy('Password1234!'),
      (e: unknown) => e instanceof AppError && e.code === 'COMPROMISED_PASSWORD'
    );
    assert.throws(
      () => assertPasswordPolicy('alllowercase123!'),
      (e: unknown) => e instanceof AppError && e.code === 'WEAK_PASSWORD'
    );

    const pepper = 'unit-test-pepper-minimum-32-bytes-long!!';
    const hash = hashPassword('Str0ng#Passphrase2026!', pepper);
    assert.ok(hash.startsWith('$clouse-scrypt$'));
    assert.equal(verifyPassword('Str0ng#Passphrase2026!', hash, pepper), true);
    assert.equal(verifyPassword('Wrong#Passphrase2026!', hash, pepper), false);
    assert.equal(verifyPassword('Str0ng#Passphrase2026!', hash, 'wrong-pepper-value'), false);

    const tok = generateScopedApiToken();
    assert.ok(tok.rawToken.startsWith('ct_live_'));
    assert.equal(sha256Hex(tok.rawToken), tok.tokenSha256);

    const csrfSecret = 'csrf-secret-32-bytes-minimum-test-key!';
    const now = 1_760_000_000_000;
    const csrf = createCsrfToken('user:1111', csrfSecret, now);
    assert.equal(verifyCsrfToken(csrf, 'user:1111', csrfSecret, 7200, now + 30_000), true);
    assert.equal(verifyCsrfToken(csrf, 'user:2222', csrfSecret, 7200, now + 30_000), false);
    assert.equal(verifyCsrfToken(csrf, 'user:1111', csrfSecret, 7200, now + 8_000_000), false);

    assert.throws(() =>
      verifyOriginGuard({
        method: 'POST',
        originHeader: 'https://attacker.evil',
        allowedOrigins: ['https://clouse.app'],
      })
    );

    const whSecret = 'whsec_unit_test_secret_key_32_bytes_min';
    const body = JSON.stringify({ id: 'evt_1', type: 'invoice.paid' });
    const ts = Math.floor(now / 1000);
    const sig = createHmac('sha256', whSecret).update(`${ts}.${body}`).digest('hex');
    const verified = verifyWebhookHmacSignature({
      rawBody: body,
      signatureHeader: `t=${ts},v1=${sig}`,
      secret: whSecret,
      nowMs: now + 10_000,
    });
    assert.equal(verified.timestamp, ts);

    assert.throws(() =>
      verifyWebhookHmacSignature({
        rawBody: `${body} `,
        signatureHeader: `t=${ts},v1=${sig}`,
        secret: whSecret,
        nowMs: now + 10_000,
      })
    );
    assert.throws(() =>
      verifyWebhookHmacSignature({
        rawBody: body,
        signatureHeader: `t=${ts - 900},v1=${sig}`,
        secret: whSecret,
        nowMs: now,
      })
    );
  });

  it('enforces RBAC separation of duties, BOLA ownership, session freshness, strict schemas & resilience', async () => {
    const supportActor: AuthenticatedActor = {
      userId: 'u-support',
      accountId: null,
      role: 'support',
      plan: 'pro',
      actorKey: 'user:u-support',
      scopes: [],
    };
    const userA: AuthenticatedActor = {
      userId: 'u-alice',
      accountId: null,
      role: 'user',
      plan: 'free',
      actorKey: 'user:u-alice',
      scopes: [],
    };
    const adminActor: AuthenticatedActor = {
      userId: 'u-admin',
      accountId: null,
      role: 'admin',
      plan: 'enterprise',
      actorKey: 'user:u-admin',
      scopes: [],
    };

    assert.throws(() => assertAdminMutationAccess(supportActor), (e: unknown) => e instanceof AppError && e.statusCode === 403);
    assert.throws(() => assertAdminMutationAccess(userA), (e: unknown) => e instanceof AppError && e.statusCode === 403);
    assert.doesNotThrow(() => assertAdminMutationAccess(adminActor));

    assert.throws(() => assertObjectOwnership(userA, 'u-bob'), (e: unknown) => e instanceof AppError && e.code === 'BOLA_OWNERSHIP_DENIED');
    assert.doesNotThrow(() => assertObjectOwnership(supportActor, 'u-bob', { allowSupportRead: true, isWrite: false }));
    assert.throws(() => assertObjectOwnership(supportActor, 'u-bob', { allowSupportRead: true, isWrite: true }));

    assert.throws(() => assertSessionFreshness({ revokedAtIso: '2026-01-01T00:00:00Z' }));
    assert.throws(() => assertSessionFreshness({ idleExpiresAtIso: '2026-01-01T00:00:00Z', nowMs: Date.parse('2026-01-01T00:01:00Z') }));

    // Unicode BiDi & Null byte stripping + Prototype Pollution + Mass Assignment
    const cleanedText = normalizeUnicodeInput('safe\u0000\u202Etext');
    assert.equal(cleanedText, 'safetext');

    const polluted = JSON.parse('{"name":"ok","__proto__":{"isAdmin":true}}');
    assert.throws(() => assertSafeObjectStructure(polluted), (e: unknown) => e instanceof AppError && e.code === 'PROTOTYPE_POLLUTION_BLOCKED');

    const StrictUserSchema = z.strictObject({ displayName: z.string().min(2) });
    assert.throws(
      () => parseStrictSchema(StrictUserSchema, { displayName: 'Alice', role: 'admin' }),
      (e: unknown) => e instanceof AppError && e.code === 'MASS_ASSIGNMENT_REJECTED'
    );

    assert.throws(() => sanitizeFilename('../../etc/passwd'));
    assert.throws(() => sanitizeFilename('CON.txt'));
    assert.throws(() => sanitizeFilename('NUL.pdf'));
    const storageKey = buildIsolatedStorageKey('user-123', 'png');
    assert.match(storageKey, /^user-123\/[0-9a-f-]{36}\.png$/);

    // CircuitBreaker & SloTracker resilience checks
    const breaker = new CircuitBreaker('unit-breaker', 2, 5000);
    await assert.rejects(() => breaker.execute(async () => { throw new Error('boom-1'); }));
    await assert.rejects(() => breaker.execute(async () => { throw new Error('boom-2'); }));
    assert.equal(breaker.snapshot().state, 'open');
    await assert.rejects(
      () => breaker.execute(async () => 'never-runs'),
      (e: unknown) => e instanceof AppError && e.statusCode === 503
    );

    const slo = new SloTracker('unit-slo', 99.9);
    slo.recordRequest(12, 200);
    slo.recordRequest(25, 200);
    assert.equal(slo.snapshot().totalRequests, 2);
  });
});

describe('Phase 7C — Anti-SSRF & Binary/Media Malware/Bomb Inspectors', () => {
  it('blocks private IPv4/IPv6, cloud IMDS, non-HTTPS, credentials, ports, and DNS rebinding', async () => {
    for (const blockedIp of [
      '0.0.0.0',
      '127.0.0.1',
      '10.0.0.5',
      '172.16.10.2',
      '172.31.255.255',
      '192.168.1.1',
      '169.254.169.254',
      '100.64.1.1',
      '::1',
      '::ffff:169.254.169.254',
      'fd00:ec2::254',
      'fe80::1',
    ]) {
      assert.equal(isPrivateOrReservedIp(blockedIp), true, `Expected ${blockedIp} to be blocked`);
    }
    assert.equal(isPrivateOrReservedIp('93.184.216.34'), false);

    await assert.rejects(() => validateExternalUrlAgainstSsrf('http://example.com/data'), /SSRF_PROTOCOL_BLOCKED|HTTPS/);
    await assert.rejects(() => validateExternalUrlAgainstSsrf('https://user:pass@example.com/'), / credentials /i);
    await assert.rejects(() => validateExternalUrlAgainstSsrf('https://example.com:8443/api'), /port/i);
    await assert.rejects(() => validateExternalUrlAgainstSsrf('https://metadata.google.internal/computeMetadata/v1/'), /blocked/i);
    await assert.rejects(() => validateExternalUrlAgainstSsrf('https://169.254.169.254/latest/meta-data/'), /blocked/i);

    // Simulated DNS rebinding resolving public-looking domain to AWS IMDS 169.254.169.254
    await assert.rejects(
      () =>
        validateExternalUrlAgainstSsrf('https://rebind.attacker.example/hook', {
          dnsResolver: async () => [{ address: '169.254.169.254', family: 4 }],
        }),
      (e: unknown) => e instanceof AppError && e.code === 'SSRF_DNS_REBIND_PRIVATE_IP'
    );

    const safe = await validateExternalUrlAgainstSsrf('https://api.example.com/status', {
      dnsResolver: async () => [{ address: '93.184.216.34', family: 4 }],
    });
    assert.deepEqual(safe.resolvedAddresses, ['93.184.216.34']);
  });

  it('inspects uploads, PDFs, PNG/JPEG EXIF, SVG/HTML XSS/XXE, ZIP bombs/Zip-Slip, and FFmpeg args', () => {
    // 1. Executable PE/ELF & EICAR & MIME spoofing blocked
    assert.throws(
      () =>
        verifyUploadedFile({
          filename: 'invoice.pdf',
          declaredMime: 'application/pdf',
          bytes: Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]),
        }),
      (e: unknown) => e instanceof AppError && e.code === 'EXECUTABLE_BINARY_BLOCKED'
    );

    const eicarBytes = Buffer.from(
      'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*',
      'utf8'
    );
    assert.throws(
      () => verifyUploadedFile({ filename: 'note.txt', declaredMime: 'text/plain', bytes: eicarBytes }),
      (e: unknown) => e instanceof AppError && e.code === 'MALWARE_SIGNATURE_DETECTED'
    );

    const pngWithExif = buildMinimalPngBuffer({ width: 16, height: 16, includeTextChunk: true });
    assert.throws(
      () => verifyUploadedFile({ filename: 'spoofed.pdf', declaredMime: 'application/pdf', bytes: pngWithExif }),
      (e: unknown) => e instanceof AppError && e.code === 'EXTENSION_MIME_MISMATCH'
    );

    const verifiedPng = verifyUploadedFile({
      filename: 'avatar.png',
      declaredMime: 'image/png',
      bytes: pngWithExif,
    });
    assert.equal(verifiedPng.verifiedMime, 'image/png');

    // 2. PNG & JPEG EXIF stripping + Image dimension bomb guard
    const sanitizedPng = inspectAndSanitizeImage(pngWithExif);
    assert.equal(sanitizedPng.metadataStripped, true);
    assert.deepEqual(sanitizedPng.strippedSegments, ['tEXt', 'eXIf']);
    assert.ok(!Buffer.from(sanitizedPng.sanitizedBase64, 'base64').includes(Buffer.from('SecretGPSCoordinates')));

    const jpegWithExif = buildMinimalJpegWithExif(32, 24);
    const sanitizedJpeg = inspectAndSanitizeImage(jpegWithExif);
    assert.equal(sanitizedJpeg.metadataStripped, true);
    assert.deepEqual(sanitizedJpeg.strippedSegments, ['EXIF_APP1']);
    assert.ok(!Buffer.from(sanitizedJpeg.sanitizedBase64, 'base64').includes(Buffer.from('SecretCameraSerialNumber')));

    const bombPng = buildMinimalPngBuffer({ width: 20_000, height: 20_000 });
    assert.throws(
      () => inspectAndSanitizeImage(bombPng),
      (e: unknown) => e instanceof AppError && e.code === 'IMAGE_DIMENSION_BOMB_BLOCKED'
    );

    // 3. PDF active content quarantine & byte-preserving metadata scrubbing
    const maliciousPdf = Buffer.from(
      '%PDF-1.7\n1 0 obj << /Type /Catalog /OpenAction << /S /JavaScript /JS (app.alert(1)) >> >> endobj\n%%EOF',
      'latin1'
    );
    assert.throws(
      () => inspectAndScrubPdf(maliciousPdf),
      (e: unknown) => e instanceof AppError && e.code === 'PDF_ACTIVE_CONTENT_BLOCKED'
    );

    const cleanPdfWithMeta = Buffer.from(
      '%PDF-1.7\n1 0 obj << /Type /Page >> endobj\n2 0 obj << /Author (Victor Confidential) /Creator (InternalApp) >> endobj\n%%EOF',
      'latin1'
    );
    const pdfReport = inspectAndScrubPdf(cleanPdfWithMeta);
    assert.equal(pdfReport.safe, true);
    assert.deepEqual(pdfReport.metadataFieldsScrubbed.sort(), ['Author', 'Creator']);
    const scrubbedBytes = Buffer.from(pdfReport.scrubbedPdfBase64, 'base64');
    assert.equal(scrubbedBytes.length, cleanPdfWithMeta.length, 'PDF xref byte offsets must remain intact');
    assert.ok(!scrubbedBytes.toString('latin1').includes('Victor Confidential'));

    // 4. SVG XXE & HTML XSS / DOM Clobbering sanitization
    assert.throws(
      () => sanitizeSvgMarkup('<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg>&xxe;</svg>'),
      (e: unknown) => e instanceof AppError && e.code === 'SVG_XXE_BLOCKED'
    );
    const cleanSvg = sanitizeSvgMarkup('<svg onload="alert(1)"><script>evil()</script><rect width="10" height="10"/></svg>');
    assert.ok(!cleanSvg.includes('script') && !cleanSvg.includes('onload'));

    const cleanHtml = sanitizeHtmlFragment(
      '<div id="location" onclick="evil()"><a href="javascript:alert(1)">Link</a><script>steal()</script></div>'
    );
    assert.ok(!cleanHtml.includes('<script>') && !cleanHtml.includes('javascript:') && !cleanHtml.includes('id="location"'));

    // 5. ZIP Slip, Encrypted ZIP, and ZIP Bomb detection
    assert.throws(
      () => inspectZipArchive(buildZipLocalFileBuffer({ entryName: '../../etc/shadow', compressedSize: 16, uncompressedSize: 32 })),
      (e: unknown) => e instanceof AppError && e.code === 'ZIP_SLIP_PATH_TRAVERSAL'
    );
    assert.throws(
      () => inspectZipArchive(buildZipLocalFileBuffer({ entryName: 'secret.txt', compressedSize: 16, uncompressedSize: 32, encrypted: true })),
      (e: unknown) => e instanceof AppError && e.code === 'ENCRYPTED_ZIP_BLOCKED'
    );
    assert.throws(
      () => inspectZipArchive(buildZipLocalFileBuffer({ entryName: 'bomb.bin', compressedSize: 100, uncompressedSize: 500_000 })),
      (e: unknown) => e instanceof AppError && e.code === 'ZIP_BOMB_DETECTED'
    );
    const validZip = inspectZipArchive(
      buildZipLocalFileBuffer({ entryName: 'docs/readme.txt', compressedSize: 32, uncompressedSize: 64 })
    );
    assert.equal(validZip.safe, true);
    assert.equal(validZip.entryCount, 1);

    // 6. Media Container & Hardened FFmpeg Subprocess Arguments
    assert.throws(
      () => buildSafeFfmpegArgs('-malicious-flag.mp4', '/sandbox/out.mp4'),
      (e: unknown) => e instanceof AppError && e.code === 'SUBPROCESS_ARG_INJECTION_BLOCKED'
    );
    assert.throws(
      () => buildSafeFfmpegArgs('/sandbox/in.mp4', '/sandbox/out.mp4', { videoCodec: 'rawvideo' }),
      (e: unknown) => e instanceof AppError && e.code === 'FORBIDDEN_MEDIA_CODEC'
    );
    const ffmpegArgs = buildSafeFfmpegArgs('/sandbox/in.mp4', '/sandbox/out.mp4');
    assert.ok(ffmpegArgs.includes('-protocol_whitelist') && ffmpegArgs.includes('file'));

    const wavHeader = Buffer.alloc(64);
    wavHeader.write('RIFF', 0, 'ascii');
    wavHeader.writeUInt32LE(56, 4);
    wavHeader.write('WAVEfmt ', 8, 'ascii');
    wavHeader.writeUInt32LE(32000, 28); // 32 KB/s byteRate -> < 1s duration
    const mediaReport = inspectMediaContainer(wavHeader, { maxDurationSeconds: 60 });
    assert.equal(mediaReport.containerMime, 'audio/wav');
  });
});
