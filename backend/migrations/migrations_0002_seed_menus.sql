-- Seed system menus
INSERT OR IGNORE INTO menus (id, parent_id, name, path, redirect, state, menu_sort, icon, title, permission) VALUES
  ('1', '0', 'dashboard', '/', '', 1, 1, 'solar:home-angle-bold-duotone', 'Dashboard', ''),
  ('2', '0', 'system', '/system', '/user', 1, 2, 'solar:settings-bold-duotone', 'System Setting', ''),
  ('21', '2', 'user', '/user', '', 1, 1, 'solar:shield-keyhole-bold-duotone', 'User', 'user:view,user:add,user:edit,user:delete'),
  ('22', '2', 'role', '/role', '', 1, 2, 'solar:shield-keyhole-bold-duotone', 'Role', 'role:view,role:add,role:edit,role:delete'),
  ('23', '2', 'menu', '/menu', '', 1, 3, 'custom:menu-duotone', 'Menu', 'menu:view,menu:add,menu:edit,menu:delete');

-- Associate menus with super_admin role
INSERT OR IGNORE INTO role_menu (role_id, menu_id) VALUES
  ('1', '1'),
  ('1', '2'),
  ('1', '21'),
  ('1', '22'),
  ('1', '23');

