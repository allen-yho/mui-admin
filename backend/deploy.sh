#!/bin/bash

# Cloudflare Workers 部署脚本
# Usage: ./deploy.sh [--migrate] [--remote]

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 解析参数
MIGRATE=false
REMOTE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --migrate)
      MIGRATE=true
      shift
      ;;
    --remote)
      REMOTE=true
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: ./deploy.sh [--migrate] [--remote]"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}🚀 Starting deployment to Cloudflare Workers...${NC}"

# 1. 检查是否在正确的目录
if [ ! -f "wrangler.toml" ]; then
  echo -e "${RED}❌ Error: wrangler.toml not found. Please run this script from the backend directory.${NC}"
  exit 1
fi

# 2. 类型检查
echo -e "${YELLOW}📝 Running TypeScript type check...${NC}"
npm run type-check
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ TypeScript type check failed. Please fix errors before deploying.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Type check passed${NC}"

# 3. 运行数据库迁移（如果指定）
if [ "$MIGRATE" = true ]; then
  echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
  
  if [ "$REMOTE" = true ]; then
    echo -e "${YELLOW}   Running migrations on REMOTE database...${NC}"
    for migration in migrations/migrations_*.sql; do
      if [ -f "$migration" ]; then
        echo -e "${YELLOW}   Applying: $migration${NC}"
        output=$(npx wrangler d1 execute admin-db --remote --file="$migration" 2>&1)
        exit_code=$?
        
        # 检查是否是已知的可以忽略的错误（如 duplicate column）
        if [ $exit_code -ne 0 ]; then
          if echo "$output" | grep -q "duplicate column\|UNIQUE constraint failed"; then
            echo -e "${YELLOW}   ⚠️  Migration already applied or column exists, skipping: $migration${NC}"
          else
            echo -e "${RED}❌ Migration failed: $migration${NC}"
            echo "$output"
            exit 1
          fi
        fi
      fi
    done
  else
    echo -e "${YELLOW}   Running migrations on LOCAL database...${NC}"
    for migration in migrations/migrations_*.sql; do
      if [ -f "$migration" ]; then
        echo -e "${YELLOW}   Applying: $migration${NC}"
        output=$(npx wrangler d1 execute admin-db --local --file="$migration" 2>&1)
        exit_code=$?
        
        # 检查是否是已知的可以忽略的错误（如 duplicate column）
        if [ $exit_code -ne 0 ]; then
          if echo "$output" | grep -q "duplicate column\|UNIQUE constraint failed"; then
            echo -e "${YELLOW}   ⚠️  Migration already applied or column exists, skipping: $migration${NC}"
          else
            echo -e "${RED}❌ Migration failed: $migration${NC}"
            echo "$output"
            exit 1
          fi
        fi
      fi
    done
  fi
  echo -e "${GREEN}✅ Migrations completed${NC}"
fi

# 4. 部署到 Cloudflare Workers
echo -e "${YELLOW}☁️  Deploying to Cloudflare Workers...${NC}"
npx wrangler deploy

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Deployment successful!${NC}"
  echo -e "${GREEN}🎉 Your API is now live on Cloudflare Workers!${NC}"
else
  echo -e "${RED}❌ Deployment failed${NC}"
  exit 1
fi

