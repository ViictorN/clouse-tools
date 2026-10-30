import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { AppError } from '@clouse/core';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata',
  'metadata.google.internal',
  'metadata.goog',
  'instance-data',
  'kubernetes.default',
  'kubernetes.default.svc',
]);

export function isPrivateOrReservedIp(ipRaw: string): boolean {
  const ip = ipRaw.trim().toLowerCase().replace(/^\[|\]$/g, '');
  const version = isIP(ip);
  if (version === 0) {
    return true; // fail closed on unparseable IP
  }

  if (version === 4) {
    const octets = ip.split('.').map(Number);
    if (octets.length !== 4 || octets.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
      return true;
    }
    const [a, b, c] = octets;
    if (a === 0) return true; // 0.0.0.0/8 current network
    if (a === 10) return true; // 10.0.0.0/8 RFC1918
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local & cloud IMDS (169.254.169.254)
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 RFC1918
    if (a === 192 && b === 168) return true; // 192.168.0.0/16 RFC1918
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
    if (a === 192 && b === 0 && (c === 0 || c === 2)) return true; // IETF / TEST-NET-1
    if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15 benchmarking
    if (a === 198 && b === 51 && c === 100) return true; // TEST-NET-2
    if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3
    if (a >= 224) return true; // multicast & reserved 224.0.0.0/4 + 240.0.0.0/4
    return false;
  }

  // IPv6 checks
  if (ip === '::' || ip === '::1' || ip === '0:0:0:0:0:0:0:1' || ip === '0:0:0:0:0:0:0:0') {
    return true;
  }
  // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 or ::ffff:169.254.169.254 or hex ::ffff:7f00:1)
  if (ip.startsWith('::ffff:')) {
    const tail = ip.slice('::ffff:'.length);
    if (isIP(tail) === 4) {
      return isPrivateOrReservedIp(tail);
    }
    return true; // fail closed on hex-encoded IPv4-mapped IPv6
  }
  if (ip.startsWith('fc') || ip.startsWith('fd')) {
    return true; // fc00::/7 Unique Local + AWS IMDSv2 fd00:ec2::254
  }
  if (ip.startsWith('fe8') || ip.startsWith('fe9') || ip.startsWith('fea') || ip.startsWith('feb')) {
    return true; // fe80::/10 link-local
  }
  if (ip.startsWith('ff')) {
    return true; // ff00::/8 multicast
  }
  if (ip.startsWith('2001:db8:')) {
    return true; // documentation prefix
  }
  return false;
}

export interface SsrfValidationOptions {
  allowedHosts?: string[];
  allowHttpForTests?: boolean;
  dnsResolver?: (hostname: string) => Promise<Array<{ address: string; family: number }>>;
}

export interface SsrfAuditResult {
  normalizedUrl: string;
  hostname: string;
  port: number;
  resolvedAddresses: string[];
}

