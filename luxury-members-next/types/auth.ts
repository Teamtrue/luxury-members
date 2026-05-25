export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'USER';

export type Permission =
  | 'users.read'
  | 'users.write'
  | 'roles.write'
  | 'deals.write'
  | 'payments.read'
  | 'settings.write';

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  permissions: Permission[];
};
