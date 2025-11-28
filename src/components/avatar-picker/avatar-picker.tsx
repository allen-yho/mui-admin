import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// 预设头像列表
const AVATARS = Array.from({ length: 25 }, (_, i) => `/assets/images/avatar/avatar-${i + 1}.webp`);

type AvatarPickerProps = {
  value?: string;
  onChange?: (avatar: string) => void;
  size?: number;
};

export function AvatarPicker({ value, onChange, size = 80 }: AvatarPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(value || '');

  const handleOpen = useCallback(() => {
    setSelected(value || '');
    setOpen(true);
  }, [value]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSelect = useCallback((avatar: string) => {
    setSelected(avatar);
  }, []);

  const handleConfirm = useCallback(() => {
    onChange?.(selected);
    setOpen(false);
  }, [onChange, selected]);

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          width: size,
          height: size,
          cursor: 'pointer',
          '&:hover .avatar-overlay': {
            opacity: 1,
          },
        }}
        onClick={handleOpen}
      >
        <Avatar
          src={value}
          sx={{
            width: size,
            height: size,
            border: '2px solid',
            borderColor: 'divider',
          }}
        >
          {!value && <Iconify icon="solar:shield-keyhole-bold-duotone" width={size * 0.5} />}
        </Avatar>
        <Box
          className="avatar-overlay"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '50%',
            opacity: 0,
            transition: 'opacity 0.2s',
          }}
        >
          <Iconify icon="solar:pen-bold" width={24} sx={{ color: 'white' }} />
        </Box>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {t('avatar.selectAvatar')}
          <IconButton onClick={handleClose} size="small">
            <Iconify icon="mingcute:close-line" width={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 2,
              py: 2,
            }}
          >
            {AVATARS.map((avatar) => (
              <Box
                key={avatar}
                onClick={() => handleSelect(avatar)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: '50%',
                  border: '3px solid',
                  borderColor: selected === avatar ? 'primary.main' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: selected === avatar ? 'primary.main' : 'divider',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Avatar
                  src={avatar}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    aspectRatio: '1',
                  }}
                />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirm} variant="contained">
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

