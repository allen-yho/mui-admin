# 快速部署指南

## 后端 API 地址

✅ 后端已部署到：**https://admin-api.allen-yho.workers.dev/**

## 前端部署步骤

⚠️ **重要**: 必须在构建前设置 `VITE_API_URL` 环境变量，否则会使用默认的 `http://localhost:8787`

### 方式 1: Cloudflare Pages（推荐）

#### 使用 Wrangler CLI

```bash
# 1. 删除旧构建（如果有）
rm -rf dist

# 2. 设置环境变量并构建项目
export VITE_API_URL=https://admin-api.allen-yho.workers.dev
npm run build

# 3. 验证构建（可选）
grep -r "localhost:8787" dist/ && echo "❌ 错误：仍包含 localhost" || echo "✅ 正确"

# 4. 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=admin-frontend
```

#### 或使用 .env.production 文件

```bash
# 1. 创建 .env.production 文件
echo "VITE_API_URL=https://admin-api.allen-yho.workers.dev" > .env.production

# 2. 构建
npm run build

# 3. 部署
wrangler pages deploy dist --project-name=admin-frontend
```

#### 使用 Cloudflare Dashboard

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/) > Pages
2. 点击 **Create a project** > **Connect to Git**
3. 连接您的 GitHub/GitLab 仓库
4. 配置构建设置：
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. 添加环境变量（⚠️ 必须在构建时设置）：
   - **Variable name**: `VITE_API_URL`
   - **Value**: `https://admin-api.allen-yho.workers.dev`
   - **Environment**: Production（或 All）
6. 点击 **Save and Deploy**

**注意**: 如果已经部署过，需要重新构建。可以：
- 推送一个新的 commit 触发重新构建
- 或在 Deployments 页面点击 "Retry deployment"

### 方式 2: Vercel

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 登录
vercel login

# 3. 部署（会提示配置环境变量）
vercel --prod
```

在部署过程中，设置环境变量：
- `VITE_API_URL` = `https://admin-api.allen-yho.workers.dev`

### 方式 3: 使用部署脚本

```bash
# 设置环境变量
export VITE_API_URL=https://admin-api.allen-yho.workers.dev

# 运行部署脚本
npm run deploy
```

脚本会自动检查环境变量并构建。

脚本会自动：
1. 检查环境变量
2. 运行类型检查
3. 构建生产版本
4. 输出部署说明

## 验证部署

部署完成后：

1. ✅ 访问前端 URL
2. ✅ 打开浏览器开发者工具（F12）> Network
3. ✅ 尝试登录（用户名: `admin`, 密码: `123456`）
4. ✅ 检查 API 请求是否发送到 `https://admin-api.allen-yho.workers.dev`

## 常见问题

### CORS 错误

如果看到 CORS 错误，需要更新后端的 CORS 配置，允许前端域名。

编辑 `backend/src/middlewares/cors.ts`，添加前端域名到允许列表。

### API 请求失败

1. **如果请求的是 `localhost:8787`**：
   - 说明构建时没有设置 `VITE_API_URL`
   - 需要重新构建（见下方"修复生产环境 API 地址"）

2. **如果请求的是正确的 API 地址但失败**：
   - 确认后端 API 是否可访问：https://admin-api.allen-yho.workers.dev/
   - 检查浏览器控制台的错误信息
   - 检查 CORS 配置

### 修复生产环境 API 地址

如果线上环境仍请求 `localhost:8787`，请查看 [FIX_PRODUCTION_API.md](./FIX_PRODUCTION_API.md) 获取详细修复步骤。

快速修复：
```bash
# 删除旧构建
rm -rf dist

# 设置环境变量并重新构建
export VITE_API_URL=https://admin-api.allen-yho.workers.dev
npm run build

# 重新部署
wrangler pages deploy dist --project-name=admin-frontend
```

## 下一步

部署成功后，您的前端将可以通过部署平台提供的 URL 访问。

详细部署说明请查看 [DEPLOY.md](./DEPLOY.md)

