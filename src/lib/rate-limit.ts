const attempts = new Map<string, { count: number; firstAttempt: number; blockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_MS = 30 * 60 * 1000; // 30 minutes

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = attempts.get(ip);

  if (entry) {
    // Currently blocked
    if (entry.blockedUntil > now) {
      return { allowed: false, retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) };
    }

    // Window expired — reset
    if (now - entry.firstAttempt > WINDOW_MS) {
      attempts.set(ip, { count: 1, firstAttempt: now, blockedUntil: 0 });
      return { allowed: true };
    }

    // Within window — check count
    entry.count++;
    if (entry.count > MAX_ATTEMPTS) {
      entry.blockedUntil = now + BLOCK_MS;
      return { allowed: false, retryAfter: Math.ceil(BLOCK_MS / 1000) };
    }

    return { allowed: true };
  }

  // First attempt
  attempts.set(ip, { count: 1, firstAttempt: now, blockedUntil: 0 });
  return { allowed: true };
}

export function resetRateLimit(ip: string): void {
  attempts.delete(ip);
}
