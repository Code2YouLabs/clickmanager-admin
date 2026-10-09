import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import {
  AdminAdocaoFunilEtapa,
  AdminAdocaoFunilEtapaCodigo,
  AdminAdocaoFunilFiltro,
  AdminAdocaoFunilMetricaTtv,
  AdminAdocaoFunilResponse,
  AdminAdocaoSegmento
} from './models/admin-adocao-funil.model';
import { AdminAdocaoService } from './services/admin-adocao.service';

interface ResumoCard {
  label: string;
  valor: string;
  apoio: string;
  tone: 'base' | 'success' | 'info' | 'soft';
}

@Component({
  selector: 'app-adocao-funil',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TablerIconsModule, MaterialModule],
  templateUrl: './adocao-funil.component.html',
  styleUrl: './adocao-funil.component.scss'
})
export class AdocaoFunilComponent implements OnInit, OnDestroy {
  readonly segmentoOptions: AdminAdocaoSegmento[] = ['GRAFICA'];
  readonly hojeIso = this.toIsoDate(new Date());

  inicio = '';
  fim = '';
  segmento: AdminAdocaoSegmento = 'GRAFICA';

  carregando = false;
  erro = '';
  erroPeriodo = '';
  funil: AdminAdocaoFunilResponse | null = null;

  private readonly destroy$ = new Subject<void>();
  private requestId = 0;

