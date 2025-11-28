import { Hono } from 'hono'
import type { Env, Menu, JwtUser, EnvBindings } from '@/types'
import { authMiddleware } from '@/middlewares/auth'

const router = new Hono<Env>()

// 获取当前用户有权限的菜单（根据角色过滤）
router.get('/authorized', authMiddleware, async (c) => {
  const env = c.env as EnvBindings
  const db = env.DB
  const user = c.get('user') as JwtUser

  // 超级管理员拥有所有菜单权限
  const isSuperAdmin = user.permissions?.includes('*')

  let authorizedMenuIds: string[] = []

  if (!isSuperAdmin) {
    // 先获取用户角色
    const userRow = await db.prepare('SELECT role_id FROM users WHERE id = ?').bind(user.id).first() as { role_id: string } | null
    if (!userRow) {
      return c.json([])
    }

    // 查询角色的菜单权限
    const roleMenus = await db.prepare('SELECT menu_id FROM role_menu WHERE role_id = ?').bind(userRow.role_id).all()
    authorizedMenuIds = (roleMenus.results || []).map((r: any) => String(r.menu_id))

    if (authorizedMenuIds.length === 0) {
      return c.json([])
    }
  }

  // 获取所有菜单
  const rows = await db.prepare('SELECT * FROM menus ORDER BY menu_sort ASC').all()
  const results = (rows.results || []) as Record<string, any>[]
  const map = new Map<string, Menu & { children: Menu[] }>()

  for (const m of results) {
    const menuId = String(m.id)

    // 如果不是超级管理员，检查是否有权限
    if (!isSuperAdmin && !authorizedMenuIds.includes(menuId)) {
      continue
    }

    const menu: Menu & { children: Menu[] } = {
      id: menuId,
      parentId: String(m.parent_id ?? '0'),
      name: m.name,
      path: m.path,
      redirect: m.redirect,
      state: Boolean(m.state),
      menuSort: m.menu_sort ?? 0,
      meta: {
        icon: m.icon,
        title: m.title,
        i18n: m.i18n,
        isHide: Boolean(m.is_hide),
        isFull: Boolean(m.is_full),
        isAffix: Boolean(m.is_affix),
        isKeepAlive: Boolean(m.is_keep_alive),
        permissions: m.permission ? String(m.permission).split(',').filter(Boolean) : []
      },
      children: []
    }
    map.set(menu.id, menu)
  }

  const tree: (Menu & { children: Menu[] })[] = []
  for (const menu of map.values()) {
    if (!menu.parentId || menu.parentId === '0') {
      tree.push(menu)
    } else {
      const parent = map.get(menu.parentId)
      if (parent) parent.children.push(menu)
      else tree.push(menu)
    }
  }

  return c.json(tree)
})

// 获取所有菜单（用于管理）
router.get('/', async (c) => {
  const env = c.env as EnvBindings
  const db = env.DB
  const rows = await db.prepare('SELECT * FROM menus ORDER BY menu_sort ASC').all()
  const results = (rows.results || []) as Record<string, any>[]
  const map = new Map<string, Menu & { children: Menu[] }>()
  for (const m of results) {
    const menu: Menu & { children: Menu[] } = {
      id: String(m.id),
      parentId: String(m.parent_id ?? '0'),
      name: m.name,
      path: m.path,
      redirect: m.redirect,
      state: Boolean(m.state),
      menuSort: m.menu_sort ?? 0,
      meta: {
        icon: m.icon,
        title: m.title,
        i18n: m.i18n,
        isHide: Boolean(m.is_hide),
        isFull: Boolean(m.is_full),
        isAffix: Boolean(m.is_affix),
        isKeepAlive: Boolean(m.is_keep_alive),
        permissions: m.permission ? String(m.permission).split(',').filter(Boolean) : []
      },
      children: []
    }
    map.set(menu.id, menu)
  }

  const tree: (Menu & { children: Menu[] })[] = []
  for (const menu of map.values()) {
    if (!menu.parentId || menu.parentId === '0') {
      tree.push(menu)
    } else {
      const parent = map.get(menu.parentId)
      if (parent) parent.children.push(menu)
      else tree.push(menu)
    }
  }

  return c.json(tree)
})

router.post('/', async (c) => {
  const body = await c.req.json()
  const env = c.env as EnvBindings
  const db = env.DB
  const id = body.id || String(Date.now())
  await db.prepare(
    `INSERT INTO menus (id, parent_id, name, path, redirect, state, menu_sort, icon, title, i18n, is_hide, is_full, is_affix, is_keep_alive, permission)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  .bind(
    id,
    body.parentId ?? '0',
    body.name ?? '',
    body.path ?? '',
    body.redirect ?? '',
    body.state ? 1 : 0,
    body.menuSort ?? 0,
    body.meta?.icon ?? '',
    body.meta?.title ?? '',
    body.meta?.i18n ?? '',
    body.meta?.isHide ? 1 : 0,
    body.meta?.isFull ? 1 : 0,
    body.meta?.isAffix ? 1 : 0,
    body.meta?.isKeepAlive ? 1 : 0,
    (body.meta?.permissions ?? []).join(',')
  )
  .run()

  return c.json({ id })
})

router.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const env = c.env as EnvBindings
  const db = env.DB
  await db.prepare(
    `UPDATE menus SET parent_id=?, name=?, path=?, redirect=?, state=?, menu_sort=?, icon=?, title=?, i18n=?, is_hide=?, is_full=?, is_affix=?, is_keep_alive=?, permission=? WHERE id=?`
  )
  .bind(
    body.parentId ?? '0',
    body.name ?? '',
    body.path ?? '',
    body.redirect ?? '',
    body.state ? 1 : 0,
    body.menuSort ?? 0,
    body.meta?.icon ?? '',
    body.meta?.title ?? '',
    body.meta?.i18n ?? '',
    body.meta?.isHide ? 1 : 0,
    body.meta?.isFull ? 1 : 0,
    body.meta?.isAffix ? 1 : 0,
    body.meta?.isKeepAlive ? 1 : 0,
    (body.meta?.permissions ?? []).join(','),
    id
  )
  .run()
  return c.json({ message: 'updated' })
})

router.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const env = c.env as EnvBindings
  const db = env.DB
  await db.prepare('DELETE FROM menus WHERE id=?').bind(id).run()
  await db.prepare('DELETE FROM role_menu WHERE menu_id=?').bind(id).run()
  return c.json({ message: 'deleted' })
})

export default router
