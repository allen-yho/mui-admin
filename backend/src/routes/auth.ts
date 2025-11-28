import { Hono } from 'hono'
import type { Env, JwtUser, EnvBindings } from '@/types';
import { signJwt } from '@/utils/jwt'
import { authMiddleware } from '@/middlewares/auth';

const router = new Hono<Env>()

// POST /auth/login
router.post('/login', async (c) => {
  const body = await c.req.json<{ username?: string; password?: string }>()
  const username = body.username ?? ''
  const password = body.password ?? ''

  const env = c.env as EnvBindings
  const db = env.DB

  // 查找用户
  const row = await db
    .prepare('SELECT * FROM users WHERE username = ? AND password = ?')
    .bind(username, password)
    .first()

  if (!row) {
    return c.json({ message: 'Invalid credentials' }, 400)
  }

  // 查角色
  const role = await db
    .prepare('SELECT * FROM roles WHERE id = ?')
    .bind(row.role_id)
    .first() as { value?: string } | null

  let uniquePermissions: string[] = []

  // 超级管理员拥有所有权限
  if (role?.value === 'super_admin') {
    uniquePermissions = ['*', 'user:view', 'user:add', 'user:edit', 'user:delete']
  } else {
    // 查权限
    const roleMenus = await db
      .prepare(
        `SELECT m.permission 
         FROM role_menu rm 
         JOIN menus m ON rm.menu_id = m.id 
         WHERE rm.role_id = ?`
      )
      .bind(row.role_id)
      .all()

    const perms = (roleMenus.results || [])
      .map((r: any) => r.permission)
      .filter(Boolean)
      .flatMap((p: string) => p.split(','))
      .filter(Boolean)

    uniquePermissions = Array.from(new Set(perms))
  }

  // ✨ 使用 jose 生成 token
  const token = await signJwt(
    {
      id: row.id,
      username: row.username,
      permissions: uniquePermissions,
    },
    env // 传入 Worker 环境变量
  )

  return c.json({ token })
})

// GET /auth/profile
router.get('/profile', authMiddleware, async (c) => {
  const user = c.get('user') as JwtUser
  const env = c.env as EnvBindings
  const db = env.DB
  
  // 获取完整的用户信息（包括昵称和头像）
  const userRow = await db
    .prepare('SELECT id, username, nickname, avatar FROM users WHERE id = ?')
    .bind(user.id)
    .first() as { id: number; username: string; nickname: string; avatar: string } | null

  if (!userRow) {
    return c.json({ message: 'User not found' }, 404)
  }

  return c.json({
    user: {
      id: userRow.id,
      username: userRow.username,
      nickname: userRow.nickname,
      avatar: userRow.avatar,
      permissions: user.permissions,
    },
  })
})

// PUT /auth/profile - 更新个人资料
router.put('/profile', authMiddleware, async (c) => {
  const user = c.get('user') as JwtUser
  const body = await c.req.json() as { nickname?: string; avatar?: string; password?: string }
  const env = c.env as EnvBindings
  const db = env.DB

  const updates: string[] = []
  const values: any[] = []

  if (body.nickname !== undefined) {
    updates.push('nickname = ?')
    values.push(body.nickname)
  }

  if (body.avatar !== undefined) {
    updates.push('avatar = ?')
    values.push(body.avatar)
  }

  if (body.password !== undefined && body.password) {
    updates.push('password = ?')
    values.push(body.password)
  }

  if (updates.length === 0) {
    return c.json({ message: 'No fields to update' }, 400)
  }

  values.push(user.id)

  await db
    .prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()

  return c.json({ message: 'Profile updated' })
})

export default router