import { Hono } from 'hono'
import type { Env, EnvBindings } from '@/types'

const router = new Hono<Env>()

interface RolePayload {
  name: string
  value: string
  description?: string
  menuIds?: string[]
}

router.get('/', async (c) => {
  const env = c.env as EnvBindings
  const db = env.DB
  const rows = await db.prepare('SELECT * FROM roles').all()
  return c.json(rows.results || [])
})

router.post('/', async (c) => {
  const body = (await c.req.json()) as RolePayload
  const env = c.env as EnvBindings
  const db = env.DB
  const r = await db.prepare('INSERT INTO roles (name, value, description) VALUES (?, ?, ?)').bind(body.name, body.value, body.description ?? '').run()
  const roleId = r.meta.last_row_id
  if (body.menuIds && body.menuIds.length) {
    for (const mid of body.menuIds) {
      await db.prepare('INSERT INTO role_menu (role_id, menu_id) VALUES (?, ?)').bind(roleId, mid).run()
    }
  }
  return c.json({ id: roleId })
})

router.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = (await c.req.json()) as RolePayload
  const env = c.env as EnvBindings
  const db = env.DB
  await db.prepare('UPDATE roles SET name = ?, value = ?, description = ? WHERE id = ?').bind(body.name, body.value, body.description ?? '', id).run()
  await db.prepare('DELETE FROM role_menu WHERE role_id = ?').bind(id).run()
  if (body.menuIds && body.menuIds.length) {
    for (const mid of body.menuIds) {
      await db.prepare('INSERT INTO role_menu (role_id, menu_id) VALUES (?, ?)').bind(id, mid).run()
    }
  }
  return c.json({ message: 'updated' })
})

router.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const env = c.env as EnvBindings
  const db = env.DB
  await db.prepare('DELETE FROM roles WHERE id = ?').bind(id).run()
  await db.prepare('DELETE FROM role_menu WHERE role_id = ?').bind(id).run()
  return c.json({ message: 'deleted' })
})

// 获取角色的菜单权限
router.get('/:id/menus', async (c) => {
  const id = c.req.param('id')
  const env = c.env as EnvBindings
  const db = env.DB
  const rows = await db.prepare('SELECT menu_id FROM role_menu WHERE role_id = ?').bind(id).all()
  const menuIds = ((rows.results || []) as { menu_id: string }[]).map((r) => r.menu_id)
  return c.json(menuIds)
})

export default router
