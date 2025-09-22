import { createHmac } from 'crypto';

function base64url(input: Buffer | string): string {
  const raw = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return raw.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function signJwt(payload: Record<string, any>, secret: string, expiresInSeconds = 7 * 24 * 3600): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { iat: now, exp: now + expiresInSeconds, ...payload };
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(fullPayload));
  const toSign = `${headerB64}.${payloadB64}`;
  const signature = createHmac('sha256', secret).update(toSign).digest();
  const sigB64 = base64url(signature);
  return `${toSign}.${sigB64}`;
}

export function verifyJwt(token: string, secret: string): { valid: boolean; payload?: any; error?: string } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, error: 'Invalid token format' };
    const [headerB64, payloadB64, sigB64] = parts;
    const toSign = `${headerB64}.${payloadB64}`;
    const expected = createHmac('sha256', secret).update(toSign).digest();
    const actual = Buffer.from(sigB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    if (expected.length !== actual.length || !expected.equals(actual)) {
      return { valid: false, error: 'Invalid signature' };
    }
    const payloadJson = Buffer.from(payloadB64.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > payload.exp) return { valid: false, error: 'Token expired' };
    return { valid: true, payload };
  } catch (e) {
    return { valid: false, error: 'Verification failed' };
  }
}

