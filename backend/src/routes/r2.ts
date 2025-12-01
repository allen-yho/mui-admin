import { Hono } from 'hono'
import type { Env, EnvBindings } from '@/types'
import { authMiddleware } from '@/middlewares/auth'
import { permission } from '@/middlewares/rbac'

const router = new Hono<Env>()

router.use('*', authMiddleware)

// 获取文件列表
router.get('/', permission('r2:view'), async (c) => {
  const env = c.env as EnvBindings
  const r2 = env.R2_STORAGE
  const prefix = c.req.query('prefix') || ''
  const limit = parseInt(c.req.query('limit') || '100')
  const cursor = c.req.query('cursor') || ''

  const options: {
    prefix?: string
    limit?: number
    cursor?: string
  } = {
    prefix,
    limit,
  }
  if (cursor) {
    options.cursor = cursor
  }

  const list = await r2.list(options)
  
  // 分离文件和文件夹
  const filesMap = new Map<string, {
    key: string
    size: number
    uploaded?: string
    etag?: string
    httpMetadata?: any
    isFolder?: boolean
    itemCount?: number
  }>()
  
  // 处理 R2 返回的对象
  for (const obj of list.objects || []) {
    const key = obj.key
    
    // 跳过当前目录本身
    if (key === prefix) continue
    
    // 检查是否是文件夹标记（以 / 结尾）
    if (key.endsWith('/')) {
      // 这是一个文件夹标记对象
      if (!filesMap.has(key)) {
        filesMap.set(key, {
          key,
          size: 0,
          uploaded: obj.uploaded?.toISOString(),
          etag: obj.etag,
          isFolder: true,
          itemCount: 0
        })
      } else {
        // 更新已存在的文件夹对象（可能是之前通过子文件推断出的）
        const existing = filesMap.get(key)!
        existing.uploaded = obj.uploaded?.toISOString()
        existing.etag = obj.etag
        existing.isFolder = true
      }
    } else {
      // 检查是否有子文件夹（在当前前缀下的直接子项）
      const relativePath = prefix ? key.replace(prefix, '') : key
      const parts = relativePath.split('/').filter(Boolean)
      
      if (parts.length > 1) {
        // 有子文件夹
        const folderPath = prefix + parts[0] + '/'
        
        // 获取或创建文件夹条目
        if (!filesMap.has(folderPath)) {
          filesMap.set(folderPath, {
            key: folderPath,
            size: 0,
            isFolder: true,
            itemCount: 0
          })
        }
        
        // 增加项目计数
        const folder = filesMap.get(folderPath)!
        folder.itemCount = (folder.itemCount || 0) + 1
      } else {
        // 直接在当前目录下的文件
        filesMap.set(key, {
          key,
          size: obj.size,
          uploaded: obj.uploaded?.toISOString(),
          etag: obj.etag,
          httpMetadata: obj.httpMetadata,
          isFolder: false,
        })
      }
    }
  }

  // 转换为数组并排序（文件夹在前）
  const uniqueFiles = Array.from(filesMap.values()).sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1
    if (!a.isFolder && b.isFolder) return 1
    return a.key.localeCompare(b.key)
  })

  return c.json({
    objects: uniqueFiles,
    truncated: list.truncated,
    cursor: list.truncated ? (list as any).cursor : undefined,
  })
})

// 上传文件（支持普通上传和分片上传）
router.post('/upload', permission('r2:add'), async (c) => {
  const env = c.env as EnvBindings
  const r2 = env.R2_STORAGE

  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  const key = formData.get('key') as string | null
  const uploadId = formData.get('uploadId') as string | null
  const partNumber = formData.get('partNumber') as string | null

  if (!file) {
    return c.json({ message: 'File is required' }, 400)
  }

  // 分片上传需要 key
  if (uploadId && partNumber && !key) {
    return c.json({ message: 'Key is required for multipart upload' }, 400)
  }

  // 分片上传
  if (uploadId && partNumber && key) {
    const partNum = parseInt(partNumber)
    try {
      // R2 multipart upload 需要使用 R2MultipartUpload 对象
      const multipartUpload = r2.resumeMultipartUpload(key, uploadId)
      const arrayBuffer = await file.arrayBuffer()
      const uploadedPart = await multipartUpload.uploadPart(partNum, arrayBuffer)
      
      return c.json({
        uploadId,
        partNumber: partNum,
        etag: uploadedPart.etag,
      })
    } catch (error: any) {
      return c.json({ message: error.message || 'Failed to upload part' }, 500)
    }
  }

  // 普通上传 - 如果没有提供 key，自动生成
  const fileName = file.name
  const timestamp = Date.now()
  const fileKey = key || `${timestamp}-${fileName}`

  const arrayBuffer = await file.arrayBuffer()
  await r2.put(fileKey, arrayBuffer, {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream',
    },
    customMetadata: {
      originalName: file.name,
      uploadedBy: c.get('user')?.id || '',
      uploadedAt: new Date().toISOString(),
    },
  })

  return c.json({
    key: fileKey,
    size: file.size,
    contentType: file.type,
  })
})

