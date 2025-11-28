import type { Menu } from 'src/api/menus';

import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Popover from '@mui/material/Popover';
import MenuList from '@mui/material/MenuList';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TextField from '@mui/material/TextField';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { menusApi } from 'src/api/menus';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { IconPicker } from 'src/components/icon-picker';

// ----------------------------------------------------------------------

type MenuRowProps = {
  menu: Menu;
  depth: number;
  onEdit: (menu: Menu) => void;
  onDelete: (menu: Menu) => void;
  onAddChild: (parentId: string) => void;
};

function MenuRow({ menu, depth, onEdit, onDelete, onAddChild }: MenuRowProps) {
  const [open, setOpen] = useState(true);
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const hasChildren = menu.children && menu.children.length > 0;

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleEdit = useCallback(() => {
    handleClosePopover();
    onEdit(menu);
  }, [handleClosePopover, onEdit, menu]);

  const handleDelete = useCallback(() => {
    handleClosePopover();
    onDelete(menu);
  }, [handleClosePopover, onDelete, menu]);

  const handleAddChild = useCallback(() => {
    handleClosePopover();
    onAddChild(menu.id);
  }, [handleClosePopover, onAddChild, menu.id]);

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ pl: 2 + depth * 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {hasChildren ? (
              <IconButton size="small" onClick={() => setOpen(!open)}>
                <Iconify
                  icon={open ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'}
                  width={16}
                />
              </IconButton>
            ) : (
              <Box sx={{ width: 28 }} />
            )}
            {menu.meta?.icon && <Iconify icon={menu.meta.icon as any} width={20} />}
            <Typography variant="body2">{menu.meta?.title || menu.name}</Typography>
          </Box>
        </TableCell>
        <TableCell>{menu.name}</TableCell>
        <TableCell>{menu.path}</TableCell>
        <TableCell align="center">{menu.menuSort}</TableCell>
        <TableCell align="center">
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: menu.state ? 'success.main' : 'error.main',
              display: 'inline-block',
            }}
          />
        </TableCell>
        <TableCell align="right">
          <IconButton onClick={handleOpenPopover}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            width: 140,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              px: 1,
              gap: 2,
              borderRadius: 0.75,
              [`&.${menuItemClasses.selected}`]: { bgcolor: 'action.selected' },
            },
          }}
        >
          <MenuItem onClick={handleAddChild}>
            <Iconify icon="mingcute:add-line" />
            Add child
          </MenuItem>
          <MenuItem onClick={handleEdit}>
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </Popover>

      {hasChildren && (
        <TableRow>
          <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Table size="small">
                <TableBody>
                  {menu.children?.map((child) => (
                    <MenuRow
                      key={child.id}
                      menu={child}
                      depth={depth + 1}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onAddChild={onAddChild}
                    />
                  ))}
                </TableBody>
              </Table>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ----------------------------------------------------------------------

export function MenuView() {
  const { t } = useTranslation();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  // 对话框状态
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState({
    parentId: '0',
    name: '',
    path: '',
    redirect: '',
    state: true,
    menuSort: 0,
    icon: '',
    title: '',
    permissions: '',
  });

  // 删除确认对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingMenu, setDeletingMenu] = useState<Menu | null>(null);

  // 加载菜单列表
  const fetchMenus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await menusApi.getAll();
      setMenus(data);
    } catch (error) {
      console.error('Failed to fetch menus:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  // 打开创建对话框
  const handleOpenCreate = useCallback((parentId = '0') => {
    setDialogMode('create');
    setEditingMenu(null);
    setFormData({
      parentId,
      name: '',
      path: '',
      redirect: '',
      state: true,
      menuSort: 0,
      icon: '',
      title: '',
      permissions: '',
    });
    setOpenDialog(true);
  }, []);

  // 打开编辑对话框
  const handleOpenEdit = useCallback((menu: Menu) => {
    setDialogMode('edit');
    setEditingMenu(menu);
    setFormData({
      parentId: menu.parentId || '0',
      name: menu.name,
      path: menu.path,
      redirect: menu.redirect || '',
      state: menu.state,
      menuSort: menu.menuSort,
      icon: menu.meta?.icon || '',
      title: menu.meta?.title || '',
      permissions: menu.meta?.permissions?.join(',') || '',
    });
    setOpenDialog(true);
  }, []);

  // 关闭对话框
  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setEditingMenu(null);
  }, []);

  // 提交表单
  const handleSubmit = useCallback(async () => {
    try {
      const payload = {
        parentId: formData.parentId,
        name: formData.name,
        path: formData.path,
        redirect: formData.redirect || undefined,
        state: formData.state,
        menuSort: formData.menuSort,
        meta: {
          icon: formData.icon || undefined,
          title: formData.title || undefined,
          permissions: formData.permissions
            ? formData.permissions.split(',').map((p) => p.trim())
            : undefined,
        },
      };

      if (dialogMode === 'create') {
        await menusApi.create(payload);
      } else if (editingMenu) {
        await menusApi.update(editingMenu.id, payload);
      }
      handleCloseDialog();
      fetchMenus();
    } catch (error) {
      console.error('Failed to save menu:', error);
    }
  }, [dialogMode, editingMenu, formData, handleCloseDialog, fetchMenus]);

  // 打开删除确认
  const handleOpenDelete = useCallback((menu: Menu) => {
    setDeletingMenu(menu);
    setDeleteDialogOpen(true);
  }, []);

  // 确认删除
  const handleConfirmDelete = useCallback(async () => {
    if (deletingMenu) {
      try {
        await menusApi.delete(deletingMenu.id);
        setDeleteDialogOpen(false);
        setDeletingMenu(null);
        fetchMenus();
      } catch (error) {
        console.error('Failed to delete menu:', error);
      }
    }
  }, [deletingMenu, fetchMenus]);

  if (loading) {
    return (
      <DashboardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
          }}
        >
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {t('menu.title')}
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => handleOpenCreate()}
        >
          {t('menu.newMenu')}
        </Button>
      </Box>

      <Card>
        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>{t('menu.menuTitle')}</TableCell>
                  <TableCell>{t('menu.name')}</TableCell>
                  <TableCell>{t('menu.path')}</TableCell>
                  <TableCell align="center">{t('menu.sort')}</TableCell>
                  <TableCell align="center">{t('common.status')}</TableCell>
                  <TableCell align="right">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {menus.map((menu) => (
                  <MenuRow
                    key={menu.id}
                    menu={menu}
                    depth={0}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                    onAddChild={handleOpenCreate}
                  />
                ))}
                {menus.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('menu.noMenusFound')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </Card>

      {/* 创建/编辑对话框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? t('menu.createMenu') : t('menu.editMenu')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label={t('menu.name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label={t('menu.menuTitle')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
            />
            <TextField
              label={t('menu.path')}
              value={formData.path}
              onChange={(e) => setFormData({ ...formData, path: e.target.value })}
              fullWidth
            />
            <IconPicker
              value={formData.icon}
              onChange={(icon) => setFormData({ ...formData, icon })}
            />
            <TextField
              label="Redirect"
              value={formData.redirect}
              onChange={(e) => setFormData({ ...formData, redirect: e.target.value })}
              fullWidth
            />
            <TextField
              label={t('menu.sort')}
              type="number"
              value={formData.menuSort}
              onChange={(e) => setFormData({ ...formData, menuSort: Number(e.target.value) })}
              fullWidth
            />
            <TextField
              label="Permissions"
              value={formData.permissions}
              onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.checked })}
                />
              }
              label={t('common.enabled')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained">
            {dialogMode === 'create' ? t('common.create') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>{t('common.confirm')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('menu.confirmDelete')} &quot;{deletingMenu?.meta?.title || deletingMenu?.name}
            &quot;?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}

