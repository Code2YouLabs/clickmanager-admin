import { navItems } from 'src/app/layouts/full/vertical/sidebar/sidebar-data';
import { PagesRoutes } from 'src/app/pages/pages.routes';

describe('Calculadora de Materiais access consistency', () => {
  it('menu e rota usam o mesmo modulo e permissao', () => {
    const menuItem = navItems.find(item => item.route === '/page/calculadora-materiais');
    const route = PagesRoutes.find(item => item.path === 'calculadora-materiais');

    expect(menuItem?.featureKey).toBe('CALCULADORA_MATERIAIS');
    expect(menuItem?.requiredPermission).toEqual(['CONFIG_CALCULADORAS']);
    expect(route?.data?.['featureKey']).toBe(menuItem?.featureKey);
    expect(route?.data?.['requiredPermission']).toEqual(menuItem?.requiredPermission);
  });
});
