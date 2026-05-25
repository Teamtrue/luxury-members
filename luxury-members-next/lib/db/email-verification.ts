import { dbQuery } from '@/lib/db/client';

export async function upsertEmailVerificationToken(userId: string, tokenHash: string, expiresAt: string): Promise<void> {
  await dbQuery(
    `insert into email_verification_tokens (user_id, token_hash, expires_at)
     values ($1, $2, $3::timestamptz)
     on conflict (user_id) do update set token_hash = excluded.token_hash, expires_at = excluded.expires_at, updated_at = now()`,
    [userId, tokenHash, expiresAt]
  );
}

export async function getEmailVerificationToken(userId: string): Promise<{ token_hash: string; expires_at: string } | null> {
  const rows = await dbQuery<{ token_hash: string; expires_at: string }>(
    `select token_hash, expires_at from email_verification_tokens where user_id = $1 limit 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function markEmailVerified(userId: string): Promise<void> {
  await dbQuery(`update users set email_verified = true, updated_at = now() where id = $1`, [userId]);
  await dbQuery(`delete from email_verification_tokens where user_id = $1`, [userId]);
}
