import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr.service';
import { finalize } from 'rxjs/operators';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { MaterialModule } from 'src/app/material.module';
import {
  AdminLandingAcessoDeviceType,
  AdminLandingAcessoEtapaFunil,
  AdminLandingAcessoItemResponse,
  AdminLandingAcessosResumoResponse,
  AdminLandingQuantidadeItem,
  AdminListaLandingAcessosResponse
} from './models/admin-landing-acesso.model';
import { AdminLandingAcessosService } from './services/admin-landing-acessos.service';

type LandingResumoCard = {
  label: string;
  value: string;
  helper: string;
  tone: 'primary' | 'success' | 'warning' | 'info';
};

type LandingTaxaCard = {
  label: string;
  value: string;
  helper: string;
};

type LandingFunilStep = {
  label: string;
  value: string;
  helper: string;
};

@Component({
  selector: 'app-landing-acessos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DesignSystemIconsModule, MaterialModule],
  templateUrl: './landing-acessos-admin.component.html',
  styleUrl: './landing-acessos-admin.component.scss'
})
export class LandingAcessosAdminComponent implements OnInit {
  readonly deviceOptions: Array<AdminLandingAcessoDeviceType | 'TODOS'> = [
    'TODOS',
    'DESKTOP',
    'MOBILE',
    'TABLET',
    'BOT',
    'OUTRO'
  ];
  readonly etapaOptions: Array<AdminLandingAcessoEtapaFunil | 'TODAS'> = [
    'TODAS',
    'LANDING_VISUALIZADA',
    'FORMULARIO_VISUALIZADO',
    'FORMULARIO_CONCLUIDO'
  ];

  carregandoResumo = false;
  carregandoLista = false;

  busca = '';
  deviceTypeFiltro: AdminLandingAcessoDeviceType | 'TODOS' = 'TODOS';
  etapaFunilFiltro: AdminLandingAcessoEtapaFunil | 'TODAS' = 'TODAS';
  dataInicio = this.dataIsoDiasAtras(6);
  dataFim = this.dataIsoHoje();
  pagina = 0;
  tamanho = 20;
  totalItens = 0;
  totalPaginas = 0;

