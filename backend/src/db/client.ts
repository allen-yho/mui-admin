// db/client.ts
import { drizzle } from 'drizzle-orm/d1'
import type { EnvBindings } from '@/types'

export const getDb = (env: EnvBindings) => drizzle(env.DB)