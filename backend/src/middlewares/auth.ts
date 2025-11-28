import type { MiddlewareHandler } from 'hono'
import { verifyJwt } from '@/utils/jwt'
import type { Env, JwtUser, EnvBindings } from '@/types';

export const authMiddleware: MiddlewareHandler<Env> = async (c, next) => {
  const auth = c.req.header('Authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return c.json({ message: 'Invalid token', code: 401 })

  const payload = await verifyJwt(token, c.env as EnvBindings)
  if (!payload) return c.json({ message: 'Invalid token', code: 401 })

  // attach user payload to context so handlers can use c.get('user')
  c.set('user', payload as JwtUser)
  return next()
}
