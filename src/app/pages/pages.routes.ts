import { Routes } from '@angular/router';
import { StarterComponent } from './starter/starter.component';
import { EmpresaFormComponent } from './empresa/empresa-form.component';
import { ListarUsuariosComponent } from './usuarios/listar-usuarios/listar-usuarios.component';
import { FormUsuarioComponent } from './usuarios/form-usuario/form-usuario.component';
import { FormProdutoComponent } from './cadastro-tecnico/produtos/form-produto/form-produto.component';
import { ListarCoresComponent } from './cadastro-tecnico/cores/listar-cores/listar-cores.component';
import { FormCoresComponent } from './cadastro-tecnico/cores/form-cores/form-cores.component';
import { ListarMaterialComponent } from './cadastro-tecnico/materiais/listar-material/listar-material.component';
import { FormMaterialComponent } from './cadastro-tecnico/materiais/form-material/form-material.component';
import { FormAcabamentoComponent } from './cadastro-tecnico/acabamentos/form-acabamento/form-acabamento.component';
import { ListarAcabamentoComponent } from './cadastro-tecnico/acabamentos/listar-acabamento/listar-acabamento.component';
import { FormFormatoComponent } from './cadastro-tecnico/formatos/form-formato/form-formato.component';
import { ListarFormatoComponent } from './cadastro-tecnico/formatos/listar-formato/listar-formato.component';
import { ListarProdutosComponent } from './cadastro-tecnico/produtos/listar-produtos/listar-produtos.component';
import { FormPedidoComponent } from './pedido/form-pedido/form-pedido.component';
import { ListarPedidoComponent } from './pedido/listar-pedido/listar-pedido.component';
import { FormClienteComponent } from './cliente/form-cliente/form-cliente.component';
import { ListarClienteComponent } from './cliente/listar-cliente/listar-cliente.component';
import { DetalhesPedidoComponent } from 'src/app/pages/pedido/detalhes-pedido/detalhes-pedido.component';
import { FormServicoComponent } from './cadastro-tecnico/servicos/form-servico/form-servico.component';
import { ListarServicoComponent } from './cadastro-tecnico/servicos/listar-servicos/listar-servicos.component';
import { CalculadoraConfigComponent } from './smart-calc-config/smart-calc-config/smart-calc-config.component';
import { EmailServidorComponent } from './config/email-servidor/email-servidor.component';
import { FolhaConfigComponent } from './config/folha-config/folha-config.component';
import { GerenciarPerfilComponent } from './perfil/gerenciar-perfil/gerenciar-perfil.component';
import { AjudaComponent } from './ajuda/ajuda.component';
import { ListarFuncionariosComponent } from './funcionarios/listar-funcionarios/listar-funcionarios.component';
import { FormFuncionarioComponent } from './funcionarios/form-funcionario/form-funcionario.component';
import { DetalheFuncionarioComponent } from './funcionarios/detalhe-funcionario/detalhe-funcionario.component';
import { ListarFolhaPagamentoComponent } from './pessoas/folha/listar-folha/listar-folha-pagamento.component';
import { DetalheFolhaPagamentoComponent } from './pessoas/folha/detalhe-folha/detalhe-folha-pagamento.component';
import { SuporteComponent } from './suporte/suporte.component';
import { featureModuleGuard } from '../guards/feature-module.guard';
import { permissionGuard } from '../guards/permission.guard';
import { OnboardingCatalogoAdminComponent } from './onboarding/catalogo-admin/onboarding-catalogo-admin.component';
import { ListarHomeSectionsComponent } from './site/home-sections/listar-home-sections/listar-home-sections.component';
import { FormHomeSectionComponent } from './site/home-sections/form-home-section/form-home-section.component';
import { CalculadoraMateriaisComponent } from './cadastro-tecnico/produtos/form-produto/calculadora-materiais/calculadora-materiais.component';

