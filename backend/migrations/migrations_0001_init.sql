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
