import { NextRequest } from 'next/server';

export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  const host = req.headers.get('host');
  if (!origin || !host) return true;

  try {
    const o = new URL(origin);
    return o.host === host;
  } catch {
    return false;
  }
}