  resumo: AdminLandingAcessosResumoResponse = {
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

  acessos: AdminLandingAcessoItemResponse[] = [];

  constructor(
    private readonly landingAcessosService: AdminLandingAcessosService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.carregarResumo();
    this.carregarLista();
  }

  aplicarFiltros(): void {
    this.pagina = 0;
    this.carregarResumo();
    this.carregarLista();
  }

  limparFiltros(): void {
    this.busca = '';
    this.deviceTypeFiltro = 'TODOS';
    this.etapaFunilFiltro = 'TODAS';
    this.dataInicio = this.dataIsoDiasAtras(6);
    this.dataFim = this.dataIsoHoje();
    this.pagina = 0;
    this.carregarLista();
    this.carregarResumo();
  }

  alterarPagina(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanho = event.pageSize;
    this.carregarLista();
  }

  get resumoCards(): LandingResumoCard[] {
    return [
      {
        label: 'Visualizações da landing',
        value: this.formatarNumero(this.resumo.totalAcessos),
        helper: `base: ${this.formatarBase(this.resumo.baseTotalAcessos)}`,
        tone: 'primary'
      },
      {
        label: 'Visitantes únicos',
        value: this.formatarNumero(this.resumo.visitantesLanding),
        helper: `base: ${this.formatarBase(this.resumo.baseVisitantesLanding)}`,
        tone: 'info'
      },
      {
        label: 'Formulário visualizado',
        value: this.formatarNumero(this.resumo.visitantesFormulario),
        helper: `base: ${this.formatarBase(this.resumo.baseVisitantesFormulario)}`,
        tone: 'info'
      },
      {
        label: 'Cadastros concluídos',
        value: this.formatarNumero(this.resumo.formulariosConcluidos),
        helper: `base: ${this.formatarBase(this.resumo.baseFormulariosConcluidos)}`,
        tone: 'success'
      }
    ];
  }

  get taxasResumo(): LandingTaxaCard[] {
    return [
      {
        label: 'Visita > formulário',
        value: `${this.resumo.taxaVisitaParaFormularioPercentual.toFixed(2)}%`,
        helper: 'avanço da landing para intenção'
      },
      {
        label: 'Formulário > conclusão',
        value: `${this.resumo.taxaConclusaoFormularioPercentual.toFixed(2)}%`,
        helper: 'eficiência da etapa final'
      },
      {
        label: 'Landing > conclusão',
        value: `${this.resumo.taxaConclusaoSobreLandingPercentual.toFixed(2)}%`,
        helper: 'conversão final do funil'
      }
    ];
  }

  get etapasFunil(): LandingFunilStep[] {
    return [
      {
        label: 'Landing visualizada',
        value: this.formatarNumero(this.resumo.visitantesLanding),
        helper: `base: ${this.formatarBase(this.resumo.baseVisitantesLanding)}`
      },
      {
        label: 'Formulário visualizado',
        value: this.formatarNumero(this.resumo.visitantesFormulario),
        helper: `base: ${this.formatarBase(this.resumo.baseVisitantesFormulario)}`
      },
      {
        label: 'Formulário concluído',
        value: this.formatarNumero(this.resumo.formulariosConcluidos),
        helper: `base: ${this.formatarBase(this.resumo.baseFormulariosConcluidos)}`
      }
    ];
  }

  get dispositivos(): Array<{ label: string; quantidade: number; tone: string }> {
    return [
      { label: 'Desktop', quantidade: this.resumo.desktop, tone: 'primary' },
      { label: 'Mobile', quantidade: this.resumo.mobile, tone: 'success' },
      { label: 'Tablet', quantidade: this.resumo.tablet, tone: 'info' },
      { label: 'Bots', quantidade: this.resumo.bots, tone: 'warning' },
      { label: 'Outros', quantidade: this.resumo.outros, tone: 'neutral' }
    ];
  }

  get navegadoresTop(): AdminLandingQuantidadeItem[] {
    return this.resumo.navegadores.slice(0, 5);
  }

  get sistemasTop(): AdminLandingQuantidadeItem[] {
    return this.resumo.sistemasOperacionais.slice(0, 5);
  }

  get origensTop(): AdminLandingQuantidadeItem[] {
    return this.resumo.origens.slice(0, 5);
  }

  get resumoResultados(): string {
    return `${this.totalItens} acesso(s) encontrado(s)`;
  }

  get periodoSelecionadoLabel(): string {
    return `${this.formatarDataCurta(this.dataInicio)} até ${this.formatarDataCurta(this.dataFim)}`;
  }

  get baseDispositivosLabel(): string {
    return this.formatarBase(this.resumo.baseDispositivos);
  }

  etapaFunilLabel(etapa: AdminLandingAcessoEtapaFunil): string {
    return {
      LANDING_VISUALIZADA: 'Landing visualizada',
      FORMULARIO_VISUALIZADO: 'Formulário visualizado',
      FORMULARIO_CONCLUIDO: 'Formulário concluído'
    }[etapa];
  }

  etapaFunilClass(etapa: AdminLandingAcessoEtapaFunil): string {
    return `funnel-${etapa.toLowerCase()}`;
  }

  deviceLabel(deviceType: AdminLandingAcessoDeviceType): string {
    return {
      DESKTOP: 'Desktop',
      MOBILE: 'Mobile',
      TABLET: 'Tablet',
      BOT: 'Bot',
      OUTRO: 'Outro'
    }[deviceType];
  }

  deviceClass(deviceType: AdminLandingAcessoDeviceType): string {
    return `device-${deviceType.toLowerCase()}`;
  }

  utmLabel(item: AdminLandingAcessoItemResponse): string {
    const partes = [item.utmSource, item.utmMedium, item.utmCampaign].filter(Boolean);
    return partes.length ? partes.join(' / ') : 'Sem UTM';
  }

  origemLabel(item: AdminLandingAcessoItemResponse): string {
    return item.referrer || item.utmSource || 'Direto';
  }

  formatarData(iso: string): string {
    if (!iso) {
      return 'Sem data';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(iso));
  }

  formatarDataCurta(iso?: string | null): string {
    if (!iso) {
      return 'sem data';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(`${iso}T00:00:00`));
  }

  itemPercentual(item: AdminLandingQuantidadeItem[], quantidade: number): number {
    const base = item.reduce((acc, atual) => Math.max(acc, atual.quantidade), 0) || 1;
    return Math.max(10, Math.round((quantidade / base) * 100));
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

  private carregarResumo(): void {
    this.carregandoResumo = true;
    this.landingAcessosService.buscarResumo$({
      dataInicio: this.dataInicio,
      dataFim: this.dataFim
    })
      .pipe(finalize(() => (this.carregandoResumo = false)))
      .subscribe({
        next: (resumo) => {
          this.resumo = resumo;
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar o resumo de acessos da landing.');
        }
      });
  }

  private carregarLista(): void {
    this.carregandoLista = true;

    this.landingAcessosService.listar$({
      busca: this.busca || null,
      deviceType: this.deviceTypeFiltro === 'TODOS' ? null : this.deviceTypeFiltro,
      etapaFunil: this.etapaFunilFiltro === 'TODAS' ? null : this.etapaFunilFiltro,
      dataInicio: this.dataInicio,
      dataFim: this.dataFim,
      pagina: this.pagina,
      tamanho: this.tamanho
    })
      .pipe(finalize(() => (this.carregandoLista = false)))
      .subscribe({
        next: (res: AdminListaLandingAcessosResponse) => {
          this.acessos = res.itens || [];
          this.pagina = res.pagina;
          this.tamanho = res.tamanho;
          this.totalItens = res.totalItens;
          this.totalPaginas = res.totalPaginas;
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar a lista de acessos da landing.');
        }
      });
  }

  private formatarNumero(valor: number): string {
    return new Intl.NumberFormat('pt-BR').format(valor || 0);
  }

  private dataIsoHoje(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private dataIsoDiasAtras(dias: number): string {
    const data = new Date();
    data.setDate(data.getDate() - dias);
    return data.toISOString().slice(0, 10);
  }
}
