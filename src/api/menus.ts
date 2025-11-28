import { api } from './client';

// 类型定义
export type MenuMeta = {
  icon?: string;
  title?: string;
  i18n?: string;
  isHide?: boolean;
  isFull?: boolean;
  isAffix?: boolean;
  isKeepAlive?: boolean;
  permissions?: string[];
};

export type Menu = {
  id: string;
  parentId: string;
  name: string;
  path: string;
  redirect?: string;
  state: boolean;
  menuSort: number;
  meta: MenuMeta;
  children?: Menu[];
};

export type CreateMenuPayload = {
  id?: string;
  parentId?: string;
  name: string;
  path: string;
  redirect?: string;
  state?: boolean;
  menuSort?: number;
  meta?: MenuMeta;
};

export type UpdateMenuPayload = CreateMenuPayload;

// Menus API
export const menusApi = {
  // 获取所有菜单（管理用）
  getAll: () => api.get<Menu[]>('/menus'),

  // 获取当前用户有权限的菜单（导航用）
  getAuthorized: () => api.get<Menu[]>('/menus/authorized'),

  create: (payload: CreateMenuPayload) => api.post<{ id: string }>('/menus', payload),

  update: (id: string, payload: UpdateMenuPayload) =>
    api.put<{ message: string }>(`/menus/${id}`, payload),

  delete: (id: string) => api.delete<{ message: string }>(`/menus/${id}`),
};

