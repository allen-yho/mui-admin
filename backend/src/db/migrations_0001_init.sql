-- users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  nickname TEXT,
  role_id TEXT,
  status INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- roles
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  value TEXT UNIQUE,
  description TEXT
);

-- menus
CREATE TABLE IF NOT EXISTS menus (
  id TEXT PRIMARY KEY,
  parent_id TEXT DEFAULT '0',
  name TEXT,
  path TEXT,
  redirect TEXT,
  state INTEGER DEFAULT 1,
  menu_sort INTEGER DEFAULT 0,
  icon TEXT,
  title TEXT,
  i18n TEXT,
  is_hide INTEGER DEFAULT 0,
  is_full INTEGER DEFAULT 0,
  is_affix INTEGER DEFAULT 0,
  is_keep_alive INTEGER DEFAULT 1,
  permission TEXT
);

-- role_menu
CREATE TABLE IF NOT EXISTS role_menu (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id TEXT,
  menu_id TEXT
);

-- seed role
INSERT INTO roles (id, name, value, description) VALUES (1, '超级管理员', 'super_admin', 'has all privileges');
INSERT INTO users (id, username, password, nickname, role_id) VALUES (1, 'admin', '123456', '超级管理员', '1');

-- seed menus
INSERT INTO menus (id, parent_id, name, path, redirect, state, menu_sort, icon, title, permission) VALUES
  ('1', '0', 'dashboard', '/', '', 1, 1, 'solar:home-angle-bold-duotone', 'Dashboard', ''),
  ('2', '0', 'system', '/system', '/user', 1, 2, 'solar:settings-bold-duotone', 'System Setting', ''),
  ('21', '2', 'user', '/user', '', 1, 1, 'solar:shield-keyhole-bold-duotone', 'User', 'user:view,user:add,user:edit,user:delete'),
  ('22', '2', 'role', '/role', '', 1, 2, 'solar:shield-keyhole-bold-duotone', 'Role', 'role:view,role:add,role:edit,role:delete'),
  ('23', '2', 'menu', '/menu', '', 1, 3, 'custom:menu-duotone', 'Menu', 'menu:view,menu:add,menu:edit,menu:delete');

-- seed role_menu
INSERT INTO role_menu (role_id, menu_id) VALUES
  ('1', '1'),
  ('1', '2'),
  ('1', '21'),
  ('1', '22'),
  ('1', '23');
