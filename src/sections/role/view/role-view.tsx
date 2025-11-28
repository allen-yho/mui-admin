import type { Role } from 'src/api/roles';
import type { Menu } from 'src/api/menus';

import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import Collapse from '@mui/material/Collapse';
import TableRow from '@mui/material/TableRow';
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
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { rolesApi } from 'src/api/roles';
import { menusApi } from 'src/api/menus';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { RoleTableRow } from '../role-table-row';

// ----------------------------------------------------------------------

// 菜单树选择组件
type MenuTreeItemProps = {
  menu: Menu;
  depth: number;
  selectedMenuIds: string[];
  onToggle: (menuId: string, checked: boolean) => void;
};

function MenuTreeItem({ menu, depth, selectedMenuIds, onToggle }: MenuTreeItemProps) {
  const [open, setOpen] = useState(true);
  const hasChildren = menu.children && menu.children.length > 0;
  const isChecked = selectedMenuIds.includes(menu.id);

  // 获取所有子菜单 ID（递归）
  const getAllChildIds = (m: Menu): string[] => {
    const ids: string[] = [];
    if (m.children) {
      m.children.forEach((child) => {
        ids.push(child.id);
        ids.push(...getAllChildIds(child));
      });
    }
    return ids;
  };

  // 检查所有子菜单是否都被选中
  const allChildrenSelected = hasChildren
    ? getAllChildIds(menu).every((id) => selectedMenuIds.includes(id))
    : true;

  // 检查是否有部分子菜单被选中
  const someChildrenSelected = hasChildren
    ? getAllChildIds(menu).some((id) => selectedMenuIds.includes(id)) && !allChildrenSelected
    : false;

  const handleToggle = (checked: boolean) => {
    onToggle(menu.id, checked);
    // 如果有子菜单，同时选中/取消所有子菜单
    if (hasChildren) {
      getAllChildIds(menu).forEach((id) => onToggle(id, checked));
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', pl: depth * 3 }}>
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
        <FormControlLabel
          control={
            <Checkbox
              checked={isChecked}
              indeterminate={someChildrenSelected && !isChecked}
              onChange={(e) => handleToggle(e.target.checked)}
              size="small"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {menu.meta?.icon && (
                <Iconify icon={menu.meta.icon as any} width={18} />
              )}
              <Typography variant="body2">{menu.meta?.title || menu.name}</Typography>
            </Box>
          }
        />
      </Box>
      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          {menu.children?.map((child) => (
            <MenuTreeItem
              key={child.id}
              menu={child}
              depth={depth + 1}
              selectedMenuIds={selectedMenuIds}
              onToggle={onToggle}
            />
          ))}
        </Collapse>
      )}
    </>
  );
}

// ----------------------------------------------------------------------

export function RoleView() {
  const { t } = useTranslation();
  const [roles, setRoles] = useState<Role[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);

  // 对话框状态
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    description: '',
  });
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([]);

  // 删除确认对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  // 加载角色列表和菜单
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesData, menusData] = await Promise.all([rolesApi.getAll(), menusApi.getAll()]);
      setRoles(rolesData);
      setMenus(menusData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 打开创建对话框
  const handleOpenCreate = useCallback(() => {
    setDialogMode('create');
    setEditingRole(null);
    setFormData({ name: '', value: '', description: '' });
    setSelectedMenuIds([]);
    setOpenDialog(true);
  }, []);

  // 打开编辑对话框
  const handleOpenEdit = useCallback(async (role: Role) => {
    setDialogMode('edit');
    setEditingRole(role);
    setFormData({
      name: role.name,
      value: role.value,
      description: role.description || '',
    });
    // 加载角色的菜单权限
    try {
      const menuIds = await rolesApi.getMenus(role.id);
      setSelectedMenuIds(menuIds);
    } catch (error) {
      console.error('Failed to fetch role menus:', error);
      setSelectedMenuIds([]);
    }
    setOpenDialog(true);
  }, []);

  // 关闭对话框
  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setEditingRole(null);
  }, []);

  // 切换菜单选中状态
  const handleToggleMenu = useCallback((menuId: string, checked: boolean) => {
    setSelectedMenuIds((prev) => {
      if (checked) {
        return prev.includes(menuId) ? prev : [...prev, menuId];
      }
      return prev.filter((id) => id !== menuId);
    });
  }, []);

  // 提交表单
  const handleSubmit = useCallback(async () => {
    try {
      if (dialogMode === 'create') {
        await rolesApi.create({
          name: formData.name,
          value: formData.value,
          description: formData.description,
          menuIds: selectedMenuIds,
        });
      } else if (editingRole) {
        await rolesApi.update(editingRole.id, {
          name: formData.name,
          value: formData.value,
          description: formData.description,
          menuIds: selectedMenuIds,
        });
      }
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Failed to save role:', error);
    }
  }, [dialogMode, editingRole, formData, selectedMenuIds, handleCloseDialog, fetchData]);

  // 打开删除确认
  const handleOpenDelete = useCallback((role: Role) => {
    setDeletingRole(role);
    setDeleteDialogOpen(true);
  }, []);

  // 确认删除
  const handleConfirmDelete = useCallback(async () => {
    if (deletingRole) {
      try {
        await rolesApi.delete(deletingRole.id);
        setDeleteDialogOpen(false);
        setDeletingRole(null);
        fetchData();
      } catch (error) {
        console.error('Failed to delete role:', error);
      }
    }
  }, [deletingRole, fetchData]);

  const handleSelectRow = useCallback(
    (id: string) => {
      const newSelected = selected.includes(id)
        ? selected.filter((value) => value !== id)
        : [...selected, id];
      setSelected(newSelected);
    },
    [selected]
  );

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
          {t('role.title')}
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleOpenCreate}
        >
          {t('role.newRole')}
        </Button>
      </Box>

      <Card>
        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>{t('role.name')}</TableCell>
                  <TableCell>{t('role.value')}</TableCell>
                  <TableCell>{t('role.description')}</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {roles
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => (
                    <RoleTableRow
                      key={row.id}
                      row={row}
                      selected={selected.includes(String(row.id))}
                      onSelectRow={() => handleSelectRow(String(row.id))}
                      onEdit={handleOpenEdit}
                      onDelete={handleOpenDelete}
                    />
                  ))}
                {roles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('role.noRolesFound')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          component="div"
          page={page}
          count={roles.length}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* 创建/编辑对话框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {dialogMode === 'create' ? t('role.createRole') : t('role.editRole')}
          <IconButton onClick={handleCloseDialog} size="small">
            <Iconify icon="mingcute:close-line" width={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label={t('role.name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
            />
            <TextField
              label={t('role.value')}
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              fullWidth
              disabled={dialogMode === 'edit'}
              helperText={dialogMode === 'edit' ? t('role.valueCannotBeChanged') : ''}
            />
            <TextField
              label={t('role.description')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            {/* 菜单权限选择 */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t('role.menuPermissions')}
              </Typography>
              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1.5,
                  maxHeight: 300,
                  overflow: 'auto',
                }}
              >
                {menus.length > 0 ? (
                  menus.map((menu) => (
                    <MenuTreeItem
                      key={menu.id}
                      menu={menu}
                      depth={0}
                      selectedMenuIds={selectedMenuIds}
                      onToggle={handleToggleMenu}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    {t('role.noMenusAvailable')}
                  </Typography>
                )}
              </Box>
            </Box>
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
            {t('role.confirmDelete')} &quot;{deletingRole?.name}&quot;?
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

