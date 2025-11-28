import { api } from './client';

// 类型定义
export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};

export type UserProfile = {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  permissions: string[];
};

export type ProfileResponse = {
  user: UserProfile;
};

export type UpdateProfilePayload = {
  nickname?: string;
  avatar?: string;
  password?: string;
};

// Auth API
export const authApi = {
  login: (payload: LoginPayload) => api.post<LoginResponse>('/auth/login', payload),

  getProfile: () => api.get<ProfileResponse>('/auth/profile'),

  updateProfile: (payload: UpdateProfilePayload) =>
    api.put<{ message: string }>('/auth/profile', payload),
};

