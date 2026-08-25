import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// --- CONFIGURATION & ENV SECRETS ---
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || process.env.DOTFY_API_KEY || 'default_webhook_secret_key_2026';

// --- 1. PASSWORD HASHING (SCRYPT WITH SALT + LEGACY FALLBACK) ---
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): { valid: boolean; needsRehash: boolean } {
  if (!storedHash) return { valid: false, needsRehash: false };

  // Modern scrypt format: scrypt$N$r$p$salt$hash
  if (storedHash.startsWith('scrypt$')) {
    const parts = storedHash.split('$');
    if (parts.length !== 6) return { valid: false, needsRehash: false };

    const N = parseInt(parts[1], 10);
    const r = parseInt(parts[2], 10);
    const p = parseInt(parts[3], 10);
    const salt = parts[4];
    const originalHash = parts[5];

    try {
      const derivedKey = crypto.scryptSync(password, salt, 64, { N, r, p });
      const hashBuffer = Buffer.from(originalHash, 'hex');
      if (derivedKey.length !== hashBuffer.length) {
        return { valid: false, needsRehash: false };
      }
      const match = crypto.timingSafeEqual(derivedKey, hashBuffer);
      return { valid: match, needsRehash: false };
    } catch (e) {
      return { valid: false, needsRehash: false };
    }
  }

  // Legacy PBKDF2 hash check
  const legacyHash = crypto.pbkdf2Sync(password, 'paygateway_salt_2026', 1000, 64, 'sha512').toString('hex');
  const isLegacyValid = crypto.timingSafeEqual(Buffer.from(legacyHash, 'utf-8'), Buffer.from(storedHash, 'utf-8'));
  
  return {
    valid: isLegacyValid,
    needsRehash: isLegacyValid // Needs upgrade to scrypt
  };
}

// --- 2. SECURE SESSION MANAGEMENT ---
export interface SessionData {
  userId: string;
  createdAt: number;
  lastActiveAt: number;
  ip: string;
  userAgent: string;
}

const activeSessions = new Map<string, SessionData>();
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 Horas

export function createSession(userId: string, req: Request): string {
  const tokenBytes = crypto.randomBytes(32);
  const token = 'tok_sec_' + tokenBytes.toString('hex');
  const now = Date.now();

  const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  const userAgent = req.headers['user-agent'] || 'unknown';

  activeSessions.set(token, {
    userId,
    createdAt: now,
    lastActiveAt: now,
    ip,
    userAgent
  });

  return token;
}

export function getSession(token: string): SessionData | null {
  const session = activeSessions.get(token);
  if (!session) return null;

  const now = Date.now();
  if (now - session.lastActiveAt > SESSION_TTL_MS) {
    activeSessions.delete(token);
    return null;
  }

  // Update last active timestamp
  session.lastActiveAt = now;
  return session;
}

export function destroySession(token: string): boolean {
  return activeSessions.delete(token);
}

// Periodic cleanup of stale sessions
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (now - session.lastActiveAt > SESSION_TTL_MS) {
      activeSessions.delete(token);
    }
  }
}, 30 * 60 * 1000);

