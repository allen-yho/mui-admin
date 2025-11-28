import { api } from './client';

// 类型定义
export type User = {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  role_id: string | null;
  status: number;
  created_at: string;
};

export type CreateUserPayload = {
  username: string;
  password: string;
  nickname?: string;
  avatar?: string;
  role_id?: string;
};

export type UpdateUserPayload = {
  nickname?: string;
  password?: string;
  avatar?: string;
  role_id?: string;
  status?: number;
};

// Users API
export const usersApi = {
  getAll: () => api.get<User[]>('/users'),

  create: (payload: CreateUserPayload) => api.post<{ id: number }>('/users', payload),

  update: (id: number | string, payload: UpdateUserPayload) =>
    api.put<{ message: string }>(`/users/${id}`, payload),

  delete: (id: number | string) => api.delete<{ message: string }>(`/users/${id}`),
};

