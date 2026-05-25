import { dbQuery } from '@/lib/db/client';
import { Permission } from '@/types/auth';

export async function grantUserPermission(userId: string, permission: Permission, grantedBy: string): Promise<void> {
  await dbQuery(
    `insert into admin_user_permissions (user_id, permission, granted_by)
     values ($1, $2, $3)
     on conflict (user_id, permission) do nothing`,
    [userId, permission, grantedBy]
  );
}

export async function revokeUserPermission(userId: string, permission: Permission): Promise<void> {
  await dbQuery('delete from admin_user_permissions where user_id = $1 and permission = $2', [userId, permission]);
}