  constructor(
    private readonly adocaoService: AdminAdocaoService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.aplicarParams(params);
        this.carregarFunil();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  aplicarFiltros(): void {
    if (!this.periodoValido()) {
      return;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        inicio: this.inicio,
        fim: this.fim,
        segmento: this.segmento
      },
      queryParamsHandling: 'merge'
    });
  }

  tentarNovamente(): void {
    this.carregarFunil();
  }

  get coorteVazia(): boolean {
    return Boolean(this.funil && this.funil.coorte.totalEmpresas === 0);
  }

  get resumoCards(): ResumoCard[] {
    const ativada = this.etapaPorCodigo('ATIVADA');
    const ttvCriacao = this.funil?.timeToValue.desdeCriacao;

    return [
      {
        label: 'Empresas na coorte',
        valor: String(this.funil?.coorte.totalEmpresas ?? 0),
        apoio: 'criadas no período',
        tone: 'base'
      },
      {
        label: 'Ativadas',
        valor: String(ativada?.quantidade ?? 0),
        apoio: 'atingiram a política atual',
        tone: 'success'
      },
      {
        label: 'Conversão total',
        valor: this.formatarPercentual(ativada?.percentualDoTotal ?? null),
        apoio: 'percentual retornado pelo backend',
        tone: 'info'
      },
      {
        label: 'TTV mediano',
        valor: this.formatarTtvValor(ttvCriacao?.medianaSegundos ?? null, ttvCriacao?.amostra ?? 0),
        apoio: `${ttvCriacao?.amostra ?? 0} empresa(s) na base`,
        tone: 'soft'
      }
    ];
  }

  etapaLabel(codigo: AdminAdocaoFunilEtapaCodigo): string {
    return {
      EMPRESAS_CRIADAS: 'Empresas criadas',
      CONFIGURACAO_CONCLUIDA: 'Configuração concluída',
      PRIMEIRO_PEDIDO: 'Primeiro pedido',
      PRIMEIRA_MOVIMENTACAO: 'Primeira movimentação',
      ATIVADA: 'Ativadas'
    }[codigo];
  }

  etapaDescricao(codigo: AdminAdocaoFunilEtapaCodigo): string {
    return {
      EMPRESAS_CRIADAS: 'Base da coorte',
      CONFIGURACAO_CONCLUIDA: 'Cadastros mínimos prontos',
      PRIMEIRO_PEDIDO: 'Primeiro uso comercial real',
      PRIMEIRA_MOVIMENTACAO: 'Pedido avançou de status',
      ATIVADA: 'Critérios atuais de ativação'
    }[codigo];
  }

  larguraEtapa(etapa: AdminAdocaoFunilEtapa): number {
    return Math.max(0, Math.min(100, etapa.percentualDoTotal ?? 0));
  }

  conversaoAnterior(etapa: AdminAdocaoFunilEtapa): string {
    if (etapa.percentualEtapaAnterior == null) {
      return 'Base da coorte';
    }
    return `${this.formatarPercentual(etapa.percentualEtapaAnterior)} avançaram`;
  }

  formatarPercentual(valor: number | null): string {
    if (valor == null) {
      return 'Indisponível';
    }
    return `${new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(valor)}%`;
  }

  formatarDuracao(segundos: number | null): string {
    if (segundos == null) {
      return 'Indisponível';
    }
    if (segundos < 60) {
      return `${segundos}s`;
    }
    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) {
      return `${minutos}min`;
    }
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    if (horas < 24) {
      return minutosRestantes > 0 ? `${horas}h ${minutosRestantes}min` : `${horas}h`;
    }
    const dias = Math.floor(horas / 24);
    const horasRestantes = horas % 24;
    return horasRestantes > 0 ? `${dias}d ${horasRestantes}h` : `${dias}d`;
  }

  formatarTtvValor(segundos: number | null, amostra: number): string {
    return amostra > 0 ? this.formatarDuracao(segundos) : 'Indisponível';
  }

  ttvDescricao(metrica: AdminAdocaoFunilMetricaTtv): string {
    if (metrica.amostra === 0) {
      return 'Nenhuma empresa da coorte possui dados temporais suficientes.';
    }
    return `Base do cálculo: ${metrica.amostra} empresa(s).`;
  }

  periodoTexto(): string {
    if (!this.funil) {
      return '';
    }
    return `${this.formatarDataCurta(this.funil.periodo.inicio)} a ${this.formatarDataCurta(this.funil.periodo.fim)}`;
  }

  private aplicarParams(params: Params): void {
    const padrao = this.periodoPadrao();
    this.inicio = this.isIsoDate(params['inicio']) ? String(params['inicio']) : padrao.inicio;
    this.fim = this.isIsoDate(params['fim']) ? String(params['fim']) : padrao.fim;
    this.segmento = params['segmento'] === 'GRAFICA' ? 'GRAFICA' : 'GRAFICA';
  }

  private carregarFunil(): void {
    if (!this.periodoValido()) {
      return;
    }

    const filtro: AdminAdocaoFunilFiltro = {
      inicio: this.inicio,
      fim: this.fim,
      segmento: this.segmento
    };

    const currentRequest = ++this.requestId;
    this.carregando = true;
    this.erro = '';

    this.adocaoService.consultarFunil$(filtro)
      .pipe(finalize(() => {
        if (currentRequest === this.requestId) {
          this.carregando = false;
        }
      }))
      .subscribe({
        next: (response) => {
          if (currentRequest !== this.requestId) {
            return;
          }
          this.funil = response;
        },
        error: (error) => {
          if (currentRequest !== this.requestId) {
            return;
          }
          this.erro = error?.userMessage || 'Não foi possível carregar os dados de adoção.';
          this.toastr.error(this.erro);
        }
      });
  }

  private periodoValido(): boolean {
    this.erroPeriodo = '';
    if (!this.inicio || !this.fim) {
      this.erroPeriodo = 'Informe data inicial e data final.';
      return false;
    }
    if (this.inicio > this.fim) {
      this.erroPeriodo = 'A data inicial precisa ser menor ou igual à data final.';
      return false;
    }
    return true;
  }

  private etapaPorCodigo(codigo: AdminAdocaoFunilEtapaCodigo): AdminAdocaoFunilEtapa | null {
    return this.funil?.etapas.find((etapa) => etapa.codigo === codigo) ?? null;
  }

  private periodoPadrao(): { inicio: string; fim: string } {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(fim.getDate() - 29);
    return {
      inicio: this.toIsoDate(inicio),
      fim: this.toIsoDate(fim)
    };
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private isIsoDate(value: unknown): boolean {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  private formatarDataCurta(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR').format(new Date(year, month - 1, day));
  }
}
