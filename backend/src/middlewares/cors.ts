import type { MiddlewareHandler } from 'hono'

const corsMiddleware: MiddlewareHandler = async (c, next) => {
  // 设置 CORS 头
  c.res.headers.set('Access-Control-Allow-Origin', '*')
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  c.res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')

  // 处理预检请求
  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204)
  }

  await next()
}

export default corsMiddleware
