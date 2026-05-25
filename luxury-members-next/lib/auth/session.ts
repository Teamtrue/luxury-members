import { SignJWT, jwtVerify } from 'jose';
import { SessionUser } from '@/types/auth';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev_only_change_me');

export async function createSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT(user as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}
