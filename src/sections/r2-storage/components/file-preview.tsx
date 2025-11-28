import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Iconify } from 'src/components/iconify';

import { getMimeTypeFromExtension } from 'src/utils/file-type';

import { r2Api } from 'src/api/r2';
import type { R2File } from 'src/api/r2';

// ----------------------------------------------------------------------

type FilePreviewProps = {
  file: R2File;
  onClose: () => void;
};

export function FilePreview({ file, onClose }: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let blobUrl: string | null = null;
    let isCancelled = false;

    const loadPreview = async () => {
      try {
        setLoading(true);
        if (!file.key) {
          throw new Error('File key is required');
        }
        
        const token = localStorage.getItem('token');
        console.log('Preview - file.key:', file.key); // 调试用
        const proxyUrl = r2Api.getProxyUrl(file.key);
        
        console.log('Preview URL:', proxyUrl); // 调试用
        
        // 使用 fetch 获取文件内容，创建 blob URL（支持认证）
        const response = await fetch(proxyUrl, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Preview failed:', response.status, errorText);
          throw new Error(`Failed to load file: ${response.status} ${errorText}`);
        }

        if (isCancelled) return;

        const blob = await response.blob();
        if (isCancelled) return;
        blobUrl = window.URL.createObjectURL(blob);
        setPreviewUrl(blobUrl);
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to load preview:', error);
          alert(`预览失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadPreview();

    // 清理函数：组件卸载时释放 blob URL
    return () => {
      isCancelled = true;
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
      }
    };
  }, [file.key]);

  const fileName = file.key.split('/').pop() || file.key;
  const contentType = file.httpMetadata?.contentType || getMimeTypeFromExtension(fileName);
  const isImage = contentType.startsWith('image/');
  const isVideo = contentType.startsWith('video/');
  const isAudio = contentType.startsWith('audio/');
  const isPdf = contentType === 'application/pdf';

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token');
      const proxyUrl = r2Api.getProxyUrl(file.key);
      
      const response = await fetch(proxyUrl, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 延迟释放 URL，确保下载开始
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('下载失败，请重试');
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box component="span" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {fileName}
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Iconify icon="mingcute:close-line" width={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <Iconify icon="solar:restart-bold" width={48} sx={{ animation: 'spin 1s linear infinite' }} />
          </Box>
        ) : previewUrl ? (
          <Box sx={{ textAlign: 'center' }}>
            {isImage && (
              <Box
                component="img"
                src={previewUrl}
                alt={fileName}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                }}
              />
            )}

            {isVideo && (
              <Box
                component="video"
                src={previewUrl}
                controls
                sx={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                }}
              />
            )}

            {isAudio && (
              <Box
                component="audio"
                src={previewUrl}
                controls
                sx={{
                  width: '100%',
                }}
              />
            )}

            {isPdf && (
              <Box
                component="iframe"
                src={previewUrl}
                sx={{
                  width: '100%',
                  height: '70vh',
                  border: 'none',
                }}
              />
            )}

            {!isImage && !isVideo && !isAudio && !isPdf && (
              <Stack spacing={2} alignItems="center" sx={{ py: 8 }}>
                <Iconify icon="solar:file-bold-duotone" width={64} sx={{ opacity: 0.5 }} />
                <Box>
                  <Box component="span" sx={{ fontWeight: 'bold' }}>
                    {fileName}
                  </Box>
                  <Box component="span" sx={{ display: 'block', color: 'text.secondary', mt: 1 }}>
                    {contentType || 'Unknown file type'}
                  </Box>
                </Box>
              </Stack>
            )}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Iconify icon="solar:trash-bin-trash-bold" width={48} sx={{ opacity: 0.5 }} />
            <Box sx={{ mt: 2 }}>Failed to load preview</Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleDownload} startIcon={<Iconify icon="solar:share-bold" width={20} />}>
          Download
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

