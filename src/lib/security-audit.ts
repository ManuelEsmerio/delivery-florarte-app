import 'server-only';

import { promises as fs } from 'fs';
import path from 'path';

type HeadersLike = {
  get(name: string): string | null;
};

type SecurityEventType =
  | 'login_success'
  | 'login_failure'
  | 'login_locked'
  | 'login_domain_denied'
  | 'logout'
  | 'password_change'
  | 'delivery_complete'
  | 'delivery_incident'
  | 'auth_denied';

type SecurityEvent = {
  type: SecurityEventType;
  email?: string;
  driverId?: number;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  route?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

type RateLimitEntry = {
  attempts: number;
  windowStartedAt: number;
  lastAttemptAt: number;
  lockedUntil?: number;
};

type RateLimitState = Record<string, RateLimitEntry>;


const isProd = process.env.VERCEL || process.env.NODE_ENV === 'production';
const SECURITY_DIR = isProd
  ? path.join('/tmp', '.runtime-security')
  : path.join(process.cwd(), '.runtime-security');
// const AUDIT_LOG_FILE = path.join(SECURITY_DIR, 'audit.log');
const RATE_LIMIT_FILE = path.join(SECURITY_DIR, 'login-rate-limit.json');

const EMAIL_WINDOW_MS = 15 * 60 * 1000;
const IP_WINDOW_MS = 15 * 60 * 1000;
const EMAIL_MAX_ATTEMPTS = 5;
const IP_MAX_ATTEMPTS = 15;
const LOCKOUT_MS = 30 * 60 * 1000;

async function ensureSecurityDir() {
  await fs.mkdir(SECURITY_DIR, { recursive: true });
}

async function readRateLimitState(): Promise<RateLimitState> {
  await ensureSecurityDir();

  try {
    const raw = await fs.readFile(RATE_LIMIT_FILE, 'utf8');
    return JSON.parse(raw) as RateLimitState;
  } catch {
    return {};
  }
}

async function writeRateLimitState(state: RateLimitState) {
  await ensureSecurityDir();
  await fs.writeFile(RATE_LIMIT_FILE, JSON.stringify(state, null, 2), 'utf8');
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeRateLimitEntry(entry: RateLimitEntry | undefined, now: number, windowMs: number): RateLimitEntry | undefined {
  if (!entry) return undefined;

  if (entry.lockedUntil && entry.lockedUntil > now) {
    return entry;
  }

  if (entry.lockedUntil && entry.lockedUntil <= now) {
    return undefined;
  }

  if (now - entry.windowStartedAt > windowMs) {
    return undefined;
  }

  return entry;
}

function getRateLimitKeys(email: string, ipAddress?: string | null) {
  const keys = [`email:${normalizeEmail(email)}`];

  if (ipAddress) {
    keys.push(`ip:${ipAddress}`);
  }

  return keys;
}

function createRateLimitEntry(now: number): RateLimitEntry {
  return {
    attempts: 0,
    windowStartedAt: now,
    lastAttemptAt: now,
  };
}

function parseBrowser(userAgent?: string | null) {
  if (!userAgent) return 'Unknown';
  if (userAgent.includes('Edg/')) return 'Edge';
  if (userAgent.includes('Chrome/')) return 'Chrome';
  if (userAgent.includes('Firefox/')) return 'Firefox';
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) return 'Safari';
  return 'Unknown';
}

export function getClientIp(headersLike: HeadersLike) {
  const forwardedFor = headersLike.get('x-forwarded-for');
  const realIp = headersLike.get('x-real-ip');
  const candidate = forwardedFor?.split(',')[0]?.trim() || realIp?.trim() || '';
  return candidate || undefined;
}

export function getRequestSecurityContext(headersLike: HeadersLike, route?: string) {
  const userAgent = headersLike.get('user-agent') || undefined;

  return {
    ipAddress: getClientIp(headersLike),
    userAgent,
    browser: parseBrowser(userAgent),
    route,
  };
}

// Auditoría desactivada para evitar errores en Vercel
// export async function appendSecurityEvent(event: Omit<SecurityEvent, 'createdAt'>) {
//   try {
//     await ensureSecurityDir();
//     const payload: SecurityEvent = {
//       ...event,
//       createdAt: new Date().toISOString(),
//     };
//
//     await fs.appendFile(AUDIT_LOG_FILE, `${JSON.stringify(payload)}\n`, 'utf8');
//   } catch (error) {
//     console.error('Security audit log error:', error);
//   }
// }

export async function checkLoginRateLimit(email: string, ipAddress?: string) {
  const now = Date.now();
  const state = await readRateLimitState();
  const keys = getRateLimitKeys(email, ipAddress);

  let lockedUntil = 0;
  let shouldPersist = false;

  for (const key of keys) {
    const windowMs = key.startsWith('email:') ? EMAIL_WINDOW_MS : IP_WINDOW_MS;
    const normalized = normalizeRateLimitEntry(state[key], now, windowMs);

    if (!normalized && state[key]) {
      delete state[key];
      shouldPersist = true;
      continue;
    }

    if (normalized && normalized.lockedUntil && normalized.lockedUntil > lockedUntil) {
      lockedUntil = normalized.lockedUntil;
    }
  }

  if (shouldPersist) {
    await writeRateLimitState(state);
  }

  if (lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((lockedUntil - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function recordFailedLoginAttempt(email: string, ipAddress?: string) {
  const now = Date.now();
  const state = await readRateLimitState();
  const keys = getRateLimitKeys(email, ipAddress);

  let lockedUntil = 0;

  for (const key of keys) {
    const maxAttempts = key.startsWith('email:') ? EMAIL_MAX_ATTEMPTS : IP_MAX_ATTEMPTS;
    const windowMs = key.startsWith('email:') ? EMAIL_WINDOW_MS : IP_WINDOW_MS;
    const existing = normalizeRateLimitEntry(state[key], now, windowMs) ?? createRateLimitEntry(now);

    existing.attempts += 1;
    existing.lastAttemptAt = now;

    if (existing.attempts >= maxAttempts) {
      existing.lockedUntil = now + LOCKOUT_MS;
      lockedUntil = Math.max(lockedUntil, existing.lockedUntil);
    }

    state[key] = existing;
  }

  await writeRateLimitState(state);

  return {
    locked: lockedUntil > now,
    retryAfterSeconds: lockedUntil > now ? Math.max(1, Math.ceil((lockedUntil - now) / 1000)) : 0,
  };
}

export async function clearFailedLoginAttempts(email: string, ipAddress?: string) {
  const state = await readRateLimitState();
  const keys = getRateLimitKeys(email, ipAddress);
  let changed = false;

  for (const key of keys) {
    if (state[key]) {
      delete state[key];
      changed = true;
    }
  }

  if (changed) {
    await writeRateLimitState(state);
  }
}

export function getAllowedDriverEmailDomains() {
  const raw = process.env.ALLOWED_DRIVER_EMAIL_DOMAINS?.trim();
  if (!raw) return [];

  return raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedDriverEmail(email: string) {
  const allowedDomains = getAllowedDriverEmailDomains();
  if (allowedDomains.length === 0) return true;

  const domain = normalizeEmail(email).split('@')[1] || '';
  return allowedDomains.includes(domain);
}