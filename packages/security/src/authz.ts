import { AppError } from '@clouse/core';

export type AppRole = 'anonymous' | 'user' | 'premium' | 'support' | 'admin';
export type AccountPlan = 'free' | 'pro' | 'enterprise';

export interface AuthenticatedActor {
  userId: string | null;
  accountId: string | null;
  role: AppRole;
  plan: AccountPlan;
  actorKey: string; // user:<uuid> or ip:<hmac-prefix>
  scopes: string[];
  sessionExpiresAt?: string;
}

const ROLE_WEIGHT: Record<AppRole, number> = {
  anonymous: 0,
  user: 10,
  premium: 20,
  support: 30,
  admin: 100,
};

export function createAnonymousActor(ipHmac: string): AuthenticatedActor {
  return {
    userId: null,
    accountId: null,
    role: 'anonymous',
    plan: 'free',
    actorKey: `ip:${ipHmac.slice(0, 24)}`,
    scopes: ['tools:execute'],
  };
}

export function hasMinimumRole(actor: AuthenticatedActor, requiredRole: AppRole): boolean {
  if (requiredRole === 'admin') {
    return actor.role === 'admin';
  }
  return ROLE_WEIGHT[actor.role] >= ROLE_WEIGHT[requiredRole];
}

export function assertRoleAtLeast(actor: AuthenticatedActor, requiredRole: AppRole): void {
  if (actor.role === 'anonymous' && requiredRole !== 'anonymous') {
    throw AppError.unauthorized('AUTH_REQUIRED', 'Authentication is required to access this endpoint.');
  }
  if (!hasMinimumRole(actor, requiredRole)) {
    throw AppError.forbidden(
      'INSUFFICIENT_ROLE',
      `Role "${actor.role}" is not permitted; minimum required role is "${requiredRole}".`
    );
  }
}

export function assertAdminMutationAccess(actor: AuthenticatedActor): void {
  // Explicit separation of duties: support cannot execute admin mutations (PDF 2 Domain 05 t5 & t10)
  if (actor.role === 'anonymous') {
    throw AppError.unauthorized();
  }
  if (actor.role !== 'admin') {
    throw AppError.forbidden(
      'ADMIN_PRIVILEGE_REQUIRED',
      'Administrative privilege is required; support and regular accounts are denied.'
    );
  }
}

export function assertObjectOwnership(
  actor: AuthenticatedActor,
  resourceOwnerId: string | null | undefined,
  options: { allowAdmin?: boolean; allowSupportRead?: boolean; isWrite?: boolean } = {}
): void {
  if (!actor.userId) {
    throw AppError.unauthorized('AUTH_REQUIRED', 'Authenticated user context is required to access private objects.');
  }
  if (options.allowAdmin && actor.role === 'admin') {
    return;
  }
  if (!options.isWrite && options.allowSupportRead && actor.role === 'support') {
    return;
  }
  if (!resourceOwnerId || actor.userId !== resourceOwnerId) {
    throw AppError.forbidden(
      'BOLA_OWNERSHIP_DENIED',
      'Cross-account access to another user object is denied by default.'
    );
  }
}

export function assertSessionFreshness(options: {
  idleExpiresAtIso?: string | null;
  absoluteExpiresAtIso?: string | null;
  revokedAtIso?: string | null;
  nowMs?: number;
}): void {
  const now = options.nowMs ?? Date.now();
  if (options.revokedAtIso) {
    throw AppError.unauthorized('SESSION_REVOKED', 'Session has been revoked.');
  }
  if (options.absoluteExpiresAtIso && Date.parse(options.absoluteExpiresAtIso) <= now) {
    throw AppError.unauthorized('SESSION_ABSOLUTE_EXPIRED', 'Session reached absolute lifetime limit; re-authenticate.');
  }
  if (options.idleExpiresAtIso && Date.parse(options.idleExpiresAtIso) <= now) {
    throw AppError.unauthorized('SESSION_IDLE_EXPIRED', 'Session expired due to inactivity.');
  }
}
