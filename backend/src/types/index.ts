
import type { D1Database } from '@cloudflare/workers-types'
import type { Context as HonoContext } from 'hono'


export interface JwtUser {
  id: string
  username: string
  roles: string[]
  permissions?: string[]
}

export interface Env {
  Bindings: {
    DB: D1Database
    JWT_SECRET: string
    JWT_EXPIRES: string
  }
  Variables: {
    user?: JwtUser
  }
}


// Explicitly type the Hono Context used across routes
export type Ctx = HonoContext<Env>