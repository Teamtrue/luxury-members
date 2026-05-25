import { NextResponse } from 'next/server';
import { listActivePlans } from '@/lib/db/memberships';

export async function GET() {
  const plans = await listActivePlans();
  return NextResponse.json({ ok: true, plans });
}
