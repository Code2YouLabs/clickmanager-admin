import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr.service';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { MaterialModule } from 'src/app/material.module';
import { AdminDisplayModeService } from 'src/app/services/admin-display-mode.service';
import {
  AdminLeadsResumoResponse,
  AdminLeadResumo
} from '../../leads/models/admin-lead.model';
import { AdminLeadsService } from '../../leads/services/admin-leads.service';
import { AdminLandingAcessosResumoResponse } from '../../landing-acessos/models/admin-landing-acesso.model';
import { AdminLandingAcessosService } from '../../landing-acessos/services/admin-landing-acessos.service';
import { AdminPagamentosResumoResponse } from '../../pagamentos/models/admin-pagamento.model';
import { AdminPagamentosService } from '../../pagamentos/services/admin-pagamentos.service';
import { AuthService } from 'src/app/services/auth.service';
import {
  AdminDashboardAtividadeRecente,
  AdminDashboardChamadoRecente,
  AdminDashboardClienteObservacao,
  AdminDashboardCrescimentoCliente,
  AdminDashboardModulo,
  AdminDashboardResumoResponse
} from '../models/admin-dashboard.model';
import { AdminDashboardService } from '../services/admin-dashboard.service';

type DashboardMetric = {
  label: string;
  value: string;
  delta: string;
  icon: string;
  tone: 'primary' | 'success' | 'warning' | 'info';
  helper: string;
};

type DashboardModuleView = AdminDashboardModulo & {
  rota?: string;
};

type DashboardGrowthView = {
  mes: string;
  novos: number;
  total: number;
  altura: number;
  receita: string;
};

type DashboardGrowthFocusView = {
  titulo: string;
  valor: string;
  tendencia: string;
  resumo: string;
  tone: 'primary' | 'success' | 'warning';
};

type DashboardLeadMetric = {
  label: string;
  value: number;
  helper: string;
  tone: 'neutral' | 'contact' | 'qualified' | 'converted';
};

type DashboardPaymentMetric = {
  label: string;
  value: string;
  helper: string;
  tone: 'received' | 'pending' | 'approved' | 'refunded';
};

type DashboardLandingMetric = {
  label: string;
  value: string;
  helper: string;
  tone: 'traffic' | 'interest' | 'lead' | 'conversion';
};

type DashboardLandingFunnelRead = {
  label: string;
  value: string;
  helper: string;
};

@Component({
  selector: 'app-dashboard1',
  standalone: true,
  imports: [CommonModule, RouterModule, DesignSystemIconsModule, MaterialModule],
  templateUrl: './dashboard1.component.html',
  styleUrl: './dashboard1.component.scss'
})
export class AppDashboard1Component implements OnInit {
  carregandoDashboard = false;
  carregandoLeads = false;
  carregandoPagamentos = false;
  carregandoLandingAcessos = false;
  readonly landingDataInicio = this.dataIsoInicioMesAtual();
  readonly landingDataFim = this.dataIsoHoje();
  erroCarregamento = '';
  dashboard: AdminDashboardResumoResponse | null = null;
  leadsResumo: AdminLeadsResumoResponse = {
    novos: 0,
    emContato: 0,
    qualificados: 0,
    convertidos: 0
  };
  pagamentosResumo: AdminPagamentosResumoResponse = {
    totalRecebido: 0,
    totalEstornado: 0,
    pendentes: 0,
    aprovados: 0,
    recusados: 0,
    cancelados: 0,
    estornados: 0,
    chargebacks: 0,
    ultimoRecebimentoEm: null
  };
  landingResumo: AdminLandingAcessosResumoResponse = {
    totalAcessos: 0,
    baseTotalAcessos: 'Evento bruto',
    visitantesUnicos: 0,
    totalLeads: 0,
    taxaConversaoPercentual: 0,
    visitantesLanding: 0,
    baseVisitantesLanding: 'Visitante unico',
    visitantesFormulario: 0,
    baseVisitantesFormulario: 'Visitante unico',
    formulariosConcluidos: 0,
    baseFormulariosConcluidos: 'Visitante unico',
    taxaVisitaParaFormularioPercentual: 0,
    taxaConclusaoFormularioPercentual: 0,
    taxaConclusaoSobreLandingPercentual: 0,
    desktop: 0,
    mobile: 0,
    tablet: 0,
    bots: 0,
    outros: 0,
    baseDispositivos: 'Visitante unico',
    navegadores: [],
    sistemasOperacionais: [],
    origens: []
  };
  leadsRecentes: AdminLeadResumo[] = [];

