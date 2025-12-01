import type { UploadPart } from 'src/api/r2';

import { useTranslation } from 'react-i18next';
import { useRef, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { r2Api } from 'src/api/r2';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk

type UploadProgress = {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
};

type FileUploaderProps = {
  onSuccess?: () => void;
};

export function FileUploader({ onSuccess }: FileUploaderProps) {
  const { t } = useTranslation();
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      const upload: UploadProgress = {
        file,
        progress: 0,
        status: 'pending',
      };

      setUploads((prev) => [...prev, upload]);

      try {
        // 如果文件小于分片大小，使用普通上传
        if (file.size < CHUNK_SIZE) {
          setUploads((prev) =>
            prev.map((u) =>
              u.file === file ? { ...u, status: 'uploading', progress: 0 } : u
            )
          );

          await r2Api.upload(file);
          setUploads((prev) =>
            prev.map((u) =>
              u.file === file ? { ...u, status: 'success', progress: 100 } : u
            )
          );
          onSuccess?.();
          return;
        }

        // 分片上传
        const key = `${Date.now()}-${file.name}`;
        const contentType = file.type || 'application/octet-stream';

        // 初始化分片上传
        const { uploadId: multipartUploadId } = await r2Api.initMultipartUpload(key, contentType);

        setUploads((prev) =>
          prev.map((u) =>
            u.file === file ? { ...u, status: 'uploading', progress: 5 } : u
          )
        );

        // 计算分片数量
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const parts: UploadPart[] = [];

        // 上传所有分片
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          const { etag } = await r2Api.uploadPart(chunk, key, multipartUploadId, i + 1);
          parts.push({ partNumber: i + 1, etag });

          const progress = Math.round(((i + 1) / totalChunks) * 90) + 5;
          setUploads((prev) =>
            prev.map((u) =>
              u.file === file ? { ...u, progress } : u
            )
          );
        }

        // 完成分片上传
        await r2Api.completeMultipartUpload({ key, uploadId: multipartUploadId, parts });

        setUploads((prev) =>
          prev.map((u) =>
            u.file === file ? { ...u, status: 'success', progress: 100 } : u
          )
        );

        onSuccess?.();
      } catch (error: any) {
        setUploads((prev) =>
          prev.map((u) =>
            u.file === file
              ? { ...u, status: 'error', error: error.message || 'Upload failed' }
              : u
          )
        );
      }
    },
    [onSuccess]
  );

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      Array.from(selectedFiles).forEach((file) => {
        uploadFile(file);
      });
    },
    [uploadFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileSelect(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileSelect]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Stack spacing={3}>
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragging ? 'action.hover' : 'transparent',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
        <Iconify icon="solar:cloud-storage-bold-duotone" width={64} sx={{ mb: 2, opacity: 0.5 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          {t('r2Storage.dropFiles')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('r2Storage.dropFilesDesc')}
        </Typography>
        <Button variant="contained" startIcon={<Iconify icon="solar:pen-bold" width={20} />}>
          {t('r2Storage.selectFiles')}
        </Button>
      </Box>

      {uploads.length > 0 && (
        <Stack spacing={2}>
          {uploads.map((upload, index) => (
            <Box key={index}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                <Iconify
                  icon={
                    upload.status === 'success'
                      ? 'solar:check-circle-bold'
                      : upload.status === 'error'
                        ? 'solar:trash-bin-trash-bold'
                        : 'solar:cloud-storage-bold-duotone'
                  }
                  width={20}
                  sx={{
                    color:
                      upload.status === 'success'
                        ? 'success.main'
                        : upload.status === 'error'
                          ? 'error.main'
                          : 'text.secondary',
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {upload.file.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatFileSize(upload.file.size)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {upload.progress}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={upload.progress}
                color={upload.status === 'error' ? 'error' : 'primary'}
              />
              {upload.error && (
                <Typography variant="caption" color="error.main" sx={{ mt: 0.5 }}>
                  {upload.error}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

