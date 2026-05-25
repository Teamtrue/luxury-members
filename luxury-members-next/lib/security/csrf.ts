import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export function createCsrfToken(sessionId: string): string {
  const nonce = randomBytes(16).toString('hex');
  const digest = createHash('sha256').update(`${sessionId}:${nonce}`).digest('hex');
  return `${nonce}.${digest}`;
}

export function verifyCsrfToken(sessionId: string, token?: string): boolean {
  if (!token) return false;
  const [nonce, digest] = token.split('.');
  if (!nonce || !digest) return false;
  const expected = createHash('sha256').update(`${sessionId}:${nonce}`).digest('hex');
  if (expected.length !== digest.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(digest));
}
