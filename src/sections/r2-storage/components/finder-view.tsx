import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Iconify } from 'src/components/iconify';

import { r2Api, type R2File } from 'src/api/r2';
import { getFileIcon, getMimeTypeFromExtension } from 'src/utils/file-type';

// ----------------------------------------------------------------------

type FinderViewProps = {
  files: R2File[];
  loading: boolean;
  currentPath: string;
  onNavigate: (path: string) => void;
  onUpload: (files: File[], targetPath?: string) => void;
  onDelete: (key: string) => void;
  onPreview: (file: R2File) => void;
  onDownload: (file: R2File) => void;
  onRename: (key: string, newName: string) => void;
  onCreateFolder: (name: string) => void;
};

export function FinderView({
  files,
  loading,
  currentPath,
  onNavigate,
  onUpload,
  onDelete,
  onPreview,
  onDownload,
  onRename,
  onCreateFolder,
}: FinderViewProps) {
  const { t } = useTranslation();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: R2File | null;
  } | null>(null);
  const [draggedItem, setDraggedItem] = useState<R2File | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [isDraggingExternal, setIsDraggingExternal] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{ key: string; name: string } | null>(null);
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理外部文件拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files') && !draggedItem) {
      setIsDraggingExternal(true);
    }
  }, [draggedItem]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingExternal(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingExternal(false);

      // 处理外部文件拖拽上传
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles.length > 0) {
        const targetPath = dragOverFolder || currentPath;
        onUpload(Array.from(droppedFiles), targetPath);
        setDraggedItem(null);
        setDragOverFolder(null);
        return;
      }

      // 处理内部拖拽（文件到文件夹）
      if (draggedItem && dragOverFolder && !draggedItem.isFolder) {
        const fileName = draggedItem.key.split('/').filter(Boolean).pop() || draggedItem.key;
        const newKey = dragOverFolder + fileName;
        r2Api.move(draggedItem.key, newKey).then(() => {
          onNavigate(currentPath);
        }).catch((error) => {
          console.error('Failed to move file:', error);
          alert('移动文件失败，请重试');
        });
      }

      setDraggedItem(null);
      setDragOverFolder(null);
    },
    [draggedItem, dragOverFolder, currentPath, onUpload, onNavigate]
  );

  // 右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent, item: R2File) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      item,
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleContextMenuAction = useCallback(
    async (action: string, item: R2File) => {
      handleCloseContextMenu();

      switch (action) {
        case 'preview':
          if (!item.isFolder) {
            onPreview(item);
          }
          break;
        case 'download':
          if (!item.isFolder) {
            onDownload(item);
          }
          break;
        case 'rename':
          const name = item.key.split('/').filter(Boolean).pop() || '';
          setRenameDialog({ key: item.key, name: name.replace(/\/$/, '') });
          break;
        case 'delete':
          if (window.confirm(t('r2Storage.confirmDelete'))) {
            onDelete(item.key);
          }
          break;
        case 'open':
          if (item.isFolder) {
            onNavigate(item.key);
          }
          break;
      }
    },
    [handleCloseContextMenu, onPreview, onDownload, onDelete, onNavigate, t]
  );

  // 双击打开
  const handleDoubleClick = useCallback(
    (item: R2File) => {
      if (item.isFolder) {
        onNavigate(item.key);
      } else {
        onPreview(item);
      }
    },
    [onNavigate, onPreview]
  );

  // 路径面包屑
  const pathParts = currentPath.split('/').filter(Boolean);
  const handleBreadcrumbClick = useCallback(
    (index: number) => {
      const path = index === -1 ? '' : pathParts.slice(0, index + 1).join('/') + '/';
      onNavigate(path);
    },
    [pathParts, onNavigate]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getItemName = (item: R2File) => {
    const parts = item.key.split('/').filter(Boolean);
    return parts.pop() || item.key;
  };

  // 截断文件名，最多显示两行，超出部分省略中间
  // 估算：每行约 12-15 个字符（根据卡片宽度），两行约 24-30 个字符
  const truncateFileName = (fileName: string) => {
    const maxChars = 28; // 估算两行可显示的字符数
    if (fileName.length <= maxChars) {
      return fileName;
    }
    
    // 如果有扩展名，保留扩展名
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex > 0 && lastDotIndex < fileName.length - 1) {
      const name = fileName.substring(0, lastDotIndex);
      const ext = fileName.substring(lastDotIndex);
      const availableLength = maxChars - ext.length - 3; // 3 for "..."
      
      if (name.length <= availableLength) {
        return fileName;
      }
      
      // 保留前一部分和后一部分（包括扩展名）
      const frontLength = Math.floor(availableLength / 2);
      const backLength = availableLength - frontLength;
      return `${name.substring(0, frontLength)}...${name.substring(name.length - backLength)}${ext}`;
    }
    
    // 没有扩展名，直接截断
    const frontLength = Math.floor(maxChars / 2);
    const backLength = maxChars - frontLength - 3; // 3 for "..."
    return `${fileName.substring(0, frontLength)}...${fileName.substring(fileName.length - backLength)}`;
  };

  // 点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  return (
    <Box
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        height: 'calc(100vh - 200px)',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
        position: 'relative',
      }}
    >
      {/* 工具栏 */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Stack direction="row" spacing={1}>
          <IconButton
            size="small"
            onClick={() => onNavigate('')}
            disabled={!currentPath}
          >
            <Iconify icon="solar:arrow-left-bold" width={20} />
          </IconButton>
          <IconButton size="small" onClick={() => onNavigate('')}>
            <Iconify icon="solar:home-angle-bold-duotone" width={20} />
          </IconButton>
        </Stack>

        <Breadcrumbs separator="/" sx={{ flex: 1, mx: 2 }}>
          <Button
            variant="text"
            size="small"
            onClick={() => handleBreadcrumbClick(-1)}
            sx={{ minWidth: 'auto', px: 1 }}
          >
            {t('r2Storage.root')}
          </Button>
          {pathParts.map((part, index) => (
            <Button
              key={index}
              variant="text"
              size="small"
              onClick={() => handleBreadcrumbClick(index)}
              sx={{ minWidth: 'auto', px: 1 }}
            >
              {part}
            </Button>
          ))}
        </Breadcrumbs>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="mingcute:add-line" width={18} />}
            onClick={() => setNewFolderDialog(true)}
          >
            {t('r2Storage.newFolder')}
          </Button>
        </Stack>
      </Paper>

      {/* 文件网格 */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          position: 'relative',
          bgcolor: isDraggingExternal ? 'action.hover' : 'transparent',
          transition: 'background-color 0.2s',
        }}
      >
        {loading ? (
          <LinearProgress />
        ) : files.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
            }}
          >
            <Iconify icon="solar:cloud-storage-bold-duotone" width={64} sx={{ mb: 2, opacity: 0.5 }} />
            <Typography variant="body1">{t('r2Storage.noFiles')}</Typography>
            {isDraggingExternal && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {t('r2Storage.dropFilesHere')}
              </Typography>
            )}
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 2,
            }}
          >
            {files.map((item) => {
              const fullName = getItemName(item);
              const name = truncateFileName(fullName);
              const isSelected = selectedItems.has(item.key);
              const isDraggedOver = dragOverFolder === item.key && item.isFolder;
              const icon = item.isFolder
                ? 'solar:folder-bold-duotone'
                : (getFileIcon(item.httpMetadata?.contentType || getMimeTypeFromExtension(name), name) as any);

              return (
                <Card
                  key={item.key}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  onDoubleClick={() => handleDoubleClick(item)}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      setSelectedItems((prev) => {
                        const next = new Set(prev);
                        if (next.has(item.key)) {
                          next.delete(item.key);
                        } else {
                          next.add(item.key);
                        }
                        return next;
                      });
                    } else {
                      setSelectedItems(new Set([item.key]));
                    }
                  }}
                  draggable
                  onDragStart={(e) => {
                    setDraggedItem(item);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    // 支持外部文件拖到文件夹，或内部文件拖到文件夹
                    if (item.isFolder) {
                      e.preventDefault();
                      e.stopPropagation();
                      // 如果是外部文件拖拽，或者内部文件拖拽到不同文件夹
                      if (!draggedItem || (draggedItem.key !== item.key && !draggedItem.isFolder)) {
                        setDragOverFolder(item.key);
                      }
                    } else if (draggedItem) {
                      // 拖到非文件夹上，清除文件夹高亮
                      setDragOverFolder(null);
                    }
                  }}
                  onDragLeave={(e) => {
                    // 只有当鼠标真正离开元素时才清除
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOverFolder(null);
                    }
                  }}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    userSelect: 'none',
                    position: 'relative',
                    border: 2,
                    borderColor: isSelected ? 'primary.main' : 'transparent',
                    bgcolor: isDraggedOver ? 'action.hover' : isSelected ? 'action.selected' : 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                    transition: 'all 0.2s',
                  }}
                >
                  <Stack spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      <Iconify
                        icon={icon}
                        width={item.isFolder ? 56 : 48}
                        sx={{
                          color: item.isFolder ? 'warning.main' : 'text.secondary',
                        }}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        textAlign: 'center',
                        wordBreak: 'break-word',
                        maxWidth: '100%',
                        lineHeight: 1.2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minHeight: '2.4em', // 2 lines * 1.2 line-height
                      }}
                      title={fullName}
                    >
                      {name}
                    </Typography>
                    {!item.isFolder && (
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(item.size)}
                      </Typography>
                    )}
                  </Stack>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>

      {/* 右键菜单 */}
      {contextMenu && (
        <Paper
          sx={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1300,
            minWidth: 160,
            boxShadow: 3,
          }}
          onClick={handleCloseContextMenu}
        >
          <MenuList>
            {contextMenu.item?.isFolder ? (
              <MenuItem onClick={() => handleContextMenuAction('open', contextMenu.item!)}>
                <Iconify icon="solar:eye-bold" width={20} sx={{ mr: 1 }} />
                {t('r2Storage.open')}
              </MenuItem>
            ) : (
              <>
                <MenuItem onClick={() => handleContextMenuAction('preview', contextMenu.item!)}>
                  <Iconify icon="solar:eye-bold" width={20} sx={{ mr: 1 }} />
                  {t('r2Storage.preview')}
                </MenuItem>
                <MenuItem onClick={() => handleContextMenuAction('download', contextMenu.item!)}>
                  <Iconify icon="solar:share-bold" width={20} sx={{ mr: 1 }} />
                  {t('r2Storage.download')}
                </MenuItem>
              </>
            )}
            <MenuItem onClick={() => handleContextMenuAction('rename', contextMenu.item!)}>
              <Iconify icon="solar:pen-bold" width={20} sx={{ mr: 1 }} />
              {t('common.edit')}
            </MenuItem>
            <MenuItem
              onClick={() => handleContextMenuAction('delete', contextMenu.item!)}
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" width={20} sx={{ mr: 1 }} />
              {t('common.delete')}
            </MenuItem>
          </MenuList>
        </Paper>
      )}

      {/* 重命名对话框 */}
      <Dialog open={!!renameDialog} onClose={() => setRenameDialog(null)}>
        <DialogTitle>{t('r2Storage.rename')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            defaultValue={renameDialog?.name}
            label={t('r2Storage.newName')}
            inputRef={(input) => {
              if (input && renameDialog) {
                // 选中文件名（不包括扩展名）
                const name = renameDialog.name;
                const extIndex = name.lastIndexOf('.');
                if (extIndex > 0) {
                  input.setSelectionRange(0, extIndex);
                } else {
                  input.select();
                }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && renameDialog) {
                const newName = (e.target as HTMLInputElement).value;
                if (!newName.trim()) return;
                const oldPath = renameDialog.key;
                const isFolder = oldPath.endsWith('/');
                const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1);
                const newPath = parentPath + newName + (isFolder ? '/' : '');
                r2Api.move(oldPath, newPath).then(() => {
                  setRenameDialog(null);
                  onNavigate(currentPath);
                }).catch((error) => {
                  console.error('Failed to rename:', error);
                  alert('重命名失败，请重试');
                });
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialog(null)}>{t('common.cancel')}</Button>
          <Button
            onClick={() => {
              if (renameDialog) {
                const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                const newName = input?.value || '';
                if (!newName.trim()) return;
                const oldPath = renameDialog.key;
                const isFolder = oldPath.endsWith('/');
                const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1);
                const newPath = parentPath + newName + (isFolder ? '/' : '');
                r2Api.move(oldPath, newPath).then(() => {
                  setRenameDialog(null);
                  onNavigate(currentPath);
                }).catch((error) => {
                  console.error('Failed to rename:', error);
                  alert('重命名失败，请重试');
                });
              }
            }}
            variant="contained"
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 新建文件夹对话框 */}
      <Dialog open={newFolderDialog} onClose={() => setNewFolderDialog(false)}>
        <DialogTitle>{t('r2Storage.newFolder')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label={t('r2Storage.folderName')}
            defaultValue="New Folder"
            inputRef={(input) => {
              if (input) {
                input.select();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const name = (e.target as HTMLInputElement).value;
                if (!name.trim()) return;
                onCreateFolder(name);
                setNewFolderDialog(false);
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFolderDialog(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={() => {
              const input = document.querySelector('input[type="text"]') as HTMLInputElement;
              const name = input?.value || 'New Folder';
              if (!name.trim()) return;
              onCreateFolder(name);
              setNewFolderDialog(false);
            }}
            variant="contained"
          >
            {t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
