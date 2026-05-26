import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, 'ok' | 'error' | 'not_configured'> = {
    app: 'ok',
    supabase: 'not_configured',
    razorpay: 'not_configured',
  };

  // Check Supabase connectivity
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/', {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' },
        signal: AbortSignal.timeout(3000),
      });
      checks.supabase = res.ok ? 'ok' : 'error';
    } catch {
      checks.supabase = 'error';
    }
  }

  // Check Razorpay key configured
  checks.razorpay = process.env.RAZORPAY_KEY_ID ? 'ok' : 'not_configured';

  const allOk = Object.values(checks).every((v) => v === 'ok' || v === 'not_configured');
  const status = allOk ? 200 : 503;

  return NextResponse.json({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.1.0',
    checks,
  }, { status });
}
