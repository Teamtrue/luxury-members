import { randomInt } from 'crypto';
import { NextResponse } from 'next/server';
import { TIER_PRICES } from '@/lib/utils';
import { Tier } from '@/lib/types';
import { createServiceRoleClient } from '@/lib/supabase/service';
import { requireAuth } from '@/lib/api-helpers';

export async function POST(req: Request) {
  const authResult = await requireAuth(req);
  if ('error' in authResult) return authResult.error;
  const { user } = authResult;

  const { tier } = await req.json() as { tier?: string };
  const member_id = user.id;

  if (!tier || !['silver', 'gold', 'platinum', 'obsidian'].includes(tier)) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  const { total } = TIER_PRICES[tier as Tier];
  const receipt = `MEMB-${member_id ?? 'new'}-${Date.now()}`;

  // Create a pending membership row so the payment verify route can activate
  // it after payment succeeds. Only possible when member_id (user UUID) is provided.
  let membershipId: string | null = null;
  if (member_id) {
    try {
      const db = createServiceRoleClient();

      // Look up the membership_plans row for this tier.
      const { data: plan } = await db
        .from('membership_plans')
        .select('id')
        .eq('slug', tier)
        .eq('is_active', true)
        .maybeSingle();

      if (plan) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const referralCode = Array.from({ length: 8 }, () => chars[randomInt(chars.length)]).join('');
        const { data: membership } = await db
          .from('memberships')
          .insert({
            user_id:       member_id,
            plan_id:       (plan as Record<string, unknown>).id as string,
            status:        'pending',
            referral_code: referralCode,
          })
          .select('id')
          .single();

        if (membership) {
          membershipId = (membership as Record<string, unknown>).id as string;
        }
      }
    } catch (err) {
      // Non-fatal: membership activation can fall back to user_id lookup.
      console.error('Membership pre-create error:', err);
    }
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('[membership/create-order] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set');
    return NextResponse.json({ error: 'Payment gateway not configured.' }, { status: 503 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Razorpay = require('razorpay');
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const order = await instance.orders.create({
      amount: total * 100,
      currency: 'INR',
      receipt,
      notes: { tier, member_id: member_id ?? 'new', membership_id: membershipId ?? '' },
    });
    return NextResponse.json({
      ...order,
      tier,
      membership_id: membershipId,
      razorpay_key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay membership order failed:', err);
    return NextResponse.json({ error: 'Payment gateway error' }, { status: 500 });
  }
}
