insert into role_permissions (role, permission) values
('SUPER_ADMIN','users.read'),
('SUPER_ADMIN','users.write'),
('SUPER_ADMIN','roles.write'),
('SUPER_ADMIN','deals.write'),
('SUPER_ADMIN','payments.read'),
('SUPER_ADMIN','settings.write'),
('ADMIN','users.read'),
('ADMIN','users.write'),
('ADMIN','deals.write'),
('ADMIN','payments.read'),
('ADMIN','settings.write'),
('EDITOR','users.read'),
('EDITOR','deals.write')
on conflict do nothing;
