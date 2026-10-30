import { randomUUID } from 'node:crypto';
import * as path from 'node:path';
import * as z from 'zod';
import { AppError } from '@clouse/core';

// Strips null bytes and Unicode BiDi Trojan-Source control characters
const DANGEROUS_CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g;
const FORBIDDEN_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const WINDOWS_RESERVED_BASENAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

export function normalizeUnicodeInput(input: string, maxLength = 65_536): string {
  if (typeof input !== 'string') {
    throw AppError.badRequest('INVALID_STRING_INPUT', 'Expected a UTF-8 string value.');
  }
  const normalized = input.normalize('NFC').replace(DANGEROUS_CONTROL_CHARS, '');
  if (normalized.length > maxLength) {
    throw AppError.badRequest(
      'STRING_MAX_LENGTH_EXCEEDED',
      `Input exceeds maximum permitted length of ${maxLength} characters.`
    );
  }
  return normalized;
}

export function assertSafeObjectStructure(
  value: unknown,
  options: { maxDepth?: number; maxKeys?: number; maxArrayLength?: number } = {},
  currentDepth = 0
): void {
  const maxDepth = options.maxDepth ?? 10;
  const maxKeys = options.maxKeys ?? 150;
  const maxArrayLength = options.maxArrayLength ?? 500;

  if (currentDepth > maxDepth) {
    throw AppError.badRequest('JSON_DEPTH_EXCEEDED', 'Input JSON nesting depth exceeds security policy.');
  }
  if (value === null || typeof value !== 'object') {
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > maxArrayLength) {
      throw AppError.badRequest(
        'ARRAY_LIMIT_EXCEEDED',
        `Array exceeds maximum permitted length of ${maxArrayLength} elements.`
      );
    }
    for (const item of value) {
      assertSafeObjectStructure(item, options, currentDepth + 1);
    }
    return;
  }

  // Detect explicit own-property __proto__ / constructor / prototype (anti-prototype-pollution)
  const ownKeys = Object.getOwnPropertyNames(value);
  if (ownKeys.length > maxKeys) {
    throw AppError.badRequest(
      'OBJECT_KEYS_EXCEEDED',
      `Object contains more than ${maxKeys} properties.`
    );
  }
  for (const key of ownKeys) {
    if (FORBIDDEN_OBJECT_KEYS.has(key)) {
      throw AppError.badRequest(
        'PROTOTYPE_POLLUTION_BLOCKED',
        `Forbidden property key "${key}" rejected by input validator.`
      );
    }
    const child = (value as Record<string, unknown>)[key];
    assertSafeObjectStructure(child, options, currentDepth + 1);
  }
}

export function parseStrictSchema<T>(schema: z.ZodType<T>, rawPayload: unknown): T {
  assertSafeObjectStructure(rawPayload);
  const parsed = schema.safeParse(rawPayload);
  if (!parsed.success) {
    const issues = parsed.error.issues.slice(0, 15).map((issue) => ({
      path: issue.path.join('.') || 'root',
      message: issue.message,
    }));
    const hasUnrecognized = parsed.error.issues.some((i) => i.code === 'unrecognized_keys');
    throw AppError.badRequest(
      hasUnrecognized ? 'MASS_ASSIGNMENT_REJECTED' : 'VALIDATION_FAILED',
      hasUnrecognized
        ? 'Unknown fields are not permitted in request payload.'
        : 'Request payload failed schema validation.',
      issues
    );
  }
  return parsed.data;
}

export function sanitizeFilename(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') {
    throw AppError.badRequest('INVALID_FILENAME', 'A valid filename is required.');
  }
  if (rawName.includes('\0') || rawName.includes('..') || rawName.includes('/') || rawName.includes('\\')) {
    throw AppError.badRequest(
      'PATH_TRAVERSAL_BLOCKED',
      'Filename contains forbidden path traversal or separator characters.'
    );
  }
  const base = path.posix.basename(rawName.normalize('NFC')).trim();
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
  if (!cleaned || cleaned.length > 180 || WINDOWS_RESERVED_BASENAMES.test(cleaned)) {
    throw AppError.badRequest('INVALID_FILENAME', 'Filename violates platform naming policy.');
  }
  return cleaned;
}

export function buildIsolatedStorageKey(actorFolder: string, safeExtension: string): string {
  const cleanActor = actorFolder.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 36) || 'anon-actor';
  const cleanExt = safeExtension.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
  if (!cleanExt) {
    throw AppError.badRequest('INVALID_EXTENSION', 'File extension is required for isolated storage.');
  }
  return `${cleanActor}/${randomUUID()}.${cleanExt}`;
}
