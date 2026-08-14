import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { Request } from 'express';

// Helper to safely parse env variables or provide defaults
const getEnvInt = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (value && !isNaN(parseInt(value, 10))) {
    return parseInt(value, 10);
  }
  return defaultValue;
};

// ─── 1. Auth Limiters (Exponential Backoff) ──────────────────────────────────
// Instead of a hard block, we slow down abusive requests.

const authWindowMs = getEnvInt('RATE_LIMIT_AUTH_WINDOW_MS', 15 * 60 * 1000); // 15 minutes default
const authDelayAfter = getEnvInt('RATE_LIMIT_AUTH_DELAY_AFTER', 5);
const authDelayMs = getEnvInt('RATE_LIMIT_AUTH_DELAY_MS', 1000);
const authMaxDelayMs = getEnvInt('RATE_LIMIT_AUTH_MAX_DELAY_MS', 20000);

// Limiter based on IP Address
export const authIpLimiter = slowDown({
  windowMs: authWindowMs,
  delayAfter: authDelayAfter,
  delayMs: (hits) => hits * authDelayMs, // exponential/linear delay
  maxDelayMs: authMaxDelayMs,
});

// Limiter based on Account Identifier (Email or User ID)
export const authAccountLimiter = slowDown({
  windowMs: authWindowMs,
  delayAfter: authDelayAfter,
  delayMs: (hits) => hits * authDelayMs,
  maxDelayMs: authMaxDelayMs,
  keyGenerator: (req: Request) => {
    // For login/register/forgot-password, use email
    if (req.body && req.body.email) {
      return req.body.email.toLowerCase();
    }
    // Fallback if no email is provided 
    const fallbackIp = req.socket.remoteAddress || 'unknown';
    return fallbackIp.replace(/:/g, '_');
  },
});

// ─── 2. Public Limiter ────────────────────────────────────────────────────────
// Moderate limit for public endpoints

const publicWindowMs = getEnvInt('RATE_LIMIT_PUBLIC_WINDOW_MS', 15 * 60 * 1000);
const publicMax = getEnvInt('RATE_LIMIT_PUBLIC_MAX', 100);

export const publicLimiter = rateLimit({
  windowMs: publicWindowMs,
  max: publicMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again later.' },
});

// ─── 3. API Limiter ───────────────────────────────────────────────────────────
// Looser limit for authenticated actions

const apiWindowMs = getEnvInt('RATE_LIMIT_API_WINDOW_MS', 15 * 60 * 1000);
const apiMax = getEnvInt('RATE_LIMIT_API_MAX', 1000);

export const apiLimiter = rateLimit({
  windowMs: apiWindowMs,
  max: apiMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'API rate limit exceeded, please slow down your requests.' },
});
