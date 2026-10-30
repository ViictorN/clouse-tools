import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { AppError } from '@clouse/core';
import { createIsolatedTestDataStore } from '@clouse/data';
import { createApiApp } from '../apps/api/src/app';
import { signLocalGatewayJwt } from '../apps/api/src/auth-resolver';
import { processNextQueuedJobOnce, runIsolatedMediaBinary } from '../apps/worker/src/sandbox-runner';

function buildValid1x1PngBase64(): string {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(1, 0);
  ihdrData.writeUInt32BE(1, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2;

  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    return Buffer.concat([len, Buffer.from(type, 'ascii'), data, Buffer.alloc(4)]);
  };

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('tEXt', Buffer.from('Comment\0StripMe', 'latin1')),
    chunk('IDAT', Buffer.from([0x78, 0x9c, 0x63, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01])),
    chunk('IEND', Buffer.alloc(0)),
  ]).toString('base64');
}

describe('Phase 7D — End-to-End API Gateway, Authn/Authz/BOLA, Sandbox Worker, LGPD & Webhooks', () => {
  const store = createIsolatedTestDataStore();
  let server: Server;
  let baseUrl = '';

  const tokenAlice = signLocalGatewayJwt({ sub: '11111111-1111-4111-8111-111111111111', role: 'user', plan: 'free' });
  const tokenBob = signLocalGatewayJwt({ sub: '22222222-2222-4222-8222-222222222222', role: 'user', plan: 'free' });
  const tokenSupport = signLocalGatewayJwt({ sub: '33333333-3333-4333-8333-333333333333', role: 'support', plan: 'pro' });
  const tokenAdmin = signLocalGatewayJwt({ sub: '99999999-9999-4999-8999-999999999999', role: 'admin', plan: 'enterprise' });

  before(async () => {
    const app = createApiApp({ store, rateLimitMaxPerMinute: 500 });
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('serves health, readiness (luytwttrgosmsfyjlonc), OpenAPI 3.1, 73-tool catalog, compliance matrices & security headers', async () => {
    const healthRes = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { 'X-Correlation-Id': 'corr-e2e-health-001' },
    });
    assert.equal(healthRes.status, 200);
    assert.equal(healthRes.headers.get('x-correlation-id'), 'corr-e2e-health-001');
    assert.equal(healthRes.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(healthRes.headers.get('x-frame-options'), 'DENY');
    assert.equal(healthRes.headers.get('x-powered-by'), null);
    assert.ok(healthRes.headers.get('content-security-policy')?.includes("default-src 'none'"));

    const readyRes = await fetch(`${baseUrl}/api/v1/ready`);
    assert.equal(readyRes.status, 200);
    const readyJson = (await readyRes.json()) as {
      ready: boolean;
      supabaseProjectRef: string;
      auditChain: { valid: boolean };
    };
    assert.equal(readyJson.ready, true);
    assert.equal(readyJson.supabaseProjectRef, 'luytwttrgosmsfyjlonc');
    assert.equal(readyJson.auditChain.valid, true);

    const openApiRes = await fetch(`${baseUrl}/api/v1/openapi.json`);
    assert.equal(openApiRes.status, 200);
    const openApiJson = (await openApiRes.json()) as { openapi: string; paths: Record<string, unknown> };
    assert.equal(openApiJson.openapi, '3.1.0');
    assert.ok('/api/v1/tools' in openApiJson.paths);

    const toolsRes = await fetch(`${baseUrl}/api/v1/tools?pageSize=100`);
    assert.equal(toolsRes.status, 200);
    const toolsJson = (await toolsRes.json()) as {
      total: number;
      items: Array<{ executionMode: string }>;
    };
    assert.equal(toolsJson.total, 73);
    assert.equal(toolsJson.items.filter((t) => t.executionMode === 'client').length, 67);
    assert.equal(toolsJson.items.filter((t) => t.executionMode !== 'client').length, 6);

    const summaryRes = await fetch(`${baseUrl}/api/v1/compliance/summary`);
    assert.equal(summaryRes.status, 200);
    const summaryJson = (await summaryRes.json()) as {
      supabaseProjectRef: string;
      toolsCatalog: { totalTools: number; browserClientTools: number; all10PublicationGatesPassed: boolean };
      engineeringMatrix2000: { totalChecks: number };
      securityPractices500: { totalPractices: number };
    };
    assert.equal(summaryJson.supabaseProjectRef, 'luytwttrgosmsfyjlonc');
    assert.equal(summaryJson.toolsCatalog.totalTools, 73);
    assert.equal(summaryJson.toolsCatalog.browserClientTools, 67);
    assert.equal(summaryJson.toolsCatalog.all10PublicationGatesPassed, true);
    assert.equal(summaryJson.engineeringMatrix2000.totalChecks, 2000);
    assert.equal(summaryJson.securityPractices500.totalPractices, 500);

    const engRes = await fetch(`${baseUrl}/api/v1/compliance/engineering?priority=P0&pageSize=10`);
    assert.equal(engRes.status, 200);
    const engJson = (await engRes.json()) as { total: number; items: Array<{ priority: string }> };
    assert.ok(engJson.total > 0);
    assert.ok(engJson.items.every((i) => i.priority === 'P0'));

    const secRes = await fetch(`${baseUrl}/api/v1/compliance/security?q=RLS&pageSize=10`);
    assert.equal(secRes.status, 200);
    const secJson = (await secRes.json()) as { total: number };
    assert.ok(secJson.total >= 1);
  });

  it('rejects untrusted CORS Origin, forged/alg:none/expired JWTs, unknown routes (RFC 7807), and enforces IP rate limits', async () => {
    // Untrusted browser Origin blocked with 403
    const evilCorsRes = await fetch(`${baseUrl}/api/v1/tools`, {
      headers: { Origin: 'https://evil-phishing.example' },
    });
    assert.equal(evilCorsRes.status, 403);

    // Unknown route returns RFC 7807 ProblemDetails without internal stack trace
    const notFoundRes = await fetch(`${baseUrl}/api/v1/non-existent-endpoint`);
    assert.equal(notFoundRes.status, 404);
    assert.match(notFoundRes.headers.get('content-type') ?? '', /application\/problem\+json/);
    const problem = (await notFoundRes.json()) as Record<string, unknown>;
    assert.equal(problem.code, 'ENDPOINT_NOT_FOUND');
    assert.equal('stack' in problem, false);

    // Forged JWT with alg: none
    const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const forgedPayload = Buffer.from(
      JSON.stringify({
        sub: 'attacker',
        role: 'admin',
        iss: 'https://luytwttrgosmsfyjlonc.supabase.co/auth/v1',
        aud: 'authenticated',
        exp: Math.floor(Date.now() / 1000) + 600,
      })
    ).toString('base64url');
    const algNoneRes = await fetch(`${baseUrl}/api/v1/admin/dlq`, {
      headers: { Authorization: `Bearer ${noneHeader}.${forgedPayload}.sig` },
    });
    assert.equal(algNoneRes.status, 401);

    // Expired JWT & Wrong signature JWT
    const expiredJwt = signLocalGatewayJwt({ sub: 'u-exp', role: 'user', expiresInSeconds: -30 });
    const expRes = await fetch(`${baseUrl}/api/v1/admin/dlq`, {
      headers: { Authorization: `Bearer ${expiredJwt}` },
    });
    assert.equal(expRes.status, 401);

    const wrongSigJwt = signLocalGatewayJwt({ sub: 'u-bad', role: 'admin' }, 'wrong-hmac-secret-32-bytes-long!!');
    const badSigRes = await fetch(`${baseUrl}/api/v1/admin/dlq`, {
      headers: { Authorization: `Bearer ${wrongSigJwt}` },
    });
    assert.equal(badSigRes.status, 401);

    // Dedicated strict IP rate-limit instance (max 2 req/min)
    const rlStore = createIsolatedTestDataStore();
    const rlApp = createApiApp({ store: rlStore, rateLimitMaxPerMinute: 2 });
    const rlServer = await new Promise<Server>((resolve) => {
      const s = rlApp.listen(0, '127.0.0.1', () => resolve(s));
    });
    try {
      const rlPort = (rlServer.address() as AddressInfo).port;
      const r1 = await fetch(`http://127.0.0.1:${rlPort}/api/v1/tools`);
      const r2 = await fetch(`http://127.0.0.1:${rlPort}/api/v1/tools`);
      const r3 = await fetch(`http://127.0.0.1:${rlPort}/api/v1/tools`);
      assert.equal(r1.status, 200);
      assert.equal(r2.status, 200);
      assert.equal(r3.status, 429);
    } finally {
      await new Promise<void>((resolve) => rlServer.close(() => resolve()));
    }
  });

  it('enforces BOLA/IDOR isolation on quarantined uploads & jobs and RBAC separation of duties', async () => {
    // Anonymous upload denied (401)
    const anonUp = await fetch(`${baseUrl}/api/v1/uploads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: 'test.png',
        declaredMime: 'image/png',
        contentBase64: buildValid1x1PngBase64(),
      }),
    });
    assert.equal(anonUp.status, 401);

    // Alice uploads PNG -> 201
    const aliceUp = await fetch(`${baseUrl}/api/v1/uploads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAlice}`,
      },
      body: JSON.stringify({
        filename: 'alice-private.png',
        declaredMime: 'image/png',
        contentBase64: buildValid1x1PngBase64(),
        ttlSeconds: 120,
      }),
    });
    assert.equal(aliceUp.status, 201);
    const aliceArtifact = ((await aliceUp.json()) as { artifact: { id: string; storageKey: string } }).artifact;
    assert.ok(!aliceArtifact.storageKey.includes('alice-private'), 'Storage key must be UUID-isolated');

    // Bob attempts BOLA download of Alice's artifact -> 403
    const bobStealDownload = await fetch(`${baseUrl}/api/v1/uploads/${aliceArtifact.id}/download`, {
      headers: { Authorization: `Bearer ${tokenBob}` },
    });
    assert.equal(bobStealDownload.status, 403);

    // Alice downloads own artifact -> 200
    const aliceOwnDownload = await fetch(`${baseUrl}/api/v1/uploads/${aliceArtifact.id}/download`, {
      headers: { Authorization: `Bearer ${tokenAlice}` },
    });
    assert.equal(aliceOwnDownload.status, 200);

    // Support role cannot mutate admin compliance controls (403), Admin succeeds (200)
    const supportPatch = await fetch(`${baseUrl}/api/v1/admin/compliance/security/CT-001`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenSupport}`,
      },
      body: JSON.stringify({ status: 'verificado' }),
    });
    assert.equal(supportPatch.status, 403);

    const adminPatch = await fetch(`${baseUrl}/api/v1/admin/compliance/security/CT-001`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ status: 'verificado' }),
    });
    assert.equal(adminPatch.status, 200);
  });

  it('executes sync & async isolated worker tools, deduplicates Idempotency-Key, routes DLQ, and reaps TTL artifacts', async () => {
    // 1. Sync XSS Sanitizer execution
    const xssRes = await fetch(`${baseUrl}/api/v1/tools/markdown-html-sanitizer/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        markup: '<h1>Safe</h1><script>fetch("https://evil.test")</script><img src=x onerror="alert(1)">',
      }),
    });
    assert.equal(xssRes.status, 200);
    const xssBody = (await xssRes.json()) as { result: { sanitizedHtml: string; modified: boolean } };
    assert.equal(xssBody.result.modified, true);
    assert.ok(!xssBody.result.sanitizedHtml.includes('<script>'));
    assert.ok(!xssBody.result.sanitizedHtml.includes('onerror'));

    // 2. Sync SSRF Auditor blocks AWS IMDS 169.254.169.254
    const ssrfRes = await fetch(`${baseUrl}/api/v1/tools/url-ssrf-auditor/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://169.254.169.254/latest/meta-data/iam/security-credentials/',
      }),
    });
    assert.equal(ssrfRes.status, 403);

    // 3. Async PDF Security Inspector job + Idempotency-Key deduplication + BOLA check + Worker execution
    const cleanPdfB64 = Buffer.from(
      '%PDF-1.7\n1 0 obj << /Type /Page >> endobj\n2 0 obj << /Author (Alice Private) >> endobj\n%%EOF',
      'latin1'
    ).toString('base64');

    const jobReq1 = await fetch(`${baseUrl}/api/v1/tools/pdf-security-inspector/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAlice}`,
        'Idempotency-Key': 'idem-pdf-job-0001',
      },
      body: JSON.stringify({ pdfBase64: cleanPdfB64 }),
    });
    assert.equal(jobReq1.status, 202);
    const job1Body = (await jobReq1.json()) as { deduplicated: boolean; job: { id: string; status: string } };
    assert.equal(job1Body.deduplicated, false);
    assert.equal(job1Body.job.status, 'queued');

    const jobReq2 = await fetch(`${baseUrl}/api/v1/tools/pdf-security-inspector/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAlice}`,
        'Idempotency-Key': 'idem-pdf-job-0001',
      },
      body: JSON.stringify({ pdfBase64: cleanPdfB64 }),
    });
    assert.equal(jobReq2.status, 202);
    const job2Body = (await jobReq2.json()) as { deduplicated: boolean; job: { id: string } };
    assert.equal(job2Body.deduplicated, true);
    assert.equal(job2Body.job.id, job1Body.job.id);

    // Bob cannot read Alice's job (403 BOLA), Support can read (200)
    const bobJobRead = await fetch(`${baseUrl}/api/v1/jobs/${job1Body.job.id}`, {
      headers: { Authorization: `Bearer ${tokenBob}` },
    });
    assert.equal(bobJobRead.status, 403);

    const supportJobRead = await fetch(`${baseUrl}/api/v1/jobs/${job1Body.job.id}`, {
      headers: { Authorization: `Bearer ${tokenSupport}` },
    });
    assert.equal(supportJobRead.status, 200);

    // Isolated Worker claims and completes the PDF job
    const tick1 = await processNextQueuedJobOnce({ workerId: 'worker-e2e-1', store });
    assert.equal(tick1.processed, true);
    assert.equal(tick1.sandboxCleanedUp, true);
    assert.equal(tick1.job?.status, 'succeeded');

    // Enqueue malicious PDF job -> Worker deterministic block -> routed immediately to Dead-Letter Queue (DLQ)
    const badPdfB64 = Buffer.from(
      '%PDF-1.7\n1 0 obj << /OpenAction << /S /JavaScript /JS (evil()) >> >> endobj\n%%EOF',
      'latin1'
    ).toString('base64');

    const badJobRes = await fetch(`${baseUrl}/api/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAlice}`,
        'Idempotency-Key': 'idem-bad-pdf-dlq-0002',
      },
      body: JSON.stringify({
        toolSlug: 'pdf-security-inspector',
        inputPayload: { pdfBase64: badPdfB64 },
      }),
    });
    assert.equal(badJobRes.status, 202);

    const tick2 = await processNextQueuedJobOnce({ workerId: 'worker-e2e-1', store });
    assert.equal(tick2.processed, true);
    assert.equal(tick2.job?.status, 'dead_letter');

    const supportDlqRes = await fetch(`${baseUrl}/api/v1/admin/dlq`, {
      headers: { Authorization: `Bearer ${tokenSupport}` },
    });
    assert.equal(supportDlqRes.status, 403);

    const dlqRes = await fetch(`${baseUrl}/api/v1/admin/dlq`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    assert.equal(dlqRes.status, 200);
    const dlqJson = (await dlqRes.json()) as { total: number };
    assert.equal(dlqJson.total, 1);

    // Subprocess guard rejects non-allowlisted binary & null byte args
    await assert.rejects(
      () =>
        runIsolatedMediaBinary({
          binaryName: 'sh' as 'ffmpeg',
          args: ['-c', 'whoami'],
          sandboxDir: process.cwd(),
        }),
      (e: unknown) => e instanceof AppError && e.code === 'SUBPROCESS_BINARY_FORBIDDEN'
    );
    await assert.rejects(
      () =>
        runIsolatedMediaBinary({
          binaryName: 'ffmpeg',
          args: ['bad\0arg'],
          sandboxDir: process.cwd(),
        }),
      (e: unknown) => e instanceof AppError && e.code === 'SUBPROCESS_INVALID_ARG'
    );

    // 15-min TTL reaper purges expired quarantined artifacts when clock advances past TTL
    await store.storeQuarantinedUpload({
      actor: {
        userId: '11111111-1111-4111-8111-111111111111',
        accountId: null,
        role: 'user',
        plan: 'free',
        actorKey: 'user:11111111-1111-4111-8111-111111111111',
        scopes: ['uploads:write'],
      },
      filename: 'ephemeral.png',
      declaredMime: 'image/png',
      bytes: Buffer.from(buildValid1x1PngBase64(), 'base64'),
      ttlSeconds: -5,
      correlationId: 'corr-ttl-test',
    });
    const reaped = await store.reapExpiredArtifacts();
    assert.ok(reaped >= 1);
  });

  it('handles LGPD consent/export/erasure, HMAC billing webhooks with replay/idempotency, and verifies SHA-256 audit chain', async () => {
    const consentRes = await fetch(`${baseUrl}/api/v1/lgpd/consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAlice}`,
      },
      body: JSON.stringify({
        purpose: 'cloud_processing',
        legalBasis: 'consent',
        granted: true,
      }),
    });
    assert.equal(consentRes.status, 201);

    const exportRes = await fetch(`${baseUrl}/api/v1/lgpd/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAlice}`,
      },
      body: JSON.stringify({ email: 'alice@clouse.app' }),
    });
    assert.equal(exportRes.status, 200);

    const deleteRes = await fetch(`${baseUrl}/api/v1/lgpd/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAlice}`,
      },
      body: JSON.stringify({ email: 'alice@clouse.app' }),
    });
    assert.equal(deleteRes.status, 200);

    // Signed Billing Webhook + Idempotent Replay Deduplication
    const webhookSecret = 'whsec_dev_test_secret_minimum_32_bytes';
    const rawWebhook = JSON.stringify({
      id: 'evt_stripe_test_0001',
      type: 'customer.subscription.updated',
      livemode: false,
      data: { plan: 'pro' },
    });
    const ts = Math.floor(Date.now() / 1000);
    const v1 = createHmac('sha256', webhookSecret).update(`${ts}.${rawWebhook}`).digest('hex');

    const wh1 = await fetch(`${baseUrl}/api/v1/webhooks/billing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': `t=${ts},v1=${v1}`,
      },
      body: rawWebhook,
    });
    assert.equal(wh1.status, 200);
    assert.equal(((await wh1.json()) as { duplicate: boolean }).duplicate, false);

    const wh2 = await fetch(`${baseUrl}/api/v1/webhooks/billing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': `t=${ts},v1=${v1}`,
      },
      body: rawWebhook,
    });
    assert.equal(wh2.status, 200);
    assert.equal(((await wh2.json()) as { duplicate: boolean }).duplicate, true);

    const whTampered = await fetch(`${baseUrl}/api/v1/webhooks/billing`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': `t=${ts},v1=${'0'.repeat(64)}`,
      },
      body: rawWebhook,
    });
    assert.equal(whTampered.status, 401);

    // Verify cryptographic hash-chained append-only audit log integrity across the entire E2E run
    const integrity = store.verifyAuditChainIntegrity();
    assert.equal(integrity.valid, true);
    assert.ok(integrity.checkedEntries >= 8);
  });
});