// 初始化分片上传
router.post('/upload/init', permission('r2:add'), async (c) => {
  const env = c.env as EnvBindings
  const r2 = env.R2_STORAGE
  const body = await c.req.json() as { key: string; contentType?: string }

  if (!body.key) {
    return c.json({ message: 'Key is required' }, 400)
  }

  const upload = await r2.createMultipartUpload(body.key, {
    httpMetadata: {
      contentType: body.contentType || 'application/octet-stream',
    },
  })

  return c.json({
    uploadId: upload.uploadId,
    key: body.key,
  })
})

// 完成分片上传
router.post('/upload/complete', permission('r2:add'), async (c) => {
  const env = c.env as EnvBindings
  const r2 = env.R2_STORAGE
  const body = await c.req.json() as { 
    key: string
    uploadId: string
    parts: Array<{ partNumber: number; etag: string }>
  }

  if (!body.key || !body.uploadId || !body.parts) {
    return c.json({ message: 'Key, uploadId and parts are required' }, 400)
  }

  const multipartUpload = r2.resumeMultipartUpload(body.key, body.uploadId)
  await multipartUpload.complete(body.parts)

  const obj = await r2.head(body.key)
  return c.json({
    key: body.key,
    size: obj?.size || 0,
    etag: obj?.etag,
  })
})

// 获取文件预览 URL
router.get('/preview/:key(*)', permission('r2:view'), async (c) => {
  const key = c.req.param('key')
  if (!key) {
    return c.json({ message: 'Key is required' }, 400)
  }
  const decodedKey = decodeURIComponent(key)
  // R2 不直接支持签名 URL，使用代理 URL
  const url = new URL(c.req.url)
  const baseUrl = `${url.protocol}//${url.host}`
  return c.json({
    url: `${baseUrl}/r2/proxy/${encodeURIComponent(decodedKey)}`,
  })
})

