-- 添加 R2 网盘菜单
INSERT OR IGNORE INTO menus (id, parent_id, name, path, redirect, state, menu_sort, icon, title, i18n, permission) VALUES
  ('24', '0', 'r2-storage', '/r2', '', 1, 3, 'solar:cloud-storage-bold-duotone', 'R2 Storage', 'nav.r2Storage', 'r2:view,r2:add,r2:delete');

-- 为超级管理员角色分配 R2 网盘菜单权限
INSERT OR IGNORE INTO role_menu (role_id, menu_id) VALUES
  ('1', '24');

