# R2 网盘功能部署指南

## 部署前准备

### 1. 创建 R2 Bucket

由于 R2 需要通过 Cloudflare Dashboard 启用，请按以下步骤操作：

1. **登录 Cloudflare Dashboard**
   - 访问：https://dash.cloudflare.com/
   - 登录您的账户

2. **启用 R2**
   - 在左侧菜单中找到 **R2**（如果没有，可能需要先启用）
   - 点击 **Create bucket**
   - Bucket 名称：`admin-storage`
   - 选择区域（建议选择离您最近的区域）
   - 点击 **Create bucket**

3. **验证 Bucket 创建成功**
   - 在 R2 页面应该能看到 `admin-storage` bucket

### 2. 部署后端

创建好 R2 bucket 后，执行后端部署：

```bash
cd backend

# 部署（不运行迁移）
./deploy.sh

# 或者部署并运行数据库迁移（生产环境）
./deploy.sh --migrate --remote
```

**注意**：如果之前没有运行过 R2 相关的数据库迁移，需要运行：
```bash
./deploy.sh --migrate --remote
```

这会执行以下迁移：
- `migrations_0005_add_r2_storage.sql` - 添加 R2 Storage 菜单
- `migrations_0006_update_r2_permissions.sql` - 更新 R2 权限

### 3. 部署前端

#### 3.1 设置环境变量

在项目根目录创建 `.env.production` 文件：

```bash
# .env.production
VITE_API_URL=https://admin-api.allen-yho.workers.dev
```

**重要**：将 `admin-api.allen-yho.workers.dev` 替换为您的实际后端 API 地址。

#### 3.2 构建前端

```bash
# 回到项目根目录
cd ..

# 构建生产版本
npm run build
```

#### 3.3 部署到 Cloudflare Pages

**方式 1：使用 Wrangler CLI**

```bash
# 安装 wrangler（如果还没有）
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署
wrangler pages deploy dist --project-name=your-project-name
```

**方式 2：使用 Cloudflare Dashboard**

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Pages** 部分
3. 点击 **Create a project**
4. 连接您的 Git 仓库或直接上传 `dist` 文件夹
5. 配置构建设置：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (项目根目录)
6. 添加环境变量：
   - **Variable name**: `VITE_API_URL`
   - **Value**: `https://admin-api.allen-yho.workers.dev`（您的后端 API 地址）
7. 点击 **Save and Deploy**

## 验证部署

### 1. 检查后端 API

访问：`https://admin-api.allen-yho.workers.dev/`

应该返回：`OK`

### 2. 检查前端

访问您的前端 URL，应该能看到：
- ✅ 登录页面正常
- ✅ 菜单中有 "R2 Storage" 选项
- ✅ 可以访问网盘功能

### 3. 测试网盘功能

1. 登录系统
2. 点击左侧菜单的 "R2 Storage"
3. 尝试上传文件
4. 尝试创建文件夹
5. 尝试预览和下载文件

## 故障排查

### 问题 1: R2 bucket 不存在

**错误信息**：`R2 bucket 'admin-storage' not found`

**解决方案**：
1. 在 Cloudflare Dashboard 中创建 R2 bucket（见步骤 1）
2. 确保 bucket 名称与 `wrangler.toml` 中的名称一致

### 问题 2: 前端无法连接后端

**症状**：前端请求返回 404 或 CORS 错误

**解决方案**：
1. 检查 `VITE_API_URL` 环境变量是否正确设置
2. 确认后端 API 地址可访问
3. 检查后端 CORS 配置

### 问题 3: 无法上传文件

**症状**：上传文件时返回 403 错误

**解决方案**：
1. 确认已登录系统
2. 检查用户权限（需要 `r2:add` 权限）
3. 确认 R2 bucket 已正确绑定到 Worker

### 问题 4: 菜单中没有 R2 Storage

**症状**：登录后看不到 R2 Storage 菜单

**解决方案**：
1. 运行数据库迁移：
   ```bash
   cd backend
   ./deploy.sh --migrate --remote
   ```
2. 重新登录系统（权限信息在 JWT token 中，需要重新登录才能更新）

## 生产环境注意事项

1. **JWT_SECRET**：确保使用强密码，建议使用 `wrangler secret put JWT_SECRET` 设置
2. **R2 存储限制**：注意 Cloudflare R2 的存储和请求限制
3. **CORS 配置**：确保后端 CORS 配置允许前端域名
4. **HTTPS**：确保使用 HTTPS（Cloudflare 自动提供）

## 常用命令

```bash
# 后端部署
cd backend
./deploy.sh                    # 基本部署
./deploy.sh --migrate          # 部署 + 本地迁移
./deploy.sh --migrate --remote  # 部署 + 生产环境迁移

# 前端构建
npm run build

# 前端部署（使用 wrangler）
wrangler pages deploy dist --project-name=your-project-name

# 查看 R2 bucket
npx wrangler r2 bucket list

# 查看后端日志
npx wrangler tail
```

---

**提示**：如果遇到问题，请检查 Cloudflare Dashboard 中的 Worker 和 R2 配置。

