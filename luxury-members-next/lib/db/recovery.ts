import { dbQuery } from '@/lib/db/client';

export async function upsertOtp(email: string, otpHash: string, expiresAt: string): Promise<void> {
  await dbQuery(
    `insert into auth_otp (email, otp_hash, expires_at)
     values ($1, $2, $3::timestamptz)
     on conflict (email) do update set otp_hash = excluded.otp_hash, expires_at = excluded.expires_at, updated_at = now()`,
    [email, otpHash, expiresAt]
  );
}

export async function getOtp(email: string): Promise<{ otp_hash: string; expires_at: string } | null> {
  const rows = await dbQuery<{ otp_hash: string; expires_at: string }>(
    `select otp_hash, expires_at from auth_otp where email = $1 limit 1`,
    [email]
  );
  return rows[0] || null;
}

export async function clearOtp(email: string): Promise<void> {
  await dbQuery(`delete from auth_otp where email = $1`, [email]);
}

export async function updateUserPassword(email: string, passwordHash: string): Promise<void> {
  await dbQuery(`update users set password_hash = $2, updated_at = now() where email = $1`, [email, passwordHash]);
}