  constructor(
    private readonly authService: AuthService,
    private readonly dashboardService: AdminDashboardService,
    private readonly leadsService: AdminLeadsService,
    private readonly landingAcessosService: AdminLandingAcessosService,
    private readonly pagamentosService: AdminPagamentosService,
    private readonly toastr: ToastrService,
    private readonly displayModeService: AdminDisplayModeService
  ) {}

  ngOnInit(): void {
    this.carregarDashboard();
    this.carregarLeads();
    this.carregarLandingAcessos();
    this.carregarPagamentos();
  }

  carregarDashboard(): void {
    this.carregandoDashboard = true;
    this.erroCarregamento = '';

    this.dashboardService.buscarResumo$()
      .pipe(finalize(() => (this.carregandoDashboard = false)))
      .subscribe({
        next: (resumo) => {
          this.dashboard = resumo;
        },
        error: (err) => {
          this.erroCarregamento = err?.userMessage || 'Não foi possível carregar o dashboard.';
          this.toastr.error(this.erroCarregamento);
        }
      });
  }

  carregarLeads(): void {
    this.carregandoLeads = true;

    forkJoin({
      resumo: this.leadsService.buscarResumo$(),
      recentes: this.leadsService.listar$({ pagina: 0, tamanho: 4 })
    })
      .pipe(finalize(() => (this.carregandoLeads = false)))
      .subscribe({
        next: ({ resumo, recentes }) => {
          this.leadsResumo = resumo;
          this.leadsRecentes = recentes.itens || [];
        },
        error: (err) => {
          this.toastr.warning(err?.userMessage || 'Não foi possível carregar o resumo de leads.');
        }
      });
  }

  carregarPagamentos(): void {
    this.carregandoPagamentos = true;

    this.pagamentosService.buscarResumo$()
      .pipe(finalize(() => (this.carregandoPagamentos = false)))
      .subscribe({
        next: (resumo) => {
          this.pagamentosResumo = resumo;
        },
        error: (err) => {
          this.toastr.warning(err?.userMessage || 'Não foi possível carregar o resumo de pagamentos.');
        }
      });
  }

  get landingPeriodoLabel(): string {
    return `${this.formatarDataCurta(this.landingDataInicio)} até ${this.formatarDataCurta(this.landingDataFim)}`;
  }

  carregarLandingAcessos(): void {
    this.carregandoLandingAcessos = true;

    this.landingAcessosService.buscarResumo$({
      dataInicio: this.landingDataInicio,
      dataFim: this.landingDataFim
    })
      .pipe(finalize(() => (this.carregandoLandingAcessos = false)))
      .subscribe({
        next: (resumo) => {
          this.landingResumo = resumo;
        },
        error: (err) => {
          this.toastr.warning(err?.userMessage || 'Não foi possível carregar o resumo de acessos da landing.');
        }
      });
  }

  saudacao(): string {
    const nome = this.authService.getUsuarioNome()?.trim();
    if (!nome) {
      return 'Painel de operação';
    }

    return `Olá, ${nome.split(' ')[0]}`;
  }

  get periodoReferencia(): string {
    return this.dashboard?.periodo.referencia || 'período atual';
  }

  get modoPainelAtivo(): boolean {
    return this.displayModeService.painelAtivo;
  }

  sairModoPainel(): void {
    this.displayModeService.setPainelAtivo(false);

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    }
  }

  get metricas(): DashboardMetric[] {
    const visao = this.dashboard?.visaoGeral;
    if (!visao) {
      return [];
    }

    return [
      {
        label: 'Clientes monitorados',
        value: String(visao.totalClientes),
        delta: `${visao.novosClientesMes} novo(s) no mês`,
        icon: 'building-store',
        tone: 'primary',
        helper: 'base total acompanhada pelo admin neste período'
      },
      {
        label: 'Clientes ativos',
        value: String(visao.clientesAtivos),
        delta: `${this.dashboard?.crescimentoInsights.clientesEmOnboarding || 0} em onboarding`,
        icon: 'rocket',
        tone: 'success',
        helper: 'contas já em uso ou em ativação assistida'
      },
      {
        label: 'Usuários provisionados',
        value: String(visao.usuariosProvisionados),
        delta: 'acessos liberados na base atual',
        icon: 'users-group',
        tone: 'info',
        helper: 'usuários prontos para operação, gestão e apoio'
      },
      {
        label: 'Pendências críticas',
        value: String(visao.pendenciasCriticas),
        delta: `${this.dashboard?.crescimentoInsights.clientesEmRisco || 0} cliente(s) em risco`,
        icon: 'alert-triangle',
        tone: 'warning',
        helper: 'pontos que podem frear ativação, retenção ou suporte'
      }
    ];
  }

  get modulos(): DashboardModuleView[] {
    return (this.dashboard?.modulos || []).map((modulo) => ({
      ...modulo,
      rota: /admin|suporte/i.test(modulo.nome) ? '/chamados' : undefined
    }));
  }

  get atividades(): Array<AdminDashboardAtividadeRecente & { tag: string; momento: string }> {
    return (this.dashboard?.atividadesRecentes || []).map((atividade) => ({
      ...atividade,
      tag: this.atividadeLabel(atividade.tipo),
      momento: this.dataRelativa(atividade.ocorreuEm)
    }));
  }

  get observacaoOperacional(): AdminDashboardClienteObservacao[] {
    return this.dashboard?.clientesEmObservacao || [];
  }

  get filaSuporte(): Array<AdminDashboardChamadoRecente & { idade: string }> {
    return (this.dashboard?.chamadosRecentes || []).map((chamado) => ({
      ...chamado,
      idade: this.dataRelativa(chamado.atualizadoEm)
    }));
  }

  get crescimentoClientes(): DashboardGrowthView[] {
    const itens = this.dashboard?.crescimentoClientes || [];
    const maximo = itens.reduce((acc, item) => Math.max(acc, item.totalClientesAtivos), 0) || 1;

    return itens.map((item) => ({
      mes: this.formatarMes(item),
      novos: item.novosClientes,
      total: item.totalClientesAtivos,
      altura: Math.max(18, Math.round((item.totalClientesAtivos / maximo) * 100)),
      receita: this.formatarMoeda(item.mrr)
    }));
  }

  get focosCrescimento(): DashboardGrowthFocusView[] {
    const growth = this.dashboard?.crescimentoInsights;
    const visao = this.dashboard?.visaoGeral;
    if (!growth || !visao) {
      return [];
    }

    const variacao = growth.variacaoNovosClientesPercentual;
    return [
      {
        titulo: 'Aquisição do mês',
        valor: `${visao.novosClientesMes} novo(s) cliente(s)`,
        tendencia: `${variacao >= 0 ? '+' : ''}${variacao}% vs. período anterior`,
        resumo: 'Entrada recente de contas para validar se o comercial está gerando crescimento sustentável.',
        tone: variacao >= 0 ? 'success' : 'warning'
      },
      {
        titulo: 'Expansão da base',
        valor: `${growth.clientesEmOnboarding} em onboarding`,
        tendencia: 'pipeline de ativação',
        resumo: 'Contas que já entraram e agora dependem de setup, treinamento e primeira entrega de valor.',
        tone: 'primary'
      },
      {
        titulo: 'Risco de churn inicial',
        valor: `${growth.clientesEmRisco} conta(s) em risco`,
        tendencia: growth.clientesEmRisco > 0 ? 'ação recomendada' : 'sob controle',
        resumo: 'Leitura rápida das contas que precisam de acompanhamento para não comprometer a curva de crescimento.',
        tone: growth.clientesEmRisco > 0 ? 'warning' : 'success'
      }
    ];
  }

  get saudeOperacaoPercentual(): number {
    return this.dashboard?.visaoGeral.saudeOperacaoPercentual || 0;
  }

  get saudeStatusLabel(): string {
    if (this.saudeOperacaoPercentual >= 85) {
      return 'Verde';
    }
    if (this.saudeOperacaoPercentual >= 70) {
      return 'Atenção';
    }
    return 'Risco';
  }

  get saudeResumo(): string {
    if (this.saudeOperacaoPercentual >= 85) {
      return 'Operação estável, com crescimento sustentado e sem bloqueios críticos.';
    }
    if (this.saudeOperacaoPercentual >= 70) {
      return 'Operação saudável, mas alguns gargalos já pedem ação do admin.';
    }
    return 'Há riscos operacionais que podem comprometer ativação, retenção ou suporte.';
  }

  get variacaoCrescimentoLabel(): string {
    const variacao = this.dashboard?.crescimentoInsights.variacaoNovosClientesPercentual || 0;
    return `${variacao >= 0 ? '+' : ''}${variacao}% no ritmo de entrada`;
  }

  get resumoSuporte(): string {
    const suporte = this.dashboard?.suporteResumo;
    if (!suporte) {
      return '';
    }

    return `${suporte.abertos} abertos, ${suporte.urgentes} urgentes, ${suporte.semRespostaAdmin} sem resposta do admin`;
  }

  get metricasLeads(): DashboardLeadMetric[] {
    return [
      {
        label: 'Novos',
        value: this.leadsResumo.novos,
        helper: 'aguardando triagem',
        tone: 'neutral'
      },
      {
        label: 'Em contato',
        value: this.leadsResumo.emContato,
        helper: 'em abordagem comercial',
        tone: 'contact'
      },
      {
        label: 'Qualificados',
        value: this.leadsResumo.qualificados,
        helper: 'bons candidatos',
        tone: 'qualified'
      },
      {
        label: 'Convertidos',
        value: this.leadsResumo.convertidos,
        helper: 'já migraram para cliente',
        tone: 'converted'
      }
    ];
  }

  get metricasPagamentos(): DashboardPaymentMetric[] {
    return [
      {
        label: 'Total recebido',
        value: this.formatarMoedaFinanceira(this.pagamentosResumo.totalRecebido),
        helper: `${this.pagamentosResumo.aprovados} pagamento(s) aprovado(s)`,
        tone: 'received'
      },
      {
        label: 'Pendentes',
        value: String(this.pagamentosResumo.pendentes),
        helper: 'aguardando confirmação',
        tone: 'pending'
      },
      {
        label: 'Aprovados',
        value: String(this.pagamentosResumo.aprovados),
        helper: this.pagamentosResumo.ultimoRecebimentoEm
          ? `último recebimento ${this.dataRelativa(this.pagamentosResumo.ultimoRecebimentoEm)}`
          : 'sem recebimento recente',
        tone: 'approved'
      },
      {
        label: 'Estornados',
        value: this.formatarMoedaFinanceira(this.pagamentosResumo.totalEstornado),
        helper: `${this.pagamentosResumo.estornados} estorno(s) registrado(s)`,
        tone: 'refunded'
      }
    ];
  }

  get metricasLanding(): DashboardLandingMetric[] {
    return [
      {
        label: 'Visualizações',
        value: this.formatarInteiro(this.landingResumo.totalAcessos),
        helper: `base: ${this.formatarBase(this.landingResumo.baseTotalAcessos)}`,
        tone: 'traffic'
      },
      {
        label: 'Visitantes únicos',
        value: this.formatarInteiro(this.landingResumo.visitantesLanding),
        helper: `base: ${this.formatarBase(this.landingResumo.baseVisitantesLanding)}`,
        tone: 'interest'
      },
      {
        label: 'Formulário',
        value: this.formatarInteiro(this.landingResumo.visitantesFormulario),
        helper: `base: ${this.formatarBase(this.landingResumo.baseVisitantesFormulario)}`,
        tone: 'interest'
      },
      {
        label: 'Cadastros',
        value: this.formatarInteiro(this.landingResumo.formulariosConcluidos),
        helper: `base: ${this.formatarBase(this.landingResumo.baseFormulariosConcluidos)}`,
        tone: 'lead'
      },
      {
        label: 'Conversão final',
        value: `${this.landingResumo.taxaConclusaoSobreLandingPercentual.toFixed(2)}%`,
        helper: 'landing para cadastro concluído',
        tone: 'conversion'
      }
    ];
  }

  get leiturasFunilLanding(): DashboardLandingFunnelRead[] {
    return [
      {
        label: 'Visita > formulário',
        value: `${this.landingResumo.taxaVisitaParaFormularioPercentual.toFixed(2)}%`,
        helper: 'quanto do tráfego demonstra intenção'
      },
      {
        label: 'Formulário > conclusão',
        value: `${this.landingResumo.taxaConclusaoFormularioPercentual.toFixed(2)}%`,
        helper: 'eficiência da etapa final'
      },
      {
        label: 'Mobile no funil',
        value: this.formatarInteiro(this.landingResumo.mobile),
        helper: `base de dispositivos: ${this.formatarBase(this.landingResumo.baseDispositivos)}`
      }
    ];
  }

  get landingDispositivos(): Array<{ label: string; quantidade: number }> {
    return [
      { label: 'Desktop', quantidade: this.landingResumo.desktop },
      { label: 'Mobile', quantidade: this.landingResumo.mobile },
      { label: 'Tablet', quantidade: this.landingResumo.tablet },
      { label: 'Bots', quantidade: this.landingResumo.bots },
      { label: 'Outros', quantidade: this.landingResumo.outros }
    ];
  }

  get landingOrigensTop(): Array<{ nome: string; quantidade: number }> {
    return this.landingResumo.origens.slice(0, 3);
  }

  get landingBaseDispositivosLabel(): string {
    return this.formatarBase(this.landingResumo.baseDispositivos);
  }

  moduloClass(status: string): string {
    const normalized = status.toUpperCase();
    if (normalized.includes('OPERACIONAL')) return 'status-operacional';
    if (normalized.includes('EXPANSAO')) return 'status-expansao';
    return 'status-mvp';
  }

  prioridadeClass(prioridade: string): string {
    const normalized = prioridade.toLowerCase();
    if (normalized === 'alta' || normalized === 'urgente') return 'priority-high';
    if (normalized === 'media') return 'priority-medium';
    return 'priority-low';
  }

  crescimentoClass(tone: DashboardGrowthFocusView['tone']): string {
    return `growth-${tone}`;
  }

  leadMetricClass(tone: DashboardLeadMetric['tone']): string {
    return `lead-${tone}`;
  }

  leadStatusLabel(status: string): string {
    return {
      NOVO: 'Novo',
      EM_CONTATO: 'Em contato',
      QUALIFICADO: 'Qualificado',
      CONVERTIDO: 'Convertido',
      DESCARTADO: 'Descartado'
    }[String(status || '').toUpperCase()] || status;
  }

  origemLeadLabel(origem: string): string {
    return {
      NEWSLETTER: 'Newsletter',
      FORM_CONTATO: 'Formulário',
      CTA_DEMO: 'CTA Demo',
      WHATSAPP: 'WhatsApp'
    }[String(origem || '').toUpperCase()] || origem;
  }

  leadStatusClass(status: string): string {
    return `status-${String(status || '').toLowerCase()}`;
  }

  paymentMetricClass(tone: DashboardPaymentMetric['tone']): string {
    return `payment-${tone}`;
  }

  landingMetricClass(tone: DashboardLandingMetric['tone']): string {
    return `landing-${tone}`;
  }

  private formatarBase(base?: string | null): string {
    if (!base?.trim()) {
      return 'nao informada';
    }

    return base
      .replace(/_/g, ' ')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\bunico\b/g, 'unico')
      .trim();
  }

  private atividadeLabel(tipo: string): string {
    return {
      ONBOARDING: 'Onboarding',
      ACESSO: 'Acesso',
      DEPLOY: 'Deploy',
      SUPORTE: 'Suporte',
      COMERCIAL: 'Comercial'
    }[String(tipo || '').toUpperCase()] || 'Operação';
  }

  dataRelativa(iso?: string | null): string {
    if (!iso) {
      return 'Agora';
    }

    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'Agora';
    if (min < 60) return `${min} min atrás`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h atrás`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} dia(s) atrás`;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  private formatarMes(item: AdminDashboardCrescimentoCliente): string {
    const mes = String(item.mes || '').trim();
    if (/^\d+$/.test(mes)) {
      const data = new Date(item.ano || new Date().getFullYear(), Number(mes) - 1, 1);
      return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(data).replace('.', '');
    }

    return mes.slice(0, 3);
  }

  private formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(valor || 0);
  }

  private formatarMoedaFinanceira(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  }

  private formatarInteiro(valor: number): string {
    return new Intl.NumberFormat('pt-BR').format(valor || 0);
  }

  private formatarDataCurta(iso: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    }).format(new Date(`${iso}T00:00:00`));
  }

  private dataIsoHoje(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private dataIsoInicioMesAtual(): string {
    const data = new Date();
    data.setDate(1);
    return data.toISOString().slice(0, 10);
  }
}