// --- 3. BRUTE FORCE & RATE LIMITING PROTECTION ---
interface RateLimitRecord {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const failedLoginMap = new Map<string, { attempts: number; blockedUntil?: number }>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  let record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + windowMs };
    rateLimitMap.set(key, record);
    return { allowed: true, retryAfterSec: 0 };
  }

  if (record.count >= maxRequests) {
    const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  record.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

export function recordFailedLogin(identifier: string): { blocked: boolean; remainingAttempts: number; blockTimeSec: number } {
  const now = Date.now();
  let entry = failedLoginMap.get(identifier);

  if (!entry) {
    entry = { attempts: 1 };
    failedLoginMap.set(identifier, entry);
    return { blocked: false, remainingAttempts: 4, blockTimeSec: 0 };
  }

  if (entry.blockedUntil && now < entry.blockedUntil) {
    const blockTimeSec = Math.ceil((entry.blockedUntil - now) / 1000);
    return { blocked: true, remainingAttempts: 0, blockTimeSec };
  }

  entry.attempts += 1;

  if (entry.attempts >= 5) {
    // Bloqueio por 15 minutos
    entry.blockedUntil = now + 15 * 60 * 1000;
    const blockTimeSec = 15 * 60;
    return { blocked: true, remainingAttempts: 0, blockTimeSec };
  }

  return { blocked: false, remainingAttempts: 5 - entry.attempts, blockTimeSec: 0 };
}

export function recordSuccessfulLogin(identifier: string) {
  failedLoginMap.delete(identifier);
}

export function isIdentifierBlocked(identifier: string): { blocked: boolean; blockTimeSec: number } {
  const entry = failedLoginMap.get(identifier);
  if (!entry || !entry.blockedUntil) return { blocked: false, blockTimeSec: 0 };

  const now = Date.now();
  if (now < entry.blockedUntil) {
    const blockTimeSec = Math.ceil((entry.blockedUntil - now) / 1000);
    return { blocked: true, blockTimeSec };
  }

  // Lockout expired
  failedLoginMap.delete(identifier);
  return { blocked: false, blockTimeSec: 0 };
}

// --- 4. HMAC SIGNATURE VERIFICATION (WEBHOOKS) ---
export function verifyHmacSignature(rawBody: string, signature: string, secret: string = WEBHOOK_SECRET): boolean {
  if (!signature || !rawBody) return false;

  try {
    const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const computedBuffer = Buffer.from(computed, 'utf-8');
    const signatureBuffer = Buffer.from(signature.replace(/^sha256=/, ''), 'utf-8');

    if (computedBuffer.length !== signatureBuffer.length) return false;
    return crypto.timingSafeEqual(computedBuffer, signatureBuffer);
  } catch (e) {
    return false;
  }
}

// --- 5. AUDIT SECURITY LOGGER ---
export function logSecurityEvent(event: string, metadata: Record<string, any>) {
  const sanitizedMeta: Record<string, any> = {};

  for (const [key, val] of Object.entries(metadata)) {
    const lower = key.toLowerCase();
    if (lower.includes('password') || lower.includes('secret') || lower.includes('token') || lower.includes('apikey')) {
      sanitizedMeta[key] = '[MASCARADO_REDACTED]';
    } else if (lower.includes('pixkey') || lower.includes('taxid') || lower.includes('cpf')) {
      const strVal = String(val);
      sanitizedMeta[key] = strVal.length > 6 ? strVal.substring(0, 3) + '***' + strVal.substring(strVal.length - 2) : '***';
    } else {
      sanitizedMeta[key] = val;
    }
  }

  console.log(`[AUDIT_LOG_SECURITY] [${new Date().toISOString()}] EVENT: ${event} | META: ${JSON.stringify(sanitizedMeta)}`);
}

// --- 6. EXPRESS SECURITY MIDDLEWARES ---
export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

export function generalRateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  const rateKey = `gen_${clientIp}`;

  const { allowed, retryAfterSec } = checkRateLimit(rateKey, 150, 60 * 1000); // 150 requests per minute
  if (!allowed) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', { ip: clientIp, path: req.path });
    return res.status(429).json({
      error: 'Muitas requisições. Por favor, aguarde alguns segundos e tente novamente.',
      retryAfterSec
    });
  }

  next();
}

export function authRateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
  const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
  const rateKey = `auth_${clientIp}`;

  const { allowed, retryAfterSec } = checkRateLimit(rateKey, 20, 60 * 1000); // 20 auth requests per minute max
  if (!allowed) {
    logSecurityEvent('AUTH_RATE_LIMIT_EXCEEDED', { ip: clientIp, path: req.path });
    return res.status(429).json({
      error: 'Limite de tentativas atingido. Aguarde antes de tentar novamente.',
      retryAfterSec
    });
  }

  next();
}

// --- 7. INPUT SANITIZATION HELPERS ---
export function sanitizeString(str: any, maxLength: number = 255): string {
  if (typeof str !== 'string') return '';
  // Strip control characters & HTML tags
  return str.replace(/<[^>]*>?/gm, '').replace(/[\0\x08\x09\x1a\n\r]/g, '').trim().slice(0, maxLength);
}

export function isValidEmail(email: any): boolean {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim()) && email.trim().length <= 254;
}

export function isPositiveNumber(val: any): boolean {
  const num = parseFloat(val);
  return !isNaN(num) && isFinite(num) && num > 0;
}
