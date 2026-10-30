import { maskSensitiveString } from './logger';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  code: string;
  detail: string;
  correlationId: string;
  issues?: Array<{ path: string; message: string }>;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly title: string;
  public readonly expose: boolean;
  public readonly issues?: Array<{ path: string; message: string }>;

  constructor(options: {
    statusCode: number;
    code: string;
    title: string;
    message: string;
    expose?: boolean;
    issues?: Array<{ path: string; message: string }>;
  }) {
    super(options.message);
    this.name = 'AppError';
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.title = options.title;
    this.expose = options.expose ?? options.statusCode < 500;
    this.issues = options.issues;
  }

  static badRequest(code: string, message: string, issues?: Array<{ path: string; message: string }>): AppError {
    return new AppError({
      statusCode: 400,
      code,
      title: 'Bad Request',
      message,
      expose: true,
      issues,
    });
  }

  static unauthorized(code = 'AUTH_REQUIRED', message = 'Authentication is required for this resource.'): AppError {
    return new AppError({
      statusCode: 401,
      code,
      title: 'Unauthorized',
      message,
      expose: true,
    });
  }

  static forbidden(code = 'ACCESS_DENIED', message = 'Access to this resource is denied by policy.'): AppError {
    return new AppError({
      statusCode: 403,
      code,
      title: 'Forbidden',
      message,
      expose: true,
    });
  }

  static notFound(code = 'RESOURCE_NOT_FOUND', message = 'The requested resource was not found.'): AppError {
    return new AppError({
      statusCode: 404,
      code,
      title: 'Not Found',
      message,
      expose: true,
    });
  }

  static payloadTooLarge(code = 'PAYLOAD_TOO_LARGE', message = 'Request payload exceeds the maximum permitted limit.'): AppError {
    return new AppError({
      statusCode: 413,
      code,
      title: 'Payload Too Large',
      message,
      expose: true,
    });
  }

  static unsupportedMedia(code = 'UNSUPPORTED_MEDIA_TYPE', message = 'File type or Content-Type is not permitted.'): AppError {
    return new AppError({
      statusCode: 415,
      code,
      title: 'Unsupported Media Type',
      message,
      expose: true,
    });
  }

  static rateLimited(code = 'RATE_LIMIT_EXCEEDED', message = 'Too many requests. Please wait before retrying.'): AppError {
    return new AppError({
      statusCode: 429,
      code,
      title: 'Too Many Requests',
      message,
      expose: true,
    });
  }

  static serviceUnavailable(code = 'CIRCUIT_OPEN', message = 'Service temporarily unavailable due to protective backpressure.'): AppError {
    return new AppError({
      statusCode: 503,
      code,
      title: 'Service Unavailable',
      message,
      expose: true,
    });
  }
}

export function toProblemDetails(err: unknown, correlationId: string): ProblemDetails {
  if (err instanceof AppError) {
    return {
      type: `https://clouse.app/problems/${err.code.toLowerCase().replace(/_/g, '-')}`,
      title: err.title,
      status: err.statusCode,
      code: err.code,
      detail: err.expose
        ? maskSensitiveString(err.message)
        : 'An unexpected internal error occurred. Reference the correlationId for support.',
      correlationId,
      ...(err.expose && err.issues ? { issues: err.issues } : {}),
    };
  }

  // Express body-parser entity.too.large / SyntaxError handling without stack leak
  if (err && typeof err === 'object') {
    const maybeErr = err as { type?: string; status?: number; statusCode?: number };
    if (maybeErr.type === 'entity.too.large' || maybeErr.status === 413 || maybeErr.statusCode === 413) {
      return {
        type: 'https://clouse.app/problems/payload-too-large',
        title: 'Payload Too Large',
        status: 413,
        code: 'PAYLOAD_TOO_LARGE',
        detail: 'Request payload exceeds the configured body size limit.',
        correlationId,
      };
    }
    if (err instanceof SyntaxError && (maybeErr.status === 400 || maybeErr.statusCode === 400)) {
      return {
        type: 'https://clouse.app/problems/malformed-json',
        title: 'Bad Request',
        status: 400,
        code: 'MALFORMED_JSON',
        detail: 'Request body contains malformed JSON.',
        correlationId,
      };
    }
  }

  return {
    type: 'https://clouse.app/problems/internal-error',
    title: 'Internal Server Error',
    status: 500,
    code: 'INTERNAL_ERROR',
    detail: 'An unexpected internal error occurred. Reference the correlationId for support.',
    correlationId,
  };
}
