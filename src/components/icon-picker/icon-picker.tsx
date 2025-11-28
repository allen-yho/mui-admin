import { useState, useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';

import iconSets from '../iconify/icon-sets';

// ----------------------------------------------------------------------

// 获取所有可用的图标名称
const AVAILABLE_ICONS = Object.keys(iconSets);

// 图标分类
const ICON_CATEGORIES: Record<string, string[]> = {
  'Solar (Duotone)': AVAILABLE_ICONS.filter((icon) => icon.includes('duotone')),
  'Solar (Bold)': AVAILABLE_ICONS.filter(
    (icon) => icon.startsWith('solar:') && !icon.includes('duotone')
  ),
  Eva: AVAILABLE_ICONS.filter((icon) => icon.startsWith('eva:')),
  Mingcute: AVAILABLE_ICONS.filter((icon) => icon.startsWith('mingcute:')),
  Custom: AVAILABLE_ICONS.filter((icon) => icon.startsWith('custom:')),
  Other: AVAILABLE_ICONS.filter(
    (icon) =>
      !icon.startsWith('solar:') &&
      !icon.startsWith('eva:') &&
      !icon.startsWith('mingcute:') &&
      !icon.startsWith('custom:') &&
      !icon.startsWith('socials:')
  ),
};

type IconPickerProps = {
  value: string;
  onChange: (icon: string) => void;
};

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const handleOpen = useCallback(() => {
    setOpen(true);
    setSearch('');
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleSelect = useCallback(
    (icon: string) => {
      onChange(icon);
      handleClose();
    },
    [onChange, handleClose]
  );

  const filteredIcons = useMemo(() => {
    if (!search) return AVAILABLE_ICONS;
    return AVAILABLE_ICONS.filter((icon) => icon.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const groupedIcons = useMemo(() => {
    if (search) {
      return { 'Search Results': filteredIcons };
    }
    return ICON_CATEGORIES;
  }, [search, filteredIcons]);

  return (
    <>
      <TextField
        fullWidth
        label="Icon"
        value={value}
        onClick={handleOpen}
        placeholder="Click to select icon"
        slotProps={{
          input: {
            readOnly: true,
            startAdornment: value ? (
              <InputAdornment position="start">
                <Iconify icon={value as any} width={24} />
              </InputAdornment>
            ) : null,
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleOpen}>
                  <Iconify icon="eva:arrow-ios-downward-fill" width={20} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Select Icon
          <IconButton onClick={handleClose} size="small">
            <Iconify icon="mingcute:close-line" width={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" width={20} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {Object.entries(groupedIcons).map(
              ([category, icons]) =>
                icons.length > 0 && (
                  <Box key={category} sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        mb: 1,
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                      }}
                    >
                      {category} ({icons.length})
                    </Box>
                    <Grid container spacing={1}>
                      {icons.map((icon) => (
                        <Grid key={icon} size={{ xs: 2, sm: 1.5 }}>
                          <Tooltip title={icon} placement="top">
                            <Button
                              onClick={() => handleSelect(icon)}
                              sx={{
                                p: 1.5,
                                minWidth: 0,
                                width: '100%',
                                aspectRatio: '1/1',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: value === icon ? 'primary.main' : 'divider',
                                bgcolor: value === icon ? 'primary.lighter' : 'transparent',
                                '&:hover': {
                                  borderColor: 'primary.main',
                                  bgcolor: 'action.hover',
                                },
                              }}
                            >
                              <Iconify icon={icon as any} width={24} />
                            </Button>
                          </Tooltip>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )
            )}

            {filteredIcons.length === 0 && (
              <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                No icons found
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}

