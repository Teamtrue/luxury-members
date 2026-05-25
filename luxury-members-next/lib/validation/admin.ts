import { z } from 'zod';

export const grantPermissionSchema = z.object({
  targetUserId: z.string().min(8),
  permission: z.enum([
    'users.read',
    'users.write',
    'roles.write',
    'deals.write',
    'payments.read',
    'settings.write'
  ])
});
