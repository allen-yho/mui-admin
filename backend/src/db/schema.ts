// db/schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  username: text('username'),
  password: text('password'),
  roleId: integer('role_id'),
})

export const menus = sqliteTable('menus', {
  id: integer('id').primaryKey(),
  permission: text('permission')
})

export const roleMenu = sqliteTable('role_menu', {
  roleId: integer('role_id'),
  menuId: integer('menu_id'),
})