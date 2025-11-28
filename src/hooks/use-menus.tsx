import type { TFunction } from 'i18next';
import type { Menu } from 'src/api/menus';
import type { NavItem } from 'src/layouts/nav-config-dashboard';

import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';

import { menusApi } from 'src/api/menus';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// 将后端菜单数据转换为前端 NavItem 格式
function transformMenuToNavItem(menu: Menu, t: TFunction): NavItem {
  // 优先使用 i18n key 翻译，如果没有则使用 title
  const title = menu.meta?.i18n ? t(menu.meta.i18n) : (menu.meta?.title || menu.name);

  const navItem: NavItem = {
    title,
    path: menu.path,
    icon: menu.meta?.icon ? <Iconify icon={menu.meta.icon as any} width={24} /> : undefined,
  };

  if (menu.children && menu.children.length > 0) {
    navItem.children = menu.children
      .filter((child) => child.state) // 只显示启用的菜单
      .sort((a, b) => a.menuSort - b.menuSort)
      .map((child) => transformMenuToNavItem(child, t));
  }

  return navItem;
}

export function useMenus() {
  const { t, i18n } = useTranslation();
  const [navData, setNavData] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [menus, setMenus] = useState<Menu[]>([]);

  // 获取菜单数据
  const fetchMenus = useCallback(async () => {
    try {
      setLoading(true);
      // 使用 getAuthorized API，只获取当前用户有权限的菜单
      const data = await menusApi.getAuthorized();
      setMenus(data);
    } catch (error) {
      console.error('Failed to fetch menus:', error);
      setMenus([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 转换菜单数据（语言变化时重新转换）
  useEffect(() => {
    if (menus.length > 0) {
      const enabledMenus = menus
        .filter((menu) => menu.state)
        .sort((a, b) => a.menuSort - b.menuSort);

      const transformedNavData = enabledMenus.map((menu) => transformMenuToNavItem(menu, t));
      setNavData(transformedNavData);
    } else {
      setNavData([]);
    }
  }, [menus, t, i18n.language]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  return { navData, loading, refetch: fetchMenus };
}

