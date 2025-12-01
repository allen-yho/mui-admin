import type { R2File } from 'src/api/r2';

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { getFileIcon, getMimeTypeFromExtension } from 'src/utils/file-type';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type FileListProps = {
  files: R2File[];
  loading: boolean;
  onDelete: (key: string) => void;
  onPreview: (file: R2File) => void;
};


const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
};

export function FileList({ files, loading, onDelete, onPreview }: FileListProps) {
  const { t } = useTranslation();

  const handlePreview = useCallback(
    (file: R2File) => {
      onPreview(file);
    },
    [onPreview]
  );

  const handleDelete = useCallback(
    (key: string) => {
      if (window.confirm(t('r2Storage.confirmDelete'))) {
        onDelete(key);
      }
    },
    [onDelete, t]
  );

  if (loading) {
    return <LinearProgress />;
  }

  if (files.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Iconify
          icon="solar:cloud-storage-bold-duotone"
          width={64}
          sx={{ mb: 2, opacity: 0.5 }}
        />
        <Typography variant="body1" color="text.secondary">
          {t('r2Storage.noFiles')}
        </Typography>
      </Box>
    );
  }

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>{t('r2Storage.fileName')}</TableCell>
          <TableCell>{t('r2Storage.fileSize')}</TableCell>
          <TableCell>{t('r2Storage.fileType')}</TableCell>
          <TableCell>{t('r2Storage.uploaded')}</TableCell>
          <TableCell align="right">{t('common.actions')}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {files.map((file) => {
          const fileName = file.key.split('/').pop() || file.key;
          const contentType = file.httpMetadata?.contentType || getMimeTypeFromExtension(fileName);
          const icon = getFileIcon(contentType, fileName);

          return (
            <TableRow key={file.key} hover>
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify icon={icon as any} width={24} />
                  <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                    {fileName}
                  </Typography>
                </Stack>
              </TableCell>
              <TableCell>{formatFileSize(file.size)}</TableCell>
              <TableCell>
                {contentType}
              </TableCell>
              <TableCell>{formatDate(file.uploaded)}</TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Tooltip title={t('r2Storage.preview')}>
                    <IconButton size="small" onClick={() => handlePreview(file)}>
                      <Iconify icon="solar:eye-bold" width={20} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('common.delete')}>
                    <IconButton size="small" color="error" onClick={() => handleDelete(file.key)}>
                      <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