export const PagesRoutes: Routes = [
  {
    path: '',
    component: StarterComponent,
    data: {
      title: 'Starter Page',
    },
  },
  {
    path: 'empresa',
    component: EmpresaFormComponent,
    data: {
      title: 'Dados da Empresa',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard1' },
        { title: 'Dados da Empresa' }
      ]
    }
  },
  {
    path: 'perfil',
    component: GerenciarPerfilComponent,
    data: {
      title: 'Gerenciamento de perfil dos usuários',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard1' },
        { title: 'Gerenciamento de perfil dos usuários' }
      ]
    }
  },
  {
    path: 'ajuda',
    component: AjudaComponent,
    data: {
      title: 'Central de ajuda',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard1' },
        { title: 'Ajuda' }
      ]
    }
  },
  {
    path: 'funcionarios',
    component: ListarFuncionariosComponent,
    canActivate: [featureModuleGuard],
    data: {
      featureKey: 'funcionarios',
      title: 'Gestão de Funcionários',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard1' },
        { title: 'Funcionários' }
      ]
    }
  },
  {
    path: 'funcionarios/novo',
    component: FormFuncionarioComponent,
    canActivate: [featureModuleGuard],
    data: {
      featureKey: 'funcionarios',
      title: 'Novo Funcionário',
      urls: [
        { title: 'Funcionários', url: '/page/funcionarios' },
        { title: 'Novo Funcionário' }
      ]
    }
  },
  {
    path: 'funcionarios/editar/:id',
    component: FormFuncionarioComponent,
    canActivate: [featureModuleGuard],
    data: {
      featureKey: 'funcionarios',
      title: 'Editar Funcionário',
      urls: [
        { title: 'Funcionários', url: '/page/funcionarios' },
        { title: 'Editar Funcionário' }
      ]
    }
  },
  {
    path: 'funcionarios/detalhe/:id',
    component: DetalheFuncionarioComponent,
    canActivate: [featureModuleGuard],
    data: {
      featureKey: 'funcionarios',
      title: 'Detalhe do Funcionário',
      urls: [
        { title: 'Funcionários', url: '/page/funcionarios' },
        { title: 'Detalhe' }
      ]
    }
  },
  {
    path: 'suporte',
    component: SuporteComponent,
    data: {
      title: 'Suporte',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard1' },
        { title: 'Suporte' }
      ]
    }
  },
  {
    path: 'suporte/:id',
    component: SuporteComponent,
    data: {
      title: 'Detalhe do chamado',
      urls: [
        { title: 'Dashboard', url: '/dashboards/dashboard1' },
        { title: 'Suporte', url: '/page/suporte' },
        { title: 'Detalhe' }
      ]
    }
  },
  {
    path: 'folha-pagamento',
    component: ListarFolhaPagamentoComponent,
    canActivate: [featureModuleGuard],
    data: {
      featureKey: 'folhaPagamento',
      title: 'Folha de Pagamento',
      urls: [
        { title: 'Gestão de Pessoas', url: '/page/funcionarios' },
        { title: 'Folha de Pagamento' }
      ]
    }
  },
  {
    path: 'folha-pagamento/detalhe/:competencia/:funcionarioId',
    component: DetalheFolhaPagamentoComponent,
    canActivate: [featureModuleGuard],
    data: {
      featureKey: 'folhaPagamento',
      title: 'Detalhe da Folha',
      urls: [
        { title: 'Folha de Pagamento', url: '/page/folha-pagamento' },
        { title: 'Detalhe da Folha' }
      ]
    }
  },
  {
    path: 'config/folha-pagamento',
    component: FolhaConfigComponent,
    canActivate: [permissionGuard],
    data: {
      requiredPermission: ['FOLHA_CONFIGURAR'],
      title: 'Configuração da Folha',
      urls: [
        { title: 'Configurações', url: '/page/config/email-servidor' },
        { title: 'Configuração da Folha' }
      ]
    }
  },
  {
    path: 'usuarios/novo',
    component: FormUsuarioComponent,
    data: {
      title: 'Cadastro de novo usuário',
      urls: [
        { title: 'Novo usuário', url: '/dashboards/dashboard1' },
        { title: 'Cadastro de novo usuário' }
      ]
    }
  },
  {
    path: 'usuarios/editar/:id',
    component: FormUsuarioComponent,
    data: {
      title: 'Editar usuário',
      urls: [
        { title: 'Usuários', url: '/usuarios' },
        { title: 'Editar usuário' }
      ]
    }
  },
  {
    path: 'usuarios/listar',
    component: ListarUsuariosComponent,
    data: {
      title: 'Lista de usuários',
      urls: [
        { title: 'Lista de usuários', url: '/dashboards/dashboard1' },
        { title: 'Lista de usuários' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/cores',
    component: ListarCoresComponent,
    data: {
      title: 'Lsita de Cores',
      urls: [
        { title: 'Lsita de Cores', url: '/cadastro-tecnico' },
        { title: 'Cores' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/cores/nova',
    component: FormCoresComponent,
    data: {
      title: 'Nova Cor',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Nova Cor' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/cores/editar/:id',
    component: FormCoresComponent,
    data: {
      title: 'Editar Cor',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Editar Cor' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/materiais',
    component: ListarMaterialComponent,
    data: {
      title: 'Lista de Materiais',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Lista de Materiais' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/materiais/nova',
    component: FormMaterialComponent,
    data: {
      title: 'Novo Material',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Novo Material' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/materiais/editar/:id',
    component: FormMaterialComponent,
    data: {
      title: 'Editar Material',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Editar Material' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/acabamentos',
    component: ListarAcabamentoComponent,
    data: {
      title: 'Lista de Acabamentos',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Lista de Acabamentos' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/acabamentos/criar',
    component: FormAcabamentoComponent,
    data: {
      title: 'Novo Acabamento',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Novo Acabamento' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/acabamentos/editar/:id',
    component: FormAcabamentoComponent,
    data: {
      title: 'Editar Acabamento',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Editar Acabamento' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/formatos',
    component: ListarFormatoComponent,
    data: {
      title: 'Lista de Formatos',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Lista de Formatos' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/formatos/criar',
    component: FormFormatoComponent,
    data: {
      title: 'Novo Formato',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Novo Formato' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/formatos/editar/:id',
    component: FormFormatoComponent,
    data: {
      title: 'Editar Formato',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Editar Formato' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/produtos',
    component: ListarProdutosComponent,
    data: {
      title: 'Lista de Produtos',
      urls: [
        { title: 'Cadastro Técnico', url: '/cadastro-tecnico' },
        { title: 'Lista de Produtos' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/produtos/criar',
    component: FormProdutoComponent,
    data: {
      title: 'Criar Produto',
      urls: [
        { title: 'Lista de produtos', url: '/page/cadastro-tecnico/produtos' },
        { title: 'Criar Produto' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/produtos/editar/:id',
    component: FormProdutoComponent,
    data: {
      title: 'Editar Produto',
      urls: [
        { title: 'Lista de produtos', url: '/page/cadastro-tecnico/produtos' },
        { title: 'Editar Produto' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/servico',
    component: ListarServicoComponent,
    data: {
      title: 'Lista de Serviços',
      urls: [
        { title: 'Serviços', url: '/servico' },
        { title: 'Lista de Serviços' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/servico/criar',
    component: FormServicoComponent,
    data: {
      title: 'Criar Serviço',
      urls: [
        { title: 'Lista de Serviços', url: '/page/cadastro-tecnico/servico' },
        { title: 'Criar Serviço' }
      ]
    }
  },
  {
    path: 'cadastro-tecnico/servico/editar/:id',
    component: FormServicoComponent,
    data: {
      title: 'Editar Serviço',
      urls: [
        { title: 'Lista de Serviços', url: '/page/cadastro-tecnico/servico' },
        { title: 'Editar Serviço' }
      ]
    }
  },
  {
    path: 'pedido',
    component: ListarPedidoComponent,
    data: {
      title: 'Lista de Pedidos',
      urls: [
        { title: 'Pedidos', url: '/pedido' },
        { title: 'Lista de Pedidos' }
      ]
    }
  },
  {
    path: 'pedido/criar',
    component: FormPedidoComponent,
    data: {
      title: 'Criar Pedido',
      urls: [
        { title: 'Lista de Pedidos', url: '/page/pedido' },
        { title: 'Criar Pedido' }
      ]
    }
  },
  {
    path: 'pedido/detalhe/:id',
    component: DetalhesPedidoComponent,
    data: {
      title: 'Detalhes Pedido',
      urls: [
        { title: 'Detalhes de Pedidos', url: '/page/pedido' },
        { title: 'Detalhes Pedido' }
      ]
    }
  },
  {
    path: 'cliente',
    component: ListarClienteComponent,
    data: {
      title: 'Lista de Clientes',
      urls: [
        { title: 'Clientes', url: '/cliente' },
        { title: 'Lista de Clientes' }
      ]
    }
  },
  {
    path: 'cliente/criar',
    component: FormClienteComponent,
    data: {
      title: 'Criar Cliente',
      urls: [
        { title: 'Lista de Clientes', url: '/page/cliente' },
        { title: 'Criar Cliente' }
      ]
    }
  },
  {
    path: 'cliente/editar/:id',
    component: FormClienteComponent,
    data: {
      title: 'Editar Cliente',
      urls: [
        { title: 'Lista de Clientes', url: '/page/cliente' },
        { title: 'Editar Cliente' }
      ]
    }
  },
  {
    path: 'calculadora/config/criar',
    component: CalculadoraConfigComponent,
    data: {
      title: 'Configuração SmartCalc',
      urls: [
        { title: 'Configuração SmartCalc', url: '/page/calculadora/config' },
        { title: 'Configuração SmartCalc' }
      ]
    }
  },
  {
    path: 'calculadora/config/editar/:id',
    component: CalculadoraConfigComponent,
    data: {
      title: 'Editar Configuração',
      urls: [
        { title: 'Lista de Configurações', url: '/page/calculadora/config' },
        { title: 'Editar Configuração' }
      ]
    }
  },
  {
    path: 'calculadora-materiais',
    component: CalculadoraMateriaisComponent,
    canActivate: [featureModuleGuard],
    data: {
      featureKey: 'CALCULADORA_MATERIAIS',
      requiredPermission: ['CONFIG_CALCULADORAS'],
      title: 'Calculadora de Materiais',
      urls: [
        { title: 'Dashboard', url: '/dashboard' },
        { title: 'Calculadora de Materiais' }
      ]
    }
  },
  {
    path: 'onboarding/catalogo',
    component: OnboardingCatalogoAdminComponent,
    canActivate: [permissionGuard],
    data: {
      requiredPermission: ['GERENCIAR_PRODUTOS'],
      title: 'Catálogo do Onboarding',
      urls: [
        { title: 'Gerenciar Produtos', url: '/page/cadastro-tecnico/produtos' },
        { title: 'Catálogo do Onboarding' }
      ]
    }
  },
  {
    path: 'site/home-sections',
    component: ListarHomeSectionsComponent,
    canActivate: [permissionGuard],
    data: {
      requiredPermission: ['SITE_HOME_SECTIONS_VER'],
      title: 'Seções da Home',
      urls: [
        { title: 'Meu Site', url: '/page/site/home-sections' },
        { title: 'Seções da Home' }
      ]
    }
  },
  {
    path: 'site/home-sections/novo',
    component: FormHomeSectionComponent,
    canActivate: [permissionGuard],
    data: {
      requiredPermission: ['SITE_HOME_SECTIONS_CADASTRAR'],
      title: 'Nova seção da Home',
      urls: [
        { title: 'Meu Site', url: '/page/site/home-sections' },
        { title: 'Nova seção' }
      ]
    }
  },
  {
    path: 'site/home-sections/editar/:id',
    component: FormHomeSectionComponent,
    canActivate: [permissionGuard],
    data: {
      requiredPermission: ['SITE_HOME_SECTIONS_EDITAR'],
      title: 'Editar seção da Home',
      urls: [
        { title: 'Meu Site', url: '/page/site/home-sections' },
        { title: 'Editar seção' }
      ]
    }
  },
  {
    path: 'config/email-servidor',
    component: EmailServidorComponent,
    data: {
      title: 'Servidor de E-mail',
      urls: [
        { title: 'Configurações', url: '/dashboards/dashboard1' },
        { title: 'Servidor de E-mail' }
      ]
    }
  }
];
