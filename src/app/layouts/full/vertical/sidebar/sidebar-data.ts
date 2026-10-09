import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Admin'
  },
  {
    displayName: 'Dashboard',
    iconName: 'layout-dashboard',
    bgcolor: 'primary',
    route: '/dashboard',
  },
  {
    displayName: 'Chamados',
    iconName: 'lifebuoy',
    bgcolor: 'primary',
    route: '/chamados',
  },
  {
    displayName: 'Atividades',
    iconName: 'timeline',
    bgcolor: 'primary',
    route: '/atividades',
  },
  {
    displayName: 'Empresas',
    iconName: 'building',
    bgcolor: 'primary',
    route: '/empresas',
  },
  {
    displayName: 'Adoção',
    iconName: 'chart-funnel',
    bgcolor: 'primary',
    route: '/adocao',
  },
  {
    displayName: 'Leads',
    iconName: 'mail',
    bgcolor: 'primary',
    route: '/leads',
  }
];
