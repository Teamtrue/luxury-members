import { dbQuery } from '@/lib/db/client';
import { Role } from '@/types/auth';

export type DbUser = {
  id: string;
  email: string;
  role: Role;
  password_hash: string;
  is_active: boolean;
};

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const rows = await dbQuery<DbUser>(
    `select id, email, role, password_hash, is_active
     from users
     where email = $1
     limit 1`,
    [email]
  );
  return rows[0] || null;
}

export async function getUserCustomPermissions(userId: string): Promise<string[]> {
  const rows = await dbQuery<{ permission: string }>(
    `select permission from admin_user_permissions where user_id = $1`,
    [userId]
  );
  return rows.map((r) => r.permission);
}
