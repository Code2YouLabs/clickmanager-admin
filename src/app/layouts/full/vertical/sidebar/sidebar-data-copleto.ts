import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
    {
        navCap: 'Preferências',
        requiredPermission: ['DADOS_EMPRESA']
    },
    {
        displayName: 'Dados da empresa',
        iconName: 'building',
        bgcolor: 'primary',
        route: '/page/empresa',
        requiredPermission: ['DADOS_EMPRESA']
    },
    {
        displayName: 'Configurações',
        iconName: 'settings-automation',
        bgcolor: 'primary',
        route: '/config',
        requiredPermission: ['CONFIG_EMAIL', 'FOLHA_CONFIGURAR'],
        children: [
            {
                displayName: 'Servidor de E-mail',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/config/email-servidor',
                requiredPermission: ['CONFIG_EMAIL']
            },
            {
                displayName: 'Folha (Gestão de Pessoas)',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/config/folha-pagamento',
                requiredPermission: ['FOLHA_CONFIGURAR']
            }
        ]
    },
    {
        displayName: 'Configuração SmartCalc',
        iconName: 'calculator',
        bgcolor: 'primary',
        route: '/page/calculadora/config/criar',
        requiredPermission: ['CONFIG_CALCULADORAS']
    },    
    {
        navCap: 'Gerenciar Usuários',
        requiredPermission: ['USUARIOS_VER', 'USUARIO_CADASTRAR', 'USUARIO_EDITAR', 'USUARIO_EXCLUIR']
    },
    {
        displayName: 'Usuários',
        iconName: 'user-circle',
        bgcolor: 'primary',
        route: '/menu-level',
        requiredPermission: ['USUARIOS_VER', 'USUARIO_CADASTRAR', 'USUARIO_EDITAR', 'USUARIO_EXCLUIR'],
        children: [
            {
                displayName: 'Lista de Usuários',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/page/usuarios/listar',
                requiredPermission: ['USUARIOS_VER', 'USUARIO_CADASTRAR', 'USUARIO_EDITAR', 'USUARIO_EXCLUIR']
            },
            {
                displayName: 'Perfis e Permissões',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/page/perfil',
                requiredPermission: ['PERFIS_PERMISSOES_VER', 'PERFIS_PERMISSOES_CADASTRAR', 'PERFIS_PERMISSOES_EDITAR', 'PERFIS_PERMISSOES_EXCLUIR'],
            },
            {
                displayName: 'Novo Usuário',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/page/usuarios/novo',
                requiredPermission: ['USUARIO_CADASTRAR']
            },
        ],
    },
    {
        navCap: 'Cadastro Técnico',
        requiredPermission: [
            'GERENCIAR_PRODUTOS'
        ]
    },
    {
        displayName: 'Gerenciar Produtos',
        iconName: 'settings',
        bgcolor: 'primary',
        route: '/cadastro-tecnico',
        requiredPermission: [
            'GERENCIAR_PRODUTOS', 'SERVICOS_VER', 'SERVICOS_CADASTRAR', 'SERVICOS_EDITAR', 'SERVICOS_EXCLUIR'   
        ],
        children: [
            {
                displayName: 'Acabamentos',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/acabamentos',
                requiredPermission: ['GERENCIAR_PRODUTOS']
            },
            {
                displayName: 'Cores',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/cores',
                requiredPermission: ['GERENCIAR_PRODUTOS']
            },
            {
                displayName: 'Formatos',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/formatos',
                requiredPermission: ['GERENCIAR_PRODUTOS']
            },
            {
                displayName: 'Materiais',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/materiais',
                requiredPermission: ['GERENCIAR_PRODUTOS']
            },
            {
                displayName: 'Produtos',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/produtos',
                requiredPermission: ['GERENCIAR_PRODUTOS']
            },
            {
                displayName: 'Serviços',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/cadastro-tecnico/servico',
                requiredPermission: ['SERVICOS_VER', 'SERVICOS_CADASTRAR', 'SERVICOS_EDITAR', 'SERVICOS_EXCLUIR']
            },
            {
                displayName: 'Catálogo Onboarding',
                iconName: 'point',
                bgcolor: 'transparent',
                route: '/page/onboarding/catalogo',
                requiredPermission: ['GERENCIAR_PRODUTOS']
            }
        ]
    },    
    {
        navCap: 'Pedidos',
        requiredPermission: ['PEDIDOS_VER', 'PEDIDOS_CADASTRAR', 'PEDIDOS_EDITAR', 'PEDIDOS_EXCLUIR']
    },
    {
        displayName: 'Gerenciar Pedidos',
        iconName: 'file-text',
        bgcolor: 'primary',
        route: '/page/pedido',
        requiredPermission: ['PEDIDOS_VER', 'PEDIDOS_CADASTRAR']
    },
    {
        navCap: 'Clientes',
        requiredPermission: ['CLIENTE_VER', 'CLIENTE_CADASTRAR', 'CLIENTE_EDITAR', 'CLIENTE_EXCLUIR']
    },
    {
        displayName: 'Gerenciar Clientes',
        iconName: 'users',
        bgcolor: 'primary',
        route: '/clientes',
        requiredPermission: ['CLIENTE_VER', 'CLIENTE_CADASTRAR', 'CLIENTE_EDITAR', 'CLIENTE_EXCLUIR'],
        children: [
            {
                displayName: 'Lista de Clientes',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/page/cliente',
                requiredPermission: ['CLIENTE_VER']
            },
            {
                displayName: 'Novo Cliente',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/page/cliente/criar',
                requiredPermission: ['CLIENTE_CADASTRAR']
            }
        ]
    },
    {
        navCap: 'Home',
    },
    {
        displayName: 'Dashboard 1',
        iconName: 'layout-dashboard',
        bgcolor: 'primary',
        route: '/dashboards/dashboard1',
    },
    {
        displayName: 'Dashboard 2',
        iconName: 'chart-bar',
        bgcolor: 'accent',
        route: '/dashboards/dashboard2',
    },
    {
        navCap: 'Ajuda',
    },
    {
        displayName: 'Suporte',
        iconName: 'lifebuoy',
        bgcolor: 'primary',
        route: '/page/suporte',
    },
    {
        displayName: 'Central de ajuda',
        iconName: 'help',
        bgcolor: 'primary',
        route: '/page/ajuda',
    },
    {
        navCap: 'Apps',
    },
    {
        displayName: 'Chat',
        iconName: 'message-2',
        bgcolor: 'warning',
        route: 'apps/chat',
    },
    {
        displayName: 'Calendar',
        iconName: 'calendar-event',
        bgcolor: 'success',
        route: 'apps/calendar',
    },
    {
        displayName: 'Email',
        iconName: 'mail',
        bgcolor: 'error',
        route: 'apps/email/inbox',
    },
    {
        displayName: 'Contacts',
        iconName: 'phone',
        bgcolor: 'primary',
        route: 'apps/contacts',
    },
    {
        displayName: 'Courses',
        iconName: 'certificate',
        bgcolor: 'accent',
        route: 'apps/courses',
    },
    {
        displayName: 'Employee',
        iconName: 'brand-ctemplar',
        bgcolor: 'warning',
        route: 'apps/employee',
    },
    {
        displayName: 'Notes',
        iconName: 'note',
        bgcolor: 'success',
        route: 'apps/notes',
    },
    {
        displayName: 'Tickets',
        iconName: 'ticket',
        bgcolor: 'error',
        route: 'apps/tickets',
    },
    {
        displayName: 'Invoice',
        iconName: 'file-invoice',
        bgcolor: 'primary',
        route: 'apps/invoice',
    },
    {
        displayName: 'ToDo',
        iconName: 'edit',
        bgcolor: 'accent',
        route: 'apps/todo',
    },
    {
        displayName: 'Taskboard',
        iconName: 'checklist',
        bgcolor: 'warning',
        route: 'apps/taskboard',
    },
    {
        displayName: 'Blog',
        iconName: 'chart-donut-3',
        bgcolor: 'success',
        route: 'apps/blog',
        children: [
            {
                displayName: 'Post',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'apps/blog/post',
            },
            {
                displayName: 'Detail',
                iconName: 'point',
                bgcolor: 'tranparent',
                route:
                    'apps/blog/detail/Early Black Friday Amazon deals: cheap TVs, headphones, laptops',
            },
        ],
    },
    {
        navCap: 'Pages',
    },
    {
        displayName: 'Roll Base Access',
        iconName: 'lock-access',
        bgcolor: 'error',
        route: 'apps/permission',
    },
    {
        displayName: 'Treeview',
        iconName: 'git-merge',
        bgcolor: 'primary',
        route: 'theme-pages/treeview',
    },
    {
        displayName: 'Pricing',
        iconName: 'currency-dollar',
        bgcolor: 'accent',
        route: 'theme-pages/pricing',
    },
    {
        displayName: 'Account Setting',
        iconName: 'user-circle',
        bgcolor: 'warning',
        route: 'theme-pages/account-setting',
    },
    {
        displayName: 'FAQ',
        iconName: 'help',
        bgcolor: 'success',
        route: 'theme-pages/faq',
    },
    {
        displayName: 'Landingpage',
        iconName: 'app-window',
        bgcolor: 'error',
        route: 'landingpage',
    },
    {
        displayName: 'Widgets',
        iconName: 'layout',
        bgcolor: 'primary',
        route: 'widgets',
        children: [
            {
                displayName: 'Cards',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'widgets/cards',
            },
            {
                displayName: 'Banners',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'widgets/banners',
            },
            {
                displayName: 'Charts',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'widgets/charts',
            },
        ],
    },
    {
        navCap: 'Forms',
    },
    {
        displayName: 'Form elements',
        iconName: 'apps',
        bgcolor: 'accent',
        route: 'forms/forms-elements',
        children: [
            {
                displayName: 'Autocomplete',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'forms/forms-elements/autocomplete',
            },
            {
                displayName: 'Button',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'forms/forms-elements/button',
            },
            {
                displayName: 'Checkbox',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'forms/forms-elements/checkbox',
            },
            {
                displayName: 'Radio',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'forms/forms-elements/radio',
            },
            {
                displayName: 'Datepicker',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'forms/forms-elements/datepicker',
            },
        ],
    },
    {
        displayName: 'Form Layouts',
        iconName: 'file-description',
        bgcolor: 'warning',
        route: '/forms/form-layouts',
    },
    {
        displayName: 'Form Horizontal',
        iconName: 'box-align-bottom',
        bgcolor: 'success',
        route: '/forms/form-horizontal',
    },
    {
        displayName: 'Form Vertical',
        iconName: 'box-align-left',
        bgcolor: 'error',
        route: '/forms/form-vertical',
    },
    {
        displayName: 'Form Wizard',
        iconName: 'files',
        bgcolor: 'primary',
        route: '/forms/form-wizard',
    },
    {
        navCap: 'Tables',
    },
    {
        displayName: 'Tables',
        iconName: 'layout',
        bgcolor: 'accent',
        route: 'tables',
        children: [
            {
                displayName: 'Basic Table',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'tables/basic-table',
            },
            {
                displayName: 'Dynamic Table',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'tables/dynamic-table',
            },
            {
                displayName: 'Expand Table',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'tables/expand-table',
            },
            {
                displayName: 'Filterable Table',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'tables/filterable-table',
            },
            {
                displayName: 'Footer Row Table',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'tables/footer-row-table',
            },
            {
                displayName: 'HTTP Table',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'tables/http-table',
            },
            {
                displayName: 'Mix Table',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'tables/mix-table',
            },
            {
                displayName: 'Multi Header Footer',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'tables/multi-header-footer-table',
            },
            {
                displayName: 'Pagination Table',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'tables/pagination-table',
            },
            {
                displayName: 'Row Context Table',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'tables/row-context-table',
            },
            {
                displayName: 'Selection Table',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'tables/selection-table',
            },
            {
                displayName: 'Sortable Table',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'tables/sortable-table',
            },
            {
                displayName: 'Sticky Column',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'tables/sticky-column-table',
            },
            {
                displayName: 'Sticky Header Footer',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'tables/sticky-header-footer-table',
            },
        ],
    },
    {
        displayName: 'Data table',
        iconName: 'border-outer',
        bgcolor: 'primary',
        route: '/datatable/kichen-sink',
    },
    {
        navCap: 'Chart',
    },
    {
        displayName: 'Line',
        iconName: 'chart-line',
        bgcolor: 'warning',
        route: '/charts/line',
    },
    {
        displayName: 'Gredient',
        iconName: 'chart-arcs',
        bgcolor: 'success',
        route: '/charts/gredient',
    },
    {
        displayName: 'Area',
        iconName: 'chart-area',
        bgcolor: 'error',
        route: '/charts/area',
    },
    {
        displayName: 'Candlestick',
        iconName: 'chart-candle',
        bgcolor: 'primary',
        route: '/charts/candlestick',
    },
    {
        displayName: 'Column',
        iconName: 'chart-dots',
        bgcolor: 'accent',
        route: '/charts/column',
    },
    {
        displayName: 'Doughnut & Pie',
        iconName: 'chart-donut-3',
        bgcolor: 'warning',
        route: '/charts/doughnut-pie',
    },
    {
        displayName: 'Radialbar & Radar',
        iconName: 'chart-radar',
        bgcolor: 'success',
        route: '/charts/radial-radar',
    },
    {
        navCap: 'UI',
    },
    {
        displayName: 'Ui Components',
        iconName: 'box',
        bgcolor: 'error',
        route: 'ui-components',
        children: [
            {
                displayName: 'Badge',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/badge',
            },
            {
                displayName: 'Expansion Panel',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/expansion',
            },
            {
                displayName: 'Chips',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/chips',
            },
            {
                displayName: 'Dialog',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/dialog',
            },
            {
                displayName: 'Lists',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/lists',
            },
            {
                displayName: 'Divider',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/divider',
            },
            {
                displayName: 'Menu',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/menu',
            },
            {
                displayName: 'Paginator',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/paginator',
            },
            {
                displayName: 'Progress Bar',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/progress',
            },
            {
                displayName: 'Progress Spinner',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/progress-spinner',
            },
            {
                displayName: 'Ripples',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/ripples',
            },
            {
                displayName: 'Slide Toggle',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/slide-toggle',
            },
            {
                displayName: 'Slider',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/slider',
            },
            {
                displayName: 'Snackbar',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/snackbar',
            },
            {
                displayName: 'Tabs',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/tabs',
            },
            {
                displayName: 'Toolbar',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/toolbar',
            },
            {
                displayName: 'Tooltips',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: 'ui-components/tooltips',
            },
        ],
    },
    {
        navCap: 'Auth',
    },
    {
        displayName: 'Login',
        iconName: 'login',
        bgcolor: 'primary',
        route: '/authentication',
        children: [
            {
                displayName: 'Login',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/login',
            },
            {
                displayName: 'Boxed Login',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/login',
            },
        ],
    },
    {
        displayName: 'Register',
        iconName: 'user-plus',
        bgcolor: 'accent',
        route: '/authentication',
        children: [
            {
                displayName: 'Register',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/authentication/side-register',
            },
            {
                displayName: 'Boxed Register',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/authentication/boxed-register',
            },
        ],
    },
    {
        displayName: 'Forgot Password',
        iconName: 'rotate',
        bgcolor: 'warning',
        route: '/authentication',
        children: [
            {
                displayName: 'Side Forgot Password',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/authentication/side-forgot-pwd',
            },
            {
                displayName: 'Boxed Forgot Password',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/authentication/boxed-forgot-pwd',
            },
        ],
    },
    {
        displayName: 'Two Steps',
        iconName: 'zoom-code',
        bgcolor: 'success',
        route: '/authentication',
        children: [
            {
                displayName: 'Side Two Steps',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/authentication/side-two-steps',
            },
            {
                displayName: 'Boxed Two Steps',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/authentication/boxed-two-steps',
            },
        ],
    },
    {
        displayName: 'Error',
        iconName: 'alert-circle',
        bgcolor: 'error',
        route: '/authentication/error',
    },
    {
        displayName: 'Maintenance',
        iconName: 'settings',
        bgcolor: 'primary',
        route: '/authentication/maintenance',
    },
    {
        navCap: 'Other',
    },
    {
        displayName: 'Menu Level',
        iconName: 'box-multiple',
        bgcolor: 'accent',
        route: '/menu-level',
        children: [
            {
                displayName: 'Menu 1',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/menu-1',
                children: [
                    {
                        displayName: 'Menu 1',
                        iconName: 'point',
                        bgcolor: 'tranparent',
                        route: '/menu-1',
                    },

                    {
                        displayName: 'Menu 2',
                        iconName: 'point',
                        bgcolor: 'tranparent',
                        route: '/menu-2',
                    },
                ],
            },

            {
                displayName: 'Menu 2',
                iconName: 'point',
                bgcolor: 'tranparent',
                route: '/menu-2',
            },
        ],
    },
    {
        displayName: 'Disabled',
        iconName: 'ban',
        bgcolor: 'warning',
        route: '/disabled',
        disabled: true,
    },
    {
        displayName: 'Chip',
        iconName: 'mood-smile',
        bgcolor: 'success',
        route: '/',
        chip: true,
        chipClass: 'bg-primary text-white',
        chipContent: '9',
    },
    {
        displayName: 'Outlined',
        iconName: 'mood-smile',
        bgcolor: 'error',
        route: '/',
        chip: true,
        chipClass: 'b-1 border-primary text-primary',
        chipContent: 'outlined',
    },
    {
        displayName: 'External Link',
        iconName: 'star',
        bgcolor: 'primary',
        route: 'https://www.google.com/',
        external: true,
    },
];
