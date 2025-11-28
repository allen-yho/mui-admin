import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Container from '@mui/material/Container';
import Card from '@mui/material/Card';

import { r2Api, type R2File } from 'src/api/r2';

import { FinderView } from '../components/finder-view';
import { FilePreview } from '../components/file-preview';
import { FileUploader } from '../components/file-uploader';

// ----------------------------------------------------------------------

export function R2StorageView() {
  const { t } = useTranslation();
  const [files, setFiles] = useState<R2File[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<R2File | null>(null);
  const [currentPath, setCurrentPath] = useState('');

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const result = await r2Api.getList({ prefix: currentPath, limit: 500 });
      setFiles(result.objects || []);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPath]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleNavigate = useCallback((path: string) => {
    setCurrentPath(path);
  }, []);

  const handleUpload = useCallback(
    async (uploadedFiles: File[], targetPath?: string) => {
      const uploadPath = targetPath || currentPath;
      
      for (const file of uploadedFiles) {
        try {
          const fileName = file.name;
          const key = uploadPath ? `${uploadPath}${fileName}` : fileName;
          await r2Api.upload(file, key);
        } catch (error) {
          console.error('Failed to upload file:', error);
        }
      }
      
      await loadFiles();
    },
    [currentPath, loadFiles]
  );

  const handleDelete = useCallback(
    async (key: string) => {
      try {
        await r2Api.delete(key);
        await loadFiles();
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    },
    [loadFiles]
  );

  const handlePreview = useCallback((file: R2File) => {
    setPreviewFile(file);
  }, []);

  const handleDownload = useCallback(async (file: R2File) => {
    try {
      if (!file.key) {
        throw new Error('File key is required');
      }
      
      const token = localStorage.getItem('token');
      console.log('Download - file.key:', file.key); // 调试用
      const proxyUrl = r2Api.getProxyUrl(file.key);
      const fileName = file.key.split('/').pop() || file.key;

      console.log('Download URL:', proxyUrl); // 调试用

      const response = await fetch(proxyUrl, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Download failed:', response.status, errorText);
        throw new Error(`Failed to download file: ${response.status} ${errorText}`);
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
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert(`下载失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const handleRename = useCallback(
    async (key: string, newName: string) => {
      try {
        const isFolder = key.endsWith('/');
        const parentPath = key.substring(0, key.lastIndexOf('/') + 1);
        const newPath = parentPath + newName + (isFolder ? '/' : '');
        await r2Api.move(key, newPath);
        await loadFiles();
      } catch (error) {
        console.error('Failed to rename:', error);
      }
    },
    [loadFiles]
  );

  const handleCreateFolder = useCallback(
    async (name: string) => {
      try {
        const folderPath = currentPath ? `${currentPath}${name}/` : `${name}/`;
        await r2Api.createFolder(folderPath);
        await loadFiles();
      } catch (error) {
        console.error('Failed to create folder:', error);
      }
    },
    [currentPath, loadFiles]
  );

  return (
    <Container maxWidth={false} sx={{ height: 'calc(100vh - 100px)', p: 0 }}>
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <FinderView
          files={files}
          loading={loading}
          currentPath={currentPath}
          onNavigate={handleNavigate}
          onUpload={handleUpload}
          onDelete={handleDelete}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onRename={handleRename}
          onCreateFolder={handleCreateFolder}
        />
      </Card>

      {previewFile && (
        <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </Container>
  );
}
