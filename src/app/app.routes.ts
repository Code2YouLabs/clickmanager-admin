import { Routes } from '@angular/router';
import { BlankComponent } from './layouts/blank/blank.component';
import { FullComponent } from './layouts/full/full.component';
import { AuthGuard } from './pages/authentication/guards/auth.guard';
import { AppBoxedLoginComponent } from './pages/authentication/boxed-login/boxed-login.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: '',
    component: FullComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'page',
        loadChildren: () =>
          import('./pages/pages.routes').then((m) => m.PagesRoutes),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboards/dashboard1/dashboard1.component').then((m) => m.AppDashboard1Component),
        data: {
          title: 'Dashboard',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Dashboard' }
          ]
        }
      },
      {
        path: 'chamados',
        loadComponent: () =>
          import('./pages/suporte/suporte.component').then((m) => m.SuporteComponent),
        data: {
          title: 'Chamados de suporte',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Chamados' }
          ]
        }
      },
      {
        path: 'atividades',
        loadComponent: () =>
          import('./pages/atividades/atividades-admin.component').then((m) => m.AtividadesAdminComponent),
        data: {
          title: 'Atividades do admin',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Atividades' }
          ]
        }
      },
      {
        path: 'empresas',
        loadComponent: () =>
          import('./pages/empresas/empresas-admin.component').then((m) => m.EmpresasAdminComponent),
        data: {
          title: 'Empresas',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Empresas' }
          ]
        }
      },
      {
        path: 'adocao',
        loadComponent: () =>
          import('./pages/adocao/adocao-funil.component').then((m) => m.AdocaoFunilComponent),
        data: {
          title: 'Adoção',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Adoção' }
          ]
        }
      },
      {
        path: 'configuracoes',
        loadComponent: () =>
          import('./pages/config/email-servidor/email-servidor.component').then((m) => m.EmailServidorComponent),
        data: {
          title: 'Configurações',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Configurações' }
          ]
        }
      },
      {
        path: 'leads',
        loadComponent: () =>
          import('./pages/leads/leads-admin.component').then((m) => m.LeadsAdminComponent),
        data: {
          title: 'Leads da landing',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Leads' }
          ]
        }
      },
      {
        path: 'planos',
        loadComponent: () =>
          import('./pages/planos/planos-admin.component').then((m) => m.PlanosAdminComponent),
        data: {
          title: 'Planos da plataforma',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Planos' }
          ]
        }
      },
      {
        path: 'cupons',
        loadComponent: () =>
          import('./pages/cobranca-beneficios/cobranca-beneficios-admin.component').then((m) => m.CobrancaBeneficiosAdminComponent),
        data: {
          title: 'Cupons e benefícios',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Cupons' }
          ]
        }
      },
      {
        path: 'pagamentos',
        loadComponent: () =>
          import('./pages/pagamentos/pagamentos-admin.component').then((m) => m.PagamentosAdminComponent),
        data: {
          title: 'Pagamentos',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Pagamentos' }
          ]
        }
      },
      {
        path: 'notificacoes',
        loadComponent: () =>
          import('./pages/notificacoes-admin/notificacoes-admin.component').then((m) => m.NotificacoesAdminComponent),
        data: {
          title: 'Enviar notificações',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Notificações' }
          ]
        }
      },
      {
        path: 'landing-acessos',
        loadComponent: () =>
          import('./pages/landing-acessos/landing-acessos-admin.component').then((m) => m.LandingAcessosAdminComponent),
        data: {
          title: 'Acessos da landing',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Landing' }
          ]
        }
      },
      {
        path: 'onboarding/catalogo',
        loadComponent: () =>
          import('./pages/onboarding/catalogo-admin/onboarding-catalogo-admin.component').then((m) => m.OnboardingCatalogoAdminComponent),
        data: {
          title: 'Catálogo do onboarding',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Onboarding' }
          ]
        }
      },
      {
        path: 'onboarding/catalogo/servicos/novo',
        loadComponent: () =>
          import('./pages/onboarding/catalogo-admin/onboarding-catalogo-item-form.component').then((m) => m.OnboardingCatalogoItemFormComponent),
        data: {
          entity: 'servicos',
          title: 'Novo serviço do onboarding',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Onboarding', url: '/onboarding/catalogo?tab=servicos' },
            { title: 'Novo serviço' }
          ]
        }
      },
      {
        path: 'onboarding/catalogo/servicos/:id/editar',
        loadComponent: () =>
          import('./pages/onboarding/catalogo-admin/onboarding-catalogo-item-form.component').then((m) => m.OnboardingCatalogoItemFormComponent),
        data: {
          entity: 'servicos',
          title: 'Editar serviço do onboarding',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Onboarding', url: '/onboarding/catalogo?tab=servicos' },
            { title: 'Editar serviço' }
          ]
        }
      },
      {
        path: 'onboarding/catalogo/acabamentos/novo',
        loadComponent: () =>
          import('./pages/onboarding/catalogo-admin/onboarding-catalogo-item-form.component').then((m) => m.OnboardingCatalogoItemFormComponent),
        data: {
          entity: 'acabamentos',
          title: 'Novo acabamento do onboarding',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Onboarding', url: '/onboarding/catalogo?tab=acabamentos' },
            { title: 'Novo acabamento' }
          ]
        }
      },
      {
        path: 'onboarding/catalogo/acabamentos/:id/editar',
        loadComponent: () =>
          import('./pages/onboarding/catalogo-admin/onboarding-catalogo-item-form.component').then((m) => m.OnboardingCatalogoItemFormComponent),
        data: {
          entity: 'acabamentos',
          title: 'Editar acabamento do onboarding',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Onboarding', url: '/onboarding/catalogo?tab=acabamentos' },
            { title: 'Editar acabamento' }
          ]
        }
      },
      {
        path: 'onboarding/catalogo/produtos/novo',
        loadComponent: () =>
          import('./pages/onboarding/catalogo-admin/onboarding-catalogo-produto-form.component').then((m) => m.OnboardingCatalogoProdutoFormComponent),
        data: {
          title: 'Novo produto do onboarding',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Onboarding', url: '/onboarding/catalogo?tab=produtos' },
            { title: 'Novo produto' }
          ]
        }
      },
      {
        path: 'onboarding/catalogo/produtos/:id/editar',
        loadComponent: () =>
          import('./pages/onboarding/catalogo-admin/onboarding-catalogo-produto-form.component').then((m) => m.OnboardingCatalogoProdutoFormComponent),
        data: {
          title: 'Editar produto do onboarding',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Onboarding', url: '/onboarding/catalogo?tab=produtos' },
            { title: 'Editar produto' }
          ]
        }
      },
      {
        path: 'demo-smartcalc',
        loadComponent: () =>
          import('./pages/analytics/demo-funnel/demo-funnel.component').then((m) => m.DemoFunnelComponent),
        data: {
          title: 'Funil da demo SmartCalc',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Demo SmartCalc' }
          ]
        }
      },
      {
        path: 'chamados/:id',
        loadComponent: () =>
          import('./pages/suporte/suporte.component').then((m) => m.SuporteComponent),
        data: {
          title: 'Detalhe do chamado',
          urls: [
            { title: 'Admin', url: '/dashboard' },
            { title: 'Chamados', url: '/chamados' },
            { title: 'Detalhe' }
          ]
        }
      }
    ],
  },
  {
    path: '',
    component: BlankComponent,
    children: [
      {
        path: 'login',
        component: AppBoxedLoginComponent,
      },
      {
        path: 'authentication',
        loadChildren: () =>
          import('./pages/authentication/authentication.routes').then(
            (m) => m.AuthenticationRoutes
          ),
      }
    ],
  },
  {
    path: '**',
    redirectTo: 'authentication/error',
  }
];
