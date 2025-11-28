# Front-End Project Guideline (for Cursor)

本仓库采用统一的前端工程规范，所有代码（包括 AI
自动生成代码）必须遵循以下规则，以保证结构清晰、可维护、自动化友好。

## 📦 技术栈
# 后端 
- Cloudflare Worker + Hono + D1 + JWT admin backend
- hono 4.x

# 前端
-   React 19 + TypeScript
-   Vite 6.x
-   React Router v7（createBrowserRouter）
-   Zustand / Redux Toolkit（按模块需求）
-   Axios + 自定义 Request 封装
-   国际化（react-intl / next-intl）

## 📁 目录结构
    backend/
        db/
        middlewares/
        routes/
        types/
        utils/
        index.ts
    src/
      api/
      assets/
          images/
          icons/
      components/
          ui/
      features/
          user/
              components/
              pages/
              hooks/
              services/
              store/
          match/
          vip/
      hooks/
      layouts/
      pages/
      router/
      store/
      styles/
      types/
      utils/

## 🧱 命名规范

-   文件：kebab-case
-   组件：PascalCase
-   Hook：useSomething.ts
-   Store：use-xxx-store.ts
-   API：xxx.service.ts
-   类型：xxx.d.ts

## ⚛️ React 规范

-   函数组件 + Hooks
-   禁止 class
-   必须定义 Props 类型
-   组件超过 250 行需拆分

## 🪝 Hooks 规范

-   以 use 开头
-   必须有类型
-   不允许全局副作用

## 🌐 Request / API 规范

-   Axios 封装
-   泛型
-   防重复
-   request.all
-   自动重试
-   节流/防抖
-   全局错误处理
-   取消请求
-   缓存（可选）

### API 示例

``` ts
export const getUserInfo = (id: string) =>
  request.get<UserInfo>('/user/info', { params: { id } })
```

## 🌍 国际化规范

-   文案必须使用 t('key')
-   禁止硬编码中文/英文

## 🗃️ Store 规范

``` ts
export const useUserStore = create<UserState>((set) => ({
  ...
}))
```

## 🎨 样式规范

-   禁止大面积 inline-style

## 🔧 utils 规范

-   必须类型、注释、单一功能

## 🚦 路由规范

-   createBrowserRouter
-   页面必须属于 sections 模块

## 📝 Commit 规范

-   feat / fix / refactor / perf / docs / style / chore
