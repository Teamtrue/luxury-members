import { randomInt } from 'crypto';
import { NextResponse } from 'next/server';
import { TIER_PRICES } from '@/lib/utils';
import { Tier } from '@/lib/types';
import { createServiceRoleClient } from '@/lib/supabase/service';

export async function POST(req: Request) {
  const { tier, member_id } = await req.json() as { tier?: string; member_id?: string };

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

  // Dev / test mode: return mock order
  if (!process.env.RAZORPAY_KEY_ID || process.env.NODE_ENV !== 'production') {
    return NextResponse.json({
      id: 'order_mock_' + Date.now(),
      amount: total * 100, // paise
      currency: 'INR',
      receipt,
      tier,
      membership_id: membershipId,
      razorpay_key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? 'rzp_test_mock',
    });
  }

  // Production: create Razorpay order
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
