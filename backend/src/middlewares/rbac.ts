import type { MiddlewareHandler } from 'hono'
import type { Env } from '@/types'

export const permission =
  (permRequired: string): MiddlewareHandler<Env> =>
  async (c, next) => {
    const user = c.get('user') as { permissions?: string[] } | undefined
    const perms = user?.permissions ?? []
    if (!perms.includes(permRequired)) {
      return c.json({ message: 'Forbidden' }, 403)
    }
    return next()
  }
