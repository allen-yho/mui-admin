# Cloudflare Workers 部署指南

## 快速开始

### 基本部署
```bash
npm run deploy
```
或
```bash
./deploy.sh
```

### 部署并运行数据库迁移（本地）
```bash
npm run deploy:with-migrate
```
或
```bash
./deploy.sh --migrate
```

### 部署并运行数据库迁移（远程生产环境）
```bash
npm run deploy:full
```
或
```bash
./deploy.sh --migrate --remote
```

## 部署步骤说明

### 1. 类型检查
部署前会自动运行 TypeScript 类型检查，确保代码没有类型错误。

### 2. 数据库迁移（可选）
使用 `--migrate` 参数可以在部署前运行数据库迁移：
- `--migrate` - 在本地数据库运行迁移
- `--migrate --remote` - 在远程生产数据库运行迁移

**⚠️ 注意**：生产环境迁移请谨慎操作，建议先在本地测试。

### 3. 部署到 Cloudflare Workers
使用 `wrangler deploy` 命令将代码部署到 Cloudflare Workers。

## 环境变量配置

部署前请确保 `wrangler.toml` 中的环境变量已正确配置：

```toml
[vars]
JWT_SECRET = "your-super-secret-jwt-key-change-in-production"  # 生产环境请使用强密码
JWT_EXPIRES = "7d"
```

### 设置敏感环境变量（生产环境）

对于敏感信息（如 JWT_SECRET），建议使用 `wrangler secret` 命令：

```bash
# 设置 JWT_SECRET（生产环境）
npx wrangler secret put JWT_SECRET
# 然后输入你的密钥

# 查看已设置的 secrets
npx wrangler secret list
```

## 数据库迁移

### 本地迁移
```bash
# 执行单个迁移文件
npx wrangler d1 execute admin-db --local --file=migrations/migrations_0004_user_avatar.sql

# 查看本地数据库
npx wrangler d1 execute admin-db --local --command="SELECT * FROM users"
```

### 远程迁移（生产环境）
```bash
# 执行单个迁移文件
npx wrangler d1 execute admin-db --remote --file=migrations/migrations_0004_user_avatar.sql

# 查看远程数据库
npx wrangler d1 execute admin-db --remote --command="SELECT * FROM users"
```

**⚠️ 重要提示**：
- 生产环境迁移前请**备份数据库**
- 建议先在本地测试迁移脚本
- 确认迁移脚本无误后再执行远程迁移

## 验证部署

部署成功后，可以通过以下方式验证：

### 1. 健康检查
```bash
curl https://your-worker.your-subdomain.workers.dev/
```
应该返回 `OK`

### 2. 测试登录 API
```bash
curl https://your-worker.your-subdomain.workers.dev/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

应该返回包含 `token` 的 JSON 响应。

### 3. 测试认证 API
```bash
# 先获取 token（从上面的登录响应中）
TOKEN="your-jwt-token"

# 测试获取用户列表
curl https://your-worker.your-subdomain.workers.dev/users \
  -H "Authorization: Bearer $TOKEN"