export async function validateExternalUrlAgainstSsrf(
  rawUrl: string,
  options: SsrfValidationOptions = {}
): Promise<SsrfAuditResult> {
  if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0 || rawUrl.length > 2048) {
    throw AppError.badRequest('SSRF_INVALID_URL', 'External URL must be a valid HTTPS URL up to 2048 characters.');
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw AppError.badRequest('SSRF_INVALID_URL', 'Malformed URL syntax.');
  }

  const allowedProtocols = options.allowHttpForTests ? ['https:', 'http:'] : ['https:'];
  if (!allowedProtocols.includes(parsed.protocol)) {
    throw AppError.forbidden(
      'SSRF_PROTOCOL_BLOCKED',
      `Protocol "${parsed.protocol}" is forbidden; only HTTPS is permitted.`
    );
  }

  if (parsed.username || parsed.password) {
    throw AppError.forbidden('SSRF_CREDENTIALS_IN_URL', 'Embedded credentials in URLs are forbidden.');
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (
    !hostname ||
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost')
  ) {
    throw AppError.forbidden('SSRF_HOST_BLOCKED', `Destination host "${hostname}" is blocked by SSRF policy.`);
  }

  if (options.allowedHosts && options.allowedHosts.length > 0) {
    const allowSet = new Set(options.allowedHosts.map((h) => h.toLowerCase()));
    if (!allowSet.has(hostname)) {
      throw AppError.forbidden(
        'SSRF_DESTINATION_NOT_ALLOWLISTED',
        `Host "${hostname}" is not in the approved destination allowlist.`
      );
    }
  }

  const port = parsed.port ? Number(parsed.port) : parsed.protocol === 'https:' ? 443 : 80;
  if (![80, 443].includes(port)) {
    throw AppError.forbidden('SSRF_PORT_BLOCKED', `Outbound port ${port} is not permitted.`);
  }

  const literalIpClean = hostname.replace(/^\[|\]$/g, '');
  if (isIP(literalIpClean) !== 0) {
    if (isPrivateOrReservedIp(literalIpClean)) {
      throw AppError.forbidden(
        'SSRF_PRIVATE_IP_BLOCKED',
        'Direct connections to private, loopback, link-local, or cloud metadata IPs are blocked.'
      );
    }
    return {
      normalizedUrl: parsed.toString(),
      hostname,
      port,
      resolvedAddresses: [literalIpClean],
    };
  }

  const resolver =
    options.dnsResolver ??
    ((host: string) => lookup(host, { all: true, verbatim: true }));

  let records: Array<{ address: string; family: number }>;
  try {
    records = await resolver(hostname);
  } catch {
    throw AppError.badRequest('SSRF_DNS_RESOLUTION_FAILED', `Unable to resolve host "${hostname}".`);
  }

  if (!records || records.length === 0) {
    throw AppError.badRequest('SSRF_DNS_EMPTY', `Host "${hostname}" returned no DNS records.`);
  }

  for (const record of records) {
    if (isPrivateOrReservedIp(record.address)) {
      throw AppError.forbidden(
        'SSRF_DNS_REBIND_PRIVATE_IP',
        `Host "${hostname}" resolved to a forbidden private or metadata IP address.`
      );
    }
  }

  return {
    normalizedUrl: parsed.toString(),
    hostname,
    port,
    resolvedAddresses: records.map((r) => r.address),
  };
}

export async function safeExternalFetch(
  rawUrl: string,
  options: SsrfValidationOptions & {
    timeoutMs?: number;
    maxResponseBytes?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<{ status: number; contentType: string; body: Buffer; audit: SsrfAuditResult }> {
  const audit = await validateExternalUrlAgainstSsrf(rawUrl, options);
  const timeoutMs = options.timeoutMs ?? 5000;
  const maxBytes = options.maxResponseBytes ?? 1_048_576; // 1 MiB strict default cap

  const response = await fetch(audit.normalizedUrl, {
    method: 'GET',
    redirect: 'error', // Block redirect-based SSRF
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Accept: 'application/json, text/plain;q=0.9',
      'User-Agent': 'ClouseTools-SafeFetcher/1.0',
      ...options.headers,
    },
  }).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : 'Outbound fetch failed';
    if (message.toLowerCase().includes('redirect')) {
      throw AppError.forbidden('SSRF_REDIRECT_BLOCKED', 'External HTTP redirects are disabled by SSRF policy.');
    }
    throw AppError.badRequest('EXTERNAL_FETCH_FAILED', 'External request timed out or failed safely.');
  });

  const reader = response.body?.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          throw AppError.payloadTooLarge(
            'EXTERNAL_RESPONSE_TOO_LARGE',
            `External response exceeded ${maxBytes} bytes cap.`
          );
        }
        chunks.push(value);
      }
    }
  }

  return {
    status: response.status,
    contentType: response.headers.get('content-type') || 'application/octet-stream',
    body: Buffer.concat(chunks.map((c) => Buffer.from(c))),
    audit,
  };
}
