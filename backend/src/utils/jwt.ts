import { SignJWT, jwtVerify } from 'jose'
import type { EnvBindings } from '@/types'

// 将 secret 转为 Uint8Array
function getSecret(env: EnvBindings) {
  return new TextEncoder().encode(env.JWT_SECRET)
}

/**
 * 签名 JWT
 * @param payload 需要写入 token 的数据
 * @param env Cloudflare Worker 环境变量
 * @param expires 过期秒数，默认 7 天
 */
export async function signJwt(
  payload: Record<string, any>,
  env: EnvBindings,
): Promise<string> {
  const secret = getSecret(env)
  const expires = env.JWT_EXPIRES || '7d'
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(expires)
    .sign(secret)
}

/**
 * 验证 JWT
 * @param token Bearer Token
 * @param env Cloudflare Worker 环境变量
 */
export async function verifyJwt(
  token: string,
  env: EnvBindings
): Promise<Record<string, any> | null> {
  try {
    const secret = getSecret(env)
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch (_) {
    return null
  }
}