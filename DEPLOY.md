# 前端部署指南

本指南将帮助您将前端应用部署到各种静态托管服务。

## 准备工作

### 1. 环境变量配置 ⚠️ 重要

**⚠️ 必须在构建前设置环境变量！** Vite 会在构建时将环境变量内联到代码中，部署后设置环境变量不会生效。

#### 方式 1: 创建 `.env.production` 文件（推荐）

在项目根目录创建 `.env.production` 文件：

```bash
# .env.production
VITE_API_URL=https://admin-api.allen-yho.workers.dev
```

#### 方式 2: 在构建命令中设置环境变量

```bash
VITE_API_URL=https://admin-api.allen-yho.workers.dev npm run build
```

#### 方式 3: 在部署平台配置构建环境变量

在部署平台的构建设置中添加环境变量（见下方各平台的详细说明）。

**重要**: 使用您的实际 Cloudflare Workers 后端地址。当前后端地址为 `https://admin-api.allen-yho.workers.dev`

### 2. 构建项目

```bash
# 安装依赖（如果还没有）
npm install

# 确保环境变量已设置，然后构建生产版本
npm run build
```

**验证构建**: 构建完成后，检查 `dist` 目录中的文件，搜索 `localhost:8787`，如果找不到说明环境变量已正确设置。

构建完成后，`dist` 目录包含所有静态文件。

## 部署方式

### 方式 1: Cloudflare Pages（推荐）

由于后端部署在 Cloudflare Workers，前端部署到 Cloudflare Pages 可以统一管理。

#### 使用 Wrangler CLI

1. **安装 Wrangler**（如果还没有）:
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**:
   ```bash
   wrangler login
   ```

3. **部署到 Cloudflare Pages**:
   ```bash
   # 构建项目
   npm run build

   # 部署
   wrangler pages deploy dist --project-name=your-project-name
   ```

#### 使用 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** 部分
3. 点击 **Create a project**
4. 连接您的 Git 仓库（GitHub/GitLab）
5. 配置构建设置：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (项目根目录)
6. 添加环境变量：
   - **Variable name**: `VITE_API_URL`
   - **Value**: `https://admin-api.allen-yho.workers.dev`
7. 点击 **Save and Deploy**

#### 自动部署

每次推送到 Git 仓库的主分支，Cloudflare Pages 会自动构建和部署。

### 方式 2: Vercel

项目已包含 `vercel.json` 配置文件，可以直接部署到 Vercel。

#### 使用 Vercel CLI

1. **安装 Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**:
   ```bash
   vercel login
   ```

3. **部署**:
   ```bash
   # 构建项目
   npm run build

   # 部署
   vercel --prod
   ```

#### 使用 Vercel Dashboard

1. 登录 [Vercel Dashboard](https://vercel.com/)
2. 点击 **Add New Project**
3. 导入您的 Git 仓库
4. 配置项目设置：
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 添加环境变量：
   - **Variable name**: `VITE_API_URL`
   - **Value**: `https://admin-api.allen-yho.workers.dev`
6. 点击 **Deploy**

### 方式 3: Netlify

#### 使用 Netlify CLI

1. **安装 Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **登录 Netlify**:
   ```bash
   netlify login
   ```

3. **部署**:
   ```bash
   # 构建项目
   npm run build

   # 部署
   netlify deploy --dir=dist --prod
   ```

#### 使用 Netlify Dashboard

1. 登录 [Netlify Dashboard](https://app.netlify.com/)
2. 点击 **Add new site** > **Import an existing project**
3. 连接您的 Git 仓库
4. 配置构建设置：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. 添加环境变量：
   - **Variable name**: `VITE_API_URL`
   - **Value**: `https://admin-api.allen-yho.workers.dev`
6. 点击 **Deploy site**

### 方式 4: 其他静态托管服务

您可以将 `dist` 目录上传到任何静态托管服务，例如：

- **GitHub Pages**
- **AWS S3 + CloudFront**
- **Azure Static Web Apps**
- **Firebase Hosting**
- **自建服务器**（Nginx、Apache 等）

## 使用部署脚本

项目包含一个部署脚本 `deploy.sh`，可以自动执行构建和类型检查：

```bash
# 设置 API URL（可选，如果不设置会使用默认值）
export VITE_API_URL=https://admin-api.allen-yho.workers.dev

# 运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

脚本会：
1. 检查环境变量
2. 运行类型检查
3. 构建生产版本
4. 输出部署说明

## 环境变量配置

### 开发环境

创建 `.env.development` 文件：

```bash
VITE_API_URL=http://localhost:8787
```

### 生产环境

在部署平台配置环境变量：

- **Cloudflare Pages**: Settings > Environment Variables
- **Vercel**: Project Settings > Environment Variables
- **Netlify**: Site Settings > Build & Deploy > Environment Variables

**变量名**: `VITE_API_URL`  
**值**: `https://admin-api.allen-yho.workers.dev`（您的后端 API 地址）

## 验证部署

部署完成后，访问您的前端 URL，检查：

1. ✅ 页面正常加载
2. ✅ API 请求能正常发送到后端
3. ✅ 登录功能正常
4. ✅ 所有功能正常工作

### 检查 API 连接

打开浏览器开发者工具（F12），查看 Network 标签：

- 如果看到 API 请求返回 200/401/403 等状态码，说明 API 连接正常
- 如果看到 CORS 错误，检查后端 CORS 配置
- 如果看到 404，检查 `VITE_API_URL` 配置是否正确

## 故障排查

### 问题 1: 线上环境仍请求本地 API（localhost:8787）

**症状**: 部署后前端仍请求 `http://localhost:8787`，而不是生产 API 地址

**原因**: 构建时没有设置 `VITE_API_URL` 环境变量

**解决方案**:
1. **删除旧的构建文件**:
   ```bash
   rm -rf dist
   ```

2. **设置环境变量并重新构建**:
   ```bash
   # 方式 1: 创建 .env.production 文件
   echo "VITE_API_URL=https://admin-api.allen-yho.workers.dev" > .env.production
   npm run build
   
   # 方式 2: 在命令中设置
   VITE_API_URL=https://admin-api.allen-yho.workers.dev npm run build
   ```

3. **验证构建结果**:
   ```bash
   # 检查构建后的文件是否包含正确的 API 地址
   grep -r "admin-api.allen-yho.workers.dev" dist/ || echo "❌ API URL not found in build"
   grep -r "localhost:8787" dist/ && echo "⚠️  Still contains localhost!" || echo "✅ No localhost found"
   ```

4. **重新部署**:
   ```bash
   # 根据您的部署平台选择
   wrangler pages deploy dist --project-name=your-project-name
   # 或
   vercel --prod
   # 或
   netlify deploy --dir=dist --prod
   ```

### 问题 2: API 请求失败

**症状**: 前端无法连接到后端 API

**解决方案**:
1. 检查 `VITE_API_URL` 环境变量是否正确设置（必须在构建时设置）
2. 确认后端 API 地址可访问
3. 检查浏览器控制台的错误信息
4. 确认后端 CORS 配置允许前端域名

### 问题 2: 构建失败

**症状**: `npm run build` 报错

**解决方案**:
1. 运行 `npm run type-check` 检查 TypeScript 错误
2. 运行 `npm run lint` 检查 ESLint 错误
3. 确保所有依赖已安装：`npm install`
4. 检查 Node.js 版本是否符合要求（>=20）

### 问题 3: 页面空白

**症状**: 部署后页面显示空白

**解决方案**:
1. 检查浏览器控制台的 JavaScript 错误
2. 确认 `dist` 目录包含 `index.html`
3. 检查路由配置（SPA 需要配置重定向规则）
4. 确认静态资源路径正确

### 问题 4: 路由 404

**症状**: 直接访问路由 URL 返回 404

**解决方案**:
- **Vercel**: `vercel.json` 已配置重定向规则
- **Cloudflare Pages**: 需要配置 `_redirects` 文件或 Functions
- **Netlify**: 需要配置 `_redirects` 文件

创建 `public/_redirects` 文件（如果使用 Netlify）:
```
/*    /index.html   200
```

## 持续集成/持续部署 (CI/CD)

### GitHub Actions 示例

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm install
        
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: your-project-name
          directory: dist
```

### GitLab CI/CD 示例

创建 `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - deploy

build:
  stage: build
  image: node:20
  script:
    - npm install
    - npm run build
  artifacts:
    paths:
      - dist
    expire_in: 1 hour

deploy:
  stage: deploy
  image: node:20
  script:
    - npm install -g wrangler
    - wrangler pages deploy dist --project-name=your-project-name
  only:
    - main
```

## 性能优化

### 1. 启用 Gzip/Brotli 压缩

大多数托管服务（Cloudflare Pages、Vercel、Netlify）自动启用压缩。

### 2. 配置 CDN 缓存

- **HTML 文件**: 不缓存或短缓存（5 分钟）
- **静态资源**（JS/CSS/图片）: 长期缓存（1 年）

### 3. 代码分割

Vite 自动进行代码分割，确保路由级别的代码分割正常工作。

## 安全注意事项

1. **不要在前端代码中硬编码敏感信息**（API 密钥、密码等）
2. **使用环境变量**存储配置信息
3. **启用 HTTPS**（大多数托管服务自动启用）
4. **配置 CSP（Content Security Policy）**（如果需要）

## 回滚部署

如果部署出现问题，可以回滚到上一个版本：

- **Cloudflare Pages**: Dashboard > Pages > Deployments > 选择之前的版本 > Promote to production
- **Vercel**: Dashboard > Deployments > 选择之前的版本 > Promote to Production
- **Netlify**: Dashboard > Deploys > 选择之前的版本 > Publish deploy

## 常用命令

```bash
# 本地开发
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run start

# 类型检查
npm run tsc:watch

# 代码检查
npm run lint

# 自动修复代码
npm run fix:all

# 使用部署脚本
./deploy.sh
```

## 相关文档

- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [Vercel 文档](https://vercel.com/docs)
- [Netlify 文档](https://docs.netlify.com/)

---

**提示**: 部署前请确保后端 API 已成功部署并可以访问。

