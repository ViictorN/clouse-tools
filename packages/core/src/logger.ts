export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEY_PATTERN =
  /(password|senha|passphrase|secret|token|authorization|cookie|set-cookie|api[-_]?key|service[-_]?role|private[-_]?key|pepper|card[-_]?number|cvv|cvc|pan|cpf|cnpj|ssn)/i;

const JWT_INLINE_PATTERN = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const BEARER_PATTERN = /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}\b/gi;
const SECRET_PREFIX_PATTERN = /\b(sk_(?:live|test)_[A-Za-z0-9]+|whsec_[A-Za-z0-9]+|sbp_[A-Za-z0-9]+|sb_secret_[A-Za-z0-9_-]+)\b/g;
const CPF_PATTERN = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const EMAIL_PATTERN = /\b([A-Za-z0-9._%+-])([A-Za-z0-9._%+-]*?)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g;

export function maskSensitiveString(input: string): string {
  return input
    .replace(BEARER_PATTERN, 'Bearer [REDACTED]')
    .replace(JWT_INLINE_PATTERN, '[REDACTED_JWT]')
    .replace(SECRET_PREFIX_PATTERN, '[REDACTED_SECRET]')
    .replace(CPF_PATTERN, '[REDACTED_CPF]')
    .replace(EMAIL_PATTERN, (_full, firstChar: string, _rest: string, domain: string) => {
      return `${firstChar}***@${domain}`;
    });
}

export function redactPiiAndSecrets(
  value: unknown,
  depth = 0,
  seen: WeakSet<object> = new WeakSet()
): unknown {
  if (depth > 6) {
    return '[MAX_DEPTH_TRUNCATED]';
  }
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string') {
    const truncated = value.length > 2048 ? `${value.slice(0, 2048)}...[TRUNCATED]` : value;
    return maskSensitiveString(truncated);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: maskSensitiveString(value.message),
    };
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => redactPiiAndSecrets(item, depth + 1, seen));
  }
  if (typeof value === 'object') {
    if (seen.has(value)) {
      return '[CIRCULAR]';
    }
    seen.add(value);
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (key === 'email' && typeof val === 'string') {
        out[key] = maskSensitiveString(val);
      } else if (SENSITIVE_KEY_PATTERN.test(key)) {
        out[key] = '[REDACTED]';
      } else {
        out[key] = redactPiiAndSecrets(val, depth + 1, seen);
      }
    }
    return out;
  }
  return String(value);
}

export interface LogRecord {
  timestamp: string;
  level: LogLevel;
  service: string;
  correlationId?: string;
  event: string;
  context?: Record<string, unknown>;
}

export interface StructuredLogger {
  debug(event: string, context?: Record<string, unknown>): LogRecord | null;
  info(event: string, context?: Record<string, unknown>): LogRecord | null;
  warn(event: string, context?: Record<string, unknown>): LogRecord | null;
  error(event: string, context?: Record<string, unknown>): LogRecord | null;
}

export function createLogger(
  service: string,
  options: {
    minLevel?: LogLevel;
    sink?: (jsonLine: string, record: LogRecord) => void;
  } = {}
): StructuredLogger {
  const minLevel = options.minLevel ?? ((process.env.LOG_LEVEL as LogLevel) || 'info');
  const minPriority = LEVEL_PRIORITY[minLevel] ?? LEVEL_PRIORITY.info;

  const emit = (level: LogLevel, event: string, context?: Record<string, unknown>): LogRecord | null => {
    if (LEVEL_PRIORITY[level] < minPriority) {
      return null;
    }

    const sanitizedContext = context
      ? (redactPiiAndSecrets(context) as Record<string, unknown>)
      : undefined;

    const correlationId =
      typeof sanitizedContext?.correlationId === 'string'
        ? sanitizedContext.correlationId
        : undefined;

    const record: LogRecord = {
      timestamp: new Date().toISOString(),
      level,
      service,
      ...(correlationId ? { correlationId } : {}),
      event: maskSensitiveString(event),
      ...(sanitizedContext ? { context: sanitizedContext } : {}),
    };

    const serialized = JSON.stringify(record);
    if (options.sink) {
      options.sink(serialized, record);
    } else if (process.env.NODE_ENV !== 'test') {
      if (level === 'error') {
        console.error(serialized);
      } else if (level === 'warn') {
        console.warn(serialized);
      } else {
        console.log(serialized);
      }
    }

    return record;
  };

  return {
    debug: (event, context) => emit('debug', event, context),
    info: (event, context) => emit('info', event, context),
    warn: (event, context) => emit('warn', event, context),
    error: (event, context) => emit('error', event, context),
  };
}
