# 修复生产环境 API 地址问题

## 问题描述

部署后前端仍请求 `http://localhost:8787`，而不是生产 API 地址 `https://admin-api.allen-yho.workers.dev`

## 原因

Vite 在构建时会将环境变量内联到代码中。如果构建时没有设置 `VITE_API_URL`，代码会使用默认值 `http://localhost:8787`。部署后设置环境变量不会生效。

## 解决方案

### 步骤 1: 删除旧的构建文件

```bash
rm -rf dist
```

### 步骤 2: 设置环境变量并重新构建

#### 方式 1: 创建 `.env.production` 文件（推荐）

```bash
# 在项目根目录创建 .env.production 文件
cat > .env.production << EOF
VITE_API_URL=https://admin-api.allen-yho.workers.dev
EOF

# 构建
npm run build
```

#### 方式 2: 在命令中设置环境变量

```bash
VITE_API_URL=https://admin-api.allen-yho.workers.dev npm run build
```

### 步骤 3: 验证构建结果

```bash
# 检查是否包含正确的 API 地址
grep -r "admin-api.allen-yho.workers.dev" dist/

# 检查是否还有 localhost（不应该有）
grep -r "localhost:8787" dist/ && echo "❌ 仍然包含 localhost!" || echo "✅ 没有 localhost"
```

### 步骤 4: 重新部署

根据您的部署平台选择：

#### Cloudflare Pages

```bash
wrangler pages deploy dist --project-name=your-project-name
```

#### Vercel

```bash
vercel --prod
```

#### Netlify

```bash
netlify deploy --dir=dist --prod
```

## 如果使用部署平台自动构建

如果您的部署平台（如 Cloudflare Pages、Vercel）会自动从 Git 构建，需要：

1. **在部署平台配置构建环境变量**：
   - Cloudflare Pages: Settings > Environment Variables > Add variable
   - Vercel: Project Settings > Environment Variables > Add
   - Netlify: Site Settings > Build & Deploy > Environment Variables

2. **设置变量**：
   - **Variable name**: `VITE_API_URL`
   - **Value**: `https://admin-api.allen-yho.workers.dev`
   - **Environment**: Production (或 All)

3. **触发重新部署**：
   - 推送新的 commit 到仓库
   - 或在部署平台手动触发重新构建

## 验证修复

部署完成后：

1. 打开浏览器开发者工具（F12）
2. 切换到 Network 标签
3. 刷新页面
4. 查看 API 请求的 URL，应该是 `https://admin-api.allen-yho.workers.dev/...`，而不是 `http://localhost:8787/...`

## 预防措施

为了避免将来出现此问题：

1. ✅ 在项目根目录创建 `.env.production` 文件（不要提交到 Git）
2. ✅ 在部署平台配置构建环境变量
3. ✅ 在 CI/CD 流程中设置环境变量
4. ✅ 构建前验证环境变量是否设置

## 快速修复命令

一键修复脚本：

```bash
#!/bin/bash
# 删除旧构建
rm -rf dist

# 设置环境变量并构建
export VITE_API_URL=https://admin-api.allen-yho.workers.dev
npm run build

# 验证
if grep -r "localhost:8787" dist/ > /dev/null 2>&1; then
  echo "❌ 构建失败：仍然包含 localhost"
  exit 1
else
  echo "✅ 构建成功：API 地址已正确设置"
fi

echo "构建完成，现在可以部署 dist 目录了"
```

