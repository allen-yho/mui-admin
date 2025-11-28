import type { MiddlewareHandler } from 'hono'
import type { Env } from '@/types'

export const permission =
  (permRequired: string): MiddlewareHandler<Env> =>
  async (c, next) => {
    const user = c.get('user') as { permissions?: string[] } | undefined
    const perms = user?.permissions ?? []
    // 检查是否有 * 通配符权限（超级管理员）或具体权限
    if (!perms.includes('*') && !perms.includes(permRequired)) {
      return c.json({ message: 'Forbidden' }, 403)
    }
    return next()
  }
