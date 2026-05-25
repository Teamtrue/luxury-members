import { dbQuery } from '@/lib/db/client';

export async function runMembershipRenewalSweep(): Promise<{ renewed: number; expired: number }> {
  const expiredRows = await dbQuery<{ id: string }>(
    `select id from memberships where status = 'ACTIVE' and ends_at < now()`
  );

  for (const row of expiredRows) {
    await dbQuery(`update memberships set status = 'EXPIRED', updated_at = now() where id = $1`, [row.id]);
  }

  const renewableRows = await dbQuery<{ id: string; ends_at: string }>(
    `select id, ends_at from memberships where status = 'ACTIVE' and auto_renew = true and ends_at <= now() + interval '1 day'`
  );

  for (const row of renewableRows) {
    await dbQuery(
      `update memberships
       set ends_at = ends_at + interval '365 day', updated_at = now()
       where id = $1`,
      [row.id]
    );
  }

  return { renewed: renewableRows.length, expired: expiredRows.length };
}
