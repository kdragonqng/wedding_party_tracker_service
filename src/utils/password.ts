import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto';

const ITERATIONS = 100_000;
const KEYLEN = 32; // 256-bit
const DIGEST = 'sha256';

export function hashPassword(plain: string): { salt: string; hash: string; iterations: number } {
  if (!plain || plain.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }
  const salt = randomBytes(16).toString('hex');
  const derived = pbkdf2Sync(plain, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return { salt, hash: derived, iterations: ITERATIONS };
}

export function verifyPassword(plain: string, salt: string, hash: string, iterations = ITERATIONS): boolean {
  const derived = pbkdf2Sync(plain, salt, iterations, KEYLEN, DIGEST).toString('hex');
  const a = Buffer.from(derived, 'hex');
  const b = Buffer.from(hash, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

