import { Hono } from 'hono'
import type { Env, EnvBindings } from '@/types'
import { authMiddleware } from '@/middlewares/auth'
import { permission } from '@/middlewares/rbac'

const router = new Hono<Env>()

router.use('*', authMiddleware)

router.get('/', permission('user:view'), async (c) => {
  const env = c.env as EnvBindings
  const db = env.DB
  const rows = await db.prepare('SELECT id, username, nickname, avatar, role_id, status, created_at FROM users').all()
  return c.json(rows.results || [])
})

router.post('/', permission('user:add'), async (c) => {
  const body = await c.req.json() as { username: string; password: string; role_id?: string; nickname?: string; avatar?: string }
  const env = c.env as EnvBindings
  const db = env.DB
  const res = await db
    .prepare('INSERT INTO users (username, password, nickname, avatar, role_id, created_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))')
    .bind(body.username, body.password, body.nickname ?? '', body.avatar ?? '', body.role_id ?? null)
    .run()
  return c.json({ id: res.meta.last_row_id })
})

router.put('/:id', permission('user:edit'), async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json() as { nickname?: string; password?: string; role_id?: string; status?: number; avatar?: string }
  const env = c.env as EnvBindings
  const db = env.DB
  await db
    .prepare('UPDATE users SET nickname = ?, avatar = COALESCE(?, avatar), password = COALESCE(?, password), role_id = COALESCE(?, role_id), status = COALESCE(?, status) WHERE id = ?')
    .bind(body.nickname ?? '', body.avatar ?? null, body.password ?? null, body.role_id ?? null, body.status ?? null, id)
    .run()
  return c.json({ message: 'updated' })
})

router.delete('/:id', permission('user:delete'), async (c) => {
  const id = c.req.param('id')
  const env = c.env as EnvBindings
  const db = env.DB
  await db.prepare('DELETE FROM users WHERE id = ?').bind(id).run()
  return c.json({ message: 'deleted' })
})

export default router