// 代理文件访问（用于预览）
router.get('/proxy/:key(*)', permission('r2:view'), async (c) => {
  const env = c.env as EnvBindings
  const r2 = env.R2_STORAGE
  
  // 尝试从路由参数获取 key
  let keyParam = c.req.param('key')
  
  // 如果路由参数为空，尝试从 URL 路径中提取
  if (!keyParam || keyParam.trim() === '') {
    const url = new URL(c.req.url)
    const pathParts = url.pathname.split('/')
    const proxyIndex = pathParts.indexOf('proxy')
    if (proxyIndex >= 0 && proxyIndex < pathParts.length - 1) {
      // 提取 proxy 后面的所有部分作为 key
      keyParam = pathParts.slice(proxyIndex + 1).join('/')
    }
  }
  
  // 调试日志
  console.log('Proxy route - keyParam from param:', c.req.param('key'))
  console.log('Proxy route - keyParam extracted:', keyParam)
  console.log('Proxy route - full URL:', c.req.url)
  console.log('Proxy route - path:', c.req.path)
  
  if (!keyParam || keyParam.trim() === '') {
    return c.json({ message: 'Key is required' }, 400)
  }
  
  let key: string
  try {
    key = decodeURIComponent(keyParam)
  } catch (error) {
    // 如果解码失败，直接使用原始值
    key = keyParam
  }
  
  console.log('Proxy route - decoded key:', key)

  const object = await r2.get(key)
  if (!object) {
    return c.json({ message: 'File not found' }, 404)
  }

  const headers = new Headers()
  if (object.httpMetadata?.contentType) {
    headers.set('Content-Type', object.httpMetadata.contentType)
  } else {
    // 如果没有 Content-Type，根据文件扩展名推断
    const ext = key.split('.').pop()?.toLowerCase() || ''
    if (ext === 'webp') headers.set('Content-Type', 'image/webp')
    else if (['jpg', 'jpeg'].includes(ext)) headers.set('Content-Type', 'image/jpeg')
    else if (ext === 'png') headers.set('Content-Type', 'image/png')
    else if (ext === 'gif') headers.set('Content-Type', 'image/gif')
    else if (ext === 'svg') headers.set('Content-Type', 'image/svg+xml')
  }
  
  // 设置下载时的文件名
  const fileName = key.split('/').pop() || key
  headers.set('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`)
  
  headers.set('Content-Length', object.size.toString())
  if (object.etag) {
    headers.set('ETag', object.etag)
  }
  
  // 添加 CORS 头，允许跨域访问
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')

  // 将 R2ObjectBody 转换为 Response
  const body = object.body ? await object.arrayBuffer() : null
  return new Response(body, { headers })
})

// 创建文件夹
router.post('/folder', permission('r2:add'), async (c) => {
  const env = c.env as EnvBindings
  const r2 = env.R2_STORAGE
  const body = await c.req.json() as { path: string }

  if (!body.path) {
    return c.json({ message: 'Path is required' }, 400)
  }

  // 确保路径以 / 结尾
  const folderPath = body.path.endsWith('/') ? body.path : `${body.path}/`
  
  // 在 R2 中，文件夹是通过创建一个空对象并设置 Content-Type 为 directory 来实现的
  // 或者简单地创建一个以 / 结尾的 key
  await r2.put(folderPath, new Uint8Array(0), {
    httpMetadata: {
      contentType: 'application/x-directory',
    },
    customMetadata: {
      isFolder: 'true',
      createdBy: c.get('user')?.id || '',
      createdAt: new Date().toISOString(),
    },
  })

  return c.json({ key: folderPath, isFolder: true })
})

// 移动/重命名文件或文件夹
router.put('/move', permission('r2:edit'), async (c) => {
  const env = c.env as EnvBindings
  const r2 = env.R2_STORAGE
  const body = await c.req.json() as { from: string; to: string }

  if (!body.from || !body.to) {
    return c.json({ message: 'From and to are required' }, 400)
  }

  const fromKey = decodeURIComponent(body.from)
  const toKey = decodeURIComponent(body.to)

  // 获取源对象
  const source = await r2.get(fromKey)
  if (!source) {
    return c.json({ message: 'Source not found' }, 404)
  }

  // 复制到新位置
  const bodyData = await source.arrayBuffer()
  await r2.put(toKey, bodyData, {
    httpMetadata: source.httpMetadata,
    customMetadata: source.customMetadata,
  })

  // 删除源对象
  await r2.delete(fromKey)

  // 如果是文件夹，需要移动所有子项
  if (fromKey.endsWith('/')) {
    const list = await r2.list({ prefix: fromKey })
    for (const obj of list.objects || []) {
      const newKey = obj.key.replace(fromKey, toKey)
      const childObj = await r2.get(obj.key)
      if (childObj) {
        const childData = await childObj.arrayBuffer()
        await r2.put(newKey, childData, {
          httpMetadata: childObj.httpMetadata,
          customMetadata: childObj.customMetadata,
        })
        await r2.delete(obj.key)
      }
    }
  }

  return c.json({ message: 'moved', key: toKey })
})

// 删除文件或文件夹
router.delete('/:key(*)', permission('r2:delete'), async (c) => {
  const env = c.env as EnvBindings
  const r2 = env.R2_STORAGE
  
  // 尝试从路由参数获取 key
  let keyParam = c.req.param('key')
  
  // 如果路由参数为空，尝试从 URL 路径中提取
  if (!keyParam || keyParam.trim() === '') {
    const url = new URL(c.req.url)
    // 假设路径是 /r2/key...
    const pathParts = url.pathname.split('/')
    // 找到 r2 的位置，取其后的部分
    // 注意：这里的 r2 取决于挂载路径，假设是挂载在 /r2
    const r2Index = pathParts.findIndex(p => p === 'r2')
    if (r2Index >= 0 && r2Index < pathParts.length - 1) {
      keyParam = pathParts.slice(r2Index + 1).join('/')
    }
  }

  if (!keyParam) {
    return c.json({ message: 'Key is required' }, 400)
  }
  
  let key: string
  try {
    key = decodeURIComponent(keyParam)
  } catch (error) {
    key = keyParam
  }

  // 如果是文件夹，删除所有子项
  if (key.endsWith('/')) {
    const list = await r2.list({ prefix: key })
    for (const obj of list.objects || []) {
      await r2.delete(obj.key)
    }
  }

  await r2.delete(key)
  return c.json({ message: 'deleted' })
})

// 获取文件信息
router.get('/info/:key(*)', permission('r2:view'), async (c) => {
  const env = c.env as EnvBindings
  const r2 = env.R2_STORAGE
  const keyParam = c.req.param('key')
  if (!keyParam) {
    return c.json({ message: 'Key is required' }, 400)
  }
  const key = decodeURIComponent(keyParam)

  const object = await r2.head(key)
  if (!object) {
    return c.json({ message: 'File not found' }, 404)
  }

  return c.json({
    key,
    size: object.size,
    etag: object.etag,
    uploaded: object.uploaded?.toISOString(),
    httpMetadata: object.httpMetadata,
    customMetadata: object.customMetadata,
  })
})

export default router

