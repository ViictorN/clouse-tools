import { NextResponse, type NextRequest } from 'next/server';
import {
  AppError,
  getAppConfig,
  resolveCorrelationId,
  toProblemDetails,
} from '@clouse/core';
import { verifyOriginGuard } from '@clouse/security';
import { resolveActorFromHeaders } from '@/apps/api/src/auth-resolver';
import {
  dispatchGatewayRoute,
  getDefaultGatewayTelemetry,
} from '@/apps/api/src/gateway-handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ route?: string[] }>;
}

async function handleNextApiV1(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const startMs = performance.now();
  const cfg = getAppConfig();
  const correlationId = resolveCorrelationId(request.headers.get('x-correlation-id'));
  const { sloTracker, circuitBreaker } = getDefaultGatewayTelemetry();

  try {
    const resolvedParams = await context.params;
    const segments = resolvedParams.route ?? [];
    const subpath = `/${segments.join('/')}`;

    if (subpath !== '/webhooks/billing') {
      verifyOriginGuard({
        method: request.method,
        originHeader: request.headers.get('origin'),
        refererHeader: request.headers.get('referer'),
        allowedOrigins: cfg.corsOriginsList,
      });
    }

    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const { actor, ipHmac } = await resolveActorFromHeaders({
      authorizationHeader: request.headers.get('authorization'),
      clientIp,
    });

    const isUploadRoute =
      subpath === '/uploads' || /^\/tools\/[a-z0-9-]+\/execute$/.test(subpath);
    const maxBodyBytes = isUploadRoute ? 38 * 1024 * 1024 : cfg.MAX_JSON_BODY_BYTES;

    let rawBodyText: string | undefined;
    let parsedBody: unknown = undefined;

    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) {
      rawBodyText = await request.text();
      if (Buffer.byteLength(rawBodyText, 'utf8') > maxBodyBytes) {
        throw AppError.payloadTooLarge(
          'PAYLOAD_TOO_LARGE',
          `Request payload exceeds maximum limit of ${maxBodyBytes} bytes.`
        );
      }
      if (subpath !== '/webhooks/billing' && rawBodyText.trim().length > 0) {
        try {
          parsedBody = JSON.parse(rawBodyText);
        } catch {
          throw AppError.badRequest('MALFORMED_JSON', 'Request body contains malformed JSON.');
        }
      }
    }

    const headerMap: Record<string, string | undefined> = {};
    request.headers.forEach((value, key) => {
      headerMap[key.toLowerCase()] = value;
    });

    const output = await dispatchGatewayRoute({
      method: request.method,
      subpath,
      query: request.nextUrl.searchParams,
      headers: headerMap,
      body: parsedBody,
      rawBody: rawBodyText,
      actor,
      ipHmac,
      correlationId,
      sloTracker,
      circuitBreaker,
    });

    sloTracker.recordRequest(performance.now() - startMs, output.status);

    const res = NextResponse.json(output.body, { status: output.status });
    res.headers.set('X-Correlation-Id', correlationId);
    res.headers.set('X-Content-Type-Options', 'nosniff');
    res.headers.set('Cache-Control', 'no-store');
    if (output.headers) {
      for (const [hk, hv] of Object.entries(output.headers)) {
        res.headers.set(hk, hv);
      }
    }
    return res;
  } catch (err) {
    const problem = toProblemDetails(err, correlationId);
    sloTracker.recordRequest(performance.now() - startMs, problem.status);

    return NextResponse.json(problem, {
      status: problem.status,
      headers: {
        'Content-Type': 'application/problem+json',
        'X-Correlation-Id': correlationId,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    });
  }
}

export async function GET(req: NextRequest, ctx: RouteContext) {
  return handleNextApiV1(req, ctx);
}
export async function POST(req: NextRequest, ctx: RouteContext) {
  return handleNextApiV1(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  return handleNextApiV1(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  return handleNextApiV1(req, ctx);
}
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, PATCH, DELETE, OPTIONS',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