```

## 故障排查

### 部署失败

#### 1. TypeScript 类型错误
```bash
# 手动运行类型检查
npm run type-check
```
修复所有类型错误后再部署。

#### 2. wrangler.toml 配置错误
- 检查 `wrangler.toml` 文件是否存在
- 确认数据库 ID 和名称正确
- 确认环境变量配置正确

#### 3. 未登录 Cloudflare
```bash
# 登录 Cloudflare
npx wrangler login
```

### 数据库连接问题

#### 1. 数据库不存在
```bash
# 创建数据库（如果还没有）
npx wrangler d1 create admin-db
```

#### 2. 数据库 ID 错误
- 检查 `wrangler.toml` 中的 `database_id` 是否正确
- 可以通过 `npx wrangler d1 list` 查看所有数据库

#### 3. 迁移文件错误
- 检查 SQL 语法是否正确
- 确认迁移文件路径正确
- 查看错误日志定位问题

### 环境变量问题

#### 1. JWT_SECRET 未设置
```bash
# 设置 JWT_SECRET
npx wrangler secret put JWT_SECRET
```

#### 2. 环境变量未生效
- 检查 `wrangler.toml` 中的 `[vars]` 配置
- 使用 `wrangler secret` 设置的变量优先级更高
- 重新部署后环境变量才会生效

### API 请求失败

#### 1. CORS 错误
- 检查 CORS 中间件配置
- 确认允许的源地址正确

#### 2. 401 Unauthorized
- 检查 JWT token 是否有效
- 确认 token 未过期
- 验证 JWT_SECRET 配置正确

#### 3. 403 Forbidden
- 检查用户权限配置
- 确认角色菜单权限已正确分配
- 验证权限字符串格式正确（`resource:action`）

## 生产环境注意事项

### 1. 安全性
- ✅ **JWT Secret**: 生产环境必须使用强密码，不要使用默认值
- ✅ **CORS**: 生产环境应限制允许的源，不要使用 `*`
- ✅ **密码存储**: 当前使用明文密码，生产环境建议使用哈希（bcrypt/argon2）
- ✅ **HTTPS**: Cloudflare Workers 默认使用 HTTPS

### 2. 数据库
- ✅ **备份**: 生产环境迁移前请备份数据
- ✅ **测试**: 所有迁移脚本先在本地测试
- ✅ **监控**: 定期检查数据库状态

### 3. 监控和日志
- ✅ **日志**: 建议启用 Cloudflare Workers 日志
- ✅ **监控**: 设置 Cloudflare Workers 监控和告警
- ✅ **错误追踪**: 使用 Cloudflare Analytics 查看错误率

### 4. 性能优化
- ✅ **缓存**: 合理使用 Cloudflare 缓存
- ✅ **连接池**: D1 数据库连接会自动管理
- ✅ **响应时间**: 监控 API 响应时间

## 常用命令

### 开发
```bash
# 启动本地开发服务器
npm run dev

# 类型检查
npm run type-check

# 格式化代码
npm run format
```

### 数据库操作
```bash
# 查看所有数据库
npx wrangler d1 list

# 查看数据库信息
npx wrangler d1 info admin-db

# 执行 SQL 命令（本地）
npx wrangler d1 execute admin-db --local --command="SELECT * FROM users"

# 执行 SQL 命令（远程）
npx wrangler d1 execute admin-db --remote --command="SELECT * FROM users"
```

### 部署相关
```bash
# 查看部署历史
npx wrangler deployments list

# 回滚到上一个版本
npx wrangler rollback

# 查看 Worker 日志
npx wrangler tail
```

### 环境变量
```bash
# 设置 secret
npx wrangler secret put JWT_SECRET

# 查看所有 secrets
npx wrangler secret list

# 删除 secret
npx wrangler secret delete JWT_SECRET
```

## 部署流程示例

### 首次部署
```bash
# 1. 进入后端目录
cd backend

# 2. 安装依赖
npm install

# 3. 类型检查
npm run type-check

# 4. 登录 Cloudflare（如果还没登录）
npx wrangler login

# 5. 创建数据库（如果还没有）
npx wrangler d1 create admin-db

# 6. 更新 wrangler.toml 中的 database_id

# 7. 运行初始迁移（本地）
npx wrangler d1 execute admin-db --local --file=migrations/migrations_0001_init.sql

# 8. 测试本地环境
npm run dev

# 9. 部署到生产环境
npm run deploy

# 10. 运行生产环境迁移
npx wrangler d1 execute admin-db --remote --file=migrations/migrations_0001_init.sql

# 11. 设置生产环境 JWT_SECRET
npx wrangler secret put JWT_SECRET
```

### 日常更新部署
```bash
# 1. 进入后端目录
cd backend

# 2. 拉取最新代码
git pull

# 3. 安装依赖（如果有更新）
npm install

# 4. 类型检查
npm run type-check

# 5. 测试本地环境
npm run dev

# 6. 如果有新的迁移文件，先本地测试
npx wrangler d1 execute admin-db --local --file=migrations/migrations_XXXX_*.sql

# 7. 部署（包含迁移）
npm run deploy:full
```

## 回滚部署

如果部署后出现问题，可以回滚到上一个版本：

```bash
npx wrangler rollback
```

**注意**：回滚不会回滚数据库迁移，需要手动处理数据库变更。

## 获取帮助

- Cloudflare Workers 文档: https://developers.cloudflare.com/workers/
- Wrangler CLI 文档: https://developers.cloudflare.com/workers/wrangler/
- D1 数据库文档: https://developers.cloudflare.com/d1/
