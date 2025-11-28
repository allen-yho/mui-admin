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

// Type alias for easier access to Bindings
export type EnvBindings = Env['Bindings']

// Explicitly type the Hono Context used across routes
export type Ctx = HonoContext<Env>

export interface MenuMeta {
  icon?: string
  title?: string
  i18n?: string
  isHide?: boolean
  isFull?: boolean
  isAffix?: boolean
  isKeepAlive?: boolean
  permissions?: string[]
}

export interface Menu {
  id: string
  parentId: string
  name?: string
  path?: string
  redirect?: string
  state: boolean
  menuSort: number
  meta?: MenuMeta
  children?: Menu[]
}
