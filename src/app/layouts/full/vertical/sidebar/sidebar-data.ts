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
    displayName: 'Calculadora de Materiais',
    iconName: 'calculator',
    bgcolor: 'primary',
    route: '/page/calculadora-materiais',
    featureKey: 'CALCULADORA_MATERIAIS',
    requiredPermission: ['CONFIG_CALCULADORAS'],
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
  },
  {
    displayName: 'Planos',
    iconName: 'credit-card',
    bgcolor: 'primary',
    route: '/planos',
  },
  {
    displayName: 'Cupons',
    iconName: 'ticket',
    bgcolor: 'primary',
    route: '/cupons',
  },
  {
    displayName: 'Pagamentos',
    iconName: 'receipt-2',
    bgcolor: 'primary',
    route: '/pagamentos',
  },
  {
    displayName: 'Notificações',
    iconName: 'bell-ringing',
    bgcolor: 'primary',
    route: '/notificacoes',
  },
  {
    displayName: 'Landing',
    iconName: 'world-www',
    bgcolor: 'primary',
    route: '/landing-acessos',
  },
  {
    displayName: 'Meu Site',
    iconName: 'browser',
    bgcolor: 'primary',
    route: '/page/site',
    requiredPermission: ['SITE_HOME_SECTIONS_VER'],
    children: [
      {
        displayName: 'Banners',
        iconName: 'point',
        bgcolor: 'transparent',
        route: '/page/site/banners',
      },
      {
        displayName: 'Seções da Home',
        iconName: 'point',
        bgcolor: 'transparent',
        route: '/page/site/home-sections',
        requiredPermission: ['SITE_HOME_SECTIONS_VER'],
      },
    ],
  },
  {
    displayName: 'Onboarding',
    iconName: 'sparkles',
    bgcolor: 'primary',
    route: '/onboarding/catalogo',
  },
  {
    displayName: 'Demo SmartCalc',
    iconName: 'chart-bar',
    bgcolor: 'primary',
    route: '/demo-smartcalc',
  }
];
