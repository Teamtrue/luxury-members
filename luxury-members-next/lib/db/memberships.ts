import { dbQuery } from '@/lib/db/client';

export type MembershipPlan = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  price_inr: number;
  duration_days: number;
  is_active: boolean;
};

export async function listActivePlans(): Promise<MembershipPlan[]> {
  return dbQuery<MembershipPlan>(
    `select id, code, title, description, price_inr, duration_days, is_active
     from membership_plans
     where is_active = true
     order by price_inr asc`
  );
}

export async function createMembership(input: {
  id: string;
  userId: string;
  planId: string;
  startsAt: string;
  endsAt: string;
  autoRenew: boolean;
}): Promise<void> {
  await dbQuery(
    `insert into memberships (id, user_id, plan_id, status, starts_at, ends_at, auto_renew)
     values ($1, $2, $3, 'ACTIVE', $4::timestamptz, $5::timestamptz, $6)`,
    [input.id, input.userId, input.planId, input.startsAt, input.endsAt, input.autoRenew]
  );
}
