import { api } from './client';

// ----------------------------------------------------------------------

export type R2File = {
  key: string;
  size: number;
  uploaded?: string;
  etag?: string;
  isFolder?: boolean;
  httpMetadata?: {
    contentType?: string;
    contentDisposition?: string;
  };
};

export type R2FileList = {
  objects: R2File[];
  truncated: boolean;
  cursor?: string;
};

export type UploadPart = {
  partNumber: number;
  etag: string;
};

export type InitMultipartUploadResponse = {
  uploadId: string;
  key: string;
};

export type CompleteMultipartUploadPayload = {
  key: string;
  uploadId: string;
  parts: UploadPart[];
};

export const r2Api = {
  // 获取文件列表
  getList: (params?: { prefix?: string; limit?: number; cursor?: string }) => {
    const query = new URLSearchParams();
    if (params?.prefix) query.append('prefix', params.prefix);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.cursor) query.append('cursor', params.cursor);
    return api.get<R2FileList>(`/r2?${query.toString()}`);
  },

  // 普通上传
  upload: (file: File, key?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (key) formData.append('key', key);

    return api.post<{ key: string; size: number; contentType: string }>('/r2/upload', formData);
  },

  // 初始化分片上传
  initMultipartUpload: (key: string, contentType?: string) =>
    api.post<InitMultipartUploadResponse>('/r2/upload/init', {
      key,
      contentType,
    }),

  // 上传分片
  uploadPart: (file: File, key: string, uploadId: string, partNumber: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);
    formData.append('uploadId', uploadId);
    formData.append('partNumber', partNumber.toString());

    return api.post<{ uploadId: string; partNumber: number; etag: string }>('/r2/upload', formData);
  },

  // 完成分片上传
  completeMultipartUpload: (payload: CompleteMultipartUploadPayload) =>
    api.post<{ key: string; size: number; etag?: string }>('/r2/upload/complete', payload),

  // 获取预览 URL
  getPreviewUrl: (key: string) => api.get<{ url: string }>(`/r2/preview/${encodeURIComponent(key)}`),

  // 获取代理 URL（直接访问）
  getProxyUrl: (key: string) => {
    if (!key) {
      throw new Error('Key is required for proxy URL');
    }
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787';
    // 确保 baseUrl 不以 / 结尾
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    // 对 key 进行编码，确保特殊字符（如 /）被正确处理
    const encodedKey = encodeURIComponent(key);
    return `${cleanBaseUrl}/r2/proxy/${encodedKey}`;
  },

  // 删除文件
  delete: (key: string) => api.delete(`/r2/${encodeURIComponent(key)}`),

  // 获取文件信息
  getInfo: (key: string) => api.get<R2File>(`/r2/info/${encodeURIComponent(key)}`),

  // 创建文件夹
  createFolder: (path: string) => api.post<{ key: string; isFolder: boolean }>('/r2/folder', { path }),

  // 移动/重命名文件或文件夹
  move: (from: string, to: string) => api.put<{ message: string; key: string }>('/r2/move', { from, to }),
};

