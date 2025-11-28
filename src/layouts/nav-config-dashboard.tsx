import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

export type NavItem = {
  title: string;
  path: string;
  icon?: React.ReactNode;
  info?: React.ReactNode;
  children?: NavItem[];
};

export const navData: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/',
    icon: icon('ic-analytics'),
  },
  {
    title: 'System Setting',
    path: '/system',
    icon: icon('ic-lock'),
    children: [
      {
        title: 'User',
        path: '/user',
        icon: icon('ic-user'),
      },
      {
        title: 'Role',
        path: '/role',
        icon: icon('ic-lock'),
      },
      {
        title: 'Menu',
        path: '/menu',
        icon: icon('ic-blog'),
      },
    ],
  },
];
