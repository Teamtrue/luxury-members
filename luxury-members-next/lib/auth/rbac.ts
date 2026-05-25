import { Permission, Role } from '@/types/auth';

const rolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: ['users.read', 'users.write', 'roles.write', 'deals.write', 'payments.read', 'settings.write'],
  ADMIN: ['users.read', 'users.write', 'deals.write', 'payments.read', 'settings.write'],
  EDITOR: ['users.read', 'deals.write'],
  USER: []
};

export function permissionsForRole(role: Role): Permission[] {
  return rolePermissions[role];
}

export function can(permission: Permission, assigned: Permission[]): boolean {
  return assigned.includes(permission);
}
