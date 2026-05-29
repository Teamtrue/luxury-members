/**
 * src/lib/api.ts
 * Typed fetch wrapper for the PlutusClub API.
 * Base URL is controlled by EXPO_PUBLIC_API_URL env var.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://plutusclub.in';

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

// ── Typed response shapes ─────────────────────────────────────────────────

export type Tier = 'Silver' | 'Gold' | 'Platinum' | 'Obsidian';

export interface MemberProfile {
  id: string;
  name: string;
  phone: string;
  tier: Tier;
  token_balance: number;
  savings_this_month: number;
  active_bookings_count: number;
}

export interface Deal {
  id: string;
  title: string;
  category: string;
  original_price: number;
  club_price: number;
  savings_pct: number;
  min_tier: Tier;
  description?: string;
  expires_at?: string;
}

export interface MemberFeedResponse {
  member: MemberProfile;
  deals: Deal[];
}

export interface TokenTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  created_at: string;
}

export interface TokensResponse {
  balance: number;
  transactions: TokenTransaction[];
}

export interface ReferralStats {
  referral_code: string;
  total_referrals: number;
  commission_earned: number;
  referees: Array<{
    id: string;
    name: string;
    joined_at: string;
    tier: Tier;
  }>;
}

export interface OTPSendResponse {
  success: boolean;
  data?: { message?: string };
  message?: string;
}

export interface OTPVerifyResponse {
  success: boolean;
  data?: {
    access_token: string;
    refresh_token: string;
    user: { id: string; phone: string; role: string };
  };
}

export interface BookingCreateResponse {
  success: boolean;
  data?: {
    booking: { id: string; booking_ref: string; total_paise: number; tokens_used: number };
  };
}

export interface PaymentOrderResponse {
  success: boolean;
  data?: { order_id: string; amount: number; currency: string; is_test_mode?: boolean };
}

export interface PaymentVerifyResponse {
  success: boolean;
  data?: { status: string; tokens_earned: number; booking_ref?: string };
}
