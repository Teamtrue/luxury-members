import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const querySchema = z.object({
  dealPriceInr: z.number().int().positive(),
  benchmarkPriceInr: z.number().int().positive(),
  benchmarkSource: z.string().min(3).max(200)
});

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({
    dealPriceInr: Number(req.nextUrl.searchParams.get('dealPriceInr')),
    benchmarkPriceInr: Number(req.nextUrl.searchParams.get('benchmarkPriceInr')),
    benchmarkSource: req.nextUrl.searchParams.get('benchmarkSource') || ''
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
  }

  const savingsInr = Math.max(0, parsed.data.benchmarkPriceInr - parsed.data.dealPriceInr);
  const savingsPercent = Number(((savingsInr / parsed.data.benchmarkPriceInr) * 100).toFixed(2));

  return NextResponse.json({
    ok: true,
    proof: {
      dealPriceInr: parsed.data.dealPriceInr,
      benchmarkPriceInr: parsed.data.benchmarkPriceInr,
      benchmarkSource: parsed.data.benchmarkSource,
      savingsInr,
      savingsPercent,
      generatedAt: new Date().toISOString()
    }
  });
}
