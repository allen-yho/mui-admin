import { api } from './client';

// 类型定义
export type Role = {
  id: number;
  name: string;
  value: string;
  description: string;
};

export type CreateRolePayload = {
  name: string;
  value: string;
  description?: string;
  menuIds?: string[];
};

export type UpdateRolePayload = {
  name: string;
  value: string;
  description?: string;
  menuIds?: string[];
};

// Roles API
export const rolesApi = {
  getAll: () => api.get<Role[]>('/roles'),

  create: (payload: CreateRolePayload) => api.post<{ id: number }>('/roles', payload),

  update: (id: number | string, payload: UpdateRolePayload) =>
    api.put<{ message: string }>(`/roles/${id}`, payload),

  delete: (id: number | string) => api.delete<{ message: string }>(`/roles/${id}`),

  // 获取角色的菜单权限
  getMenus: (id: number | string) => api.get<string[]>(`/roles/${id}/menus`),
};

