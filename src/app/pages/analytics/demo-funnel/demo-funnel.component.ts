import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr.service';
import { finalize, forkJoin } from 'rxjs';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { MaterialModule } from 'src/app/material.module';
import {
  AdminDemoAnalyticsFunnelSummaryResponse,
  AdminDemoAnalyticsItemResumo
} from './models/admin-demo-funnel.model';
import { AdminDemoFunnelService } from './services/admin-demo-funnel.service';

type PeriodPreset = 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'CUSTOM';

type DemoSummaryCard = {
  label: string;
  value: string;
  helper: string;
  tone: 'primary' | 'info' | 'success' | 'warning';
  variationLabel: string;
  variationTone: 'up' | 'down' | 'neutral';
};

type DemoFunnelStep = {
  key: string;
  label: string;
  value: number;
  helper: string;
  percentFromTop: number;
  percentFromPrevious: number | null;
  lossAbsolute: number;
  lossPercent: number | null;
  isBottleneck: boolean;
};

type DemoBreakdownCard = {
  label: string;
  value: number;
  share: number;
  helper: string;
  tone: 'primary' | 'success' | 'info' | 'warning';
};

type DemoOperationalRow = {
  etapa: string;
  total: number;
  percentFromTop: number;
  percentFromPrevious: number | null;
  lossAbsolute: number;
  lossPercent: number | null;
};

type DemoInsight = {
  label: string;
  value: string;
  helper: string;
  tone: 'primary' | 'success' | 'warning';
};

type MetricKey =
  | 'viewed'
  | 'calculationCompleted'
  | 'orderGenerated'
  | 'whatsappPreviewed'
  | 'signupClicked'
  | 'specialistClicked';

@Component({
  selector: 'app-demo-funnel',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DesignSystemIconsModule, MaterialModule],
  templateUrl: './demo-funnel.component.html',
  styleUrl: './demo-funnel.component.scss'
})
export class DemoFunnelComponent implements OnInit {
  readonly presetOptions: Array<{ value: PeriodPreset; label: string }> = [
    { value: 'TODAY', label: 'Hoje' },
    { value: 'LAST_7_DAYS', label: '7 dias' },
    { value: 'LAST_30_DAYS', label: '30 dias' },
    { value: 'CUSTOM', label: 'Personalizado' }
  ];

  presetSelecionado: PeriodPreset = 'LAST_30_DAYS';
  dataInicio = '';
  dataFim = '';

  carregando = false;
  erro = '';

  resumo = this.criarResumoVazio();
  resumoAnterior = this.criarResumoVazio();

  constructor(
    private readonly demoFunnelService: AdminDemoFunnelService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.aplicarPreset('LAST_30_DAYS');
  }

  aplicarPreset(preset: PeriodPreset): void {
    this.presetSelecionado = preset;
    const hoje = this.dataHoje();

    if (preset === 'TODAY') {
      this.dataInicio = hoje;
      this.dataFim = hoje;
    } else if (preset === 'LAST_7_DAYS') {
      this.dataInicio = this.dataIsoDiasAtras(6);
      this.dataFim = hoje;
    } else if (preset === 'LAST_30_DAYS') {
      this.dataInicio = this.dataIsoDiasAtras(29);
      this.dataFim = hoje;
    } else if (!this.dataInicio || !this.dataFim) {
      this.dataInicio = this.dataIsoDiasAtras(29);
      this.dataFim = hoje;
    }

    this.carregarResumo();
  }

  aplicarPeriodoPersonalizado(): void {
    this.presetSelecionado = 'CUSTOM';
    this.carregarResumo();
  }

  recarregar(): void {
    this.carregarResumo();
  }

  get possuiDados(): boolean {
    return this.resumo.viewed > 0;
  }

  get periodoSelecionadoLabel(): string {
    return `${this.formatarDataCurta(this.dataInicio)} até ${this.formatarDataCurta(this.dataFim)}`;
  }

  get cardsResumo(): DemoSummaryCard[] {
    return [
      this.montarCardResumo(
        'Visualizações da demo',
        'viewed',
        'entrada principal da experiência pública',
        'primary'
      ),
      this.montarCardResumo(
        'Cálculos realizados',
        'calculationCompleted',
        'momento em que a demo entrega valor real',
        'info'
      ),
      this.montarCardResumo(
        'Pedidos gerados',
        'orderGenerated',
        'saída comercial da simulação',
        'success'
      ),
      this.montarCardResumo(
        'WhatsApp visualizado',
        'whatsappPreviewed',
        'intenção de contato após gerar pedido',
        'success'
      ),
      this.montarCardResumo(
        'Cadastros iniciados',
        'signupClicked',
        'usuários que avançaram para criar conta',
        'warning'
      ),
      this.montarCardResumo(
        'Especialista acionado',
        'specialistClicked',
        'pedidos de ajuda humana dentro da demo',
        'warning'
      )
    ];
  }

  get etapasFunil(): DemoFunnelStep[] {
    const base: Array<{ key: string; label: string; value: number; helper: string }> = [
      {
        key: 'viewed',
        label: 'Demo visualizada',
        value: this.resumo.viewed,
        helper: 'topo do funil'
      },
      {
        key: 'tourStarted',
        label: 'Tour iniciado',
        value: this.resumo.tourStarted,
        helper: 'usuários que aceitaram orientação inicial'
      },
      {
        key: 'tourCompleted',
        label: 'Tour concluído',
        value: this.resumo.tourCompleted,
        helper: 'entenderam a proposta antes de simular'
      },
      {
        key: 'calculationCompleted',
        label: 'Cálculo realizado',
        value: this.resumo.calculationCompleted,
        helper: 'momento em que a demo comprova utilidade'
      },
      {
        key: 'orderGenerated',
        label: 'Pedido gerado',
        value: this.resumo.orderGenerated,
        helper: 'resultado comercial da simulação'
      },
      {
        key: 'whatsappPreviewed',
        label: 'WhatsApp visualizado',
        value: this.resumo.whatsappPreviewed,
        helper: 'continuidade para contato'
      },
      {
        key: 'signupClicked',
        label: 'Criar conta',
        value: this.resumo.signupClicked,
        helper: 'avanço para onboarding'
      },
      {
        key: 'specialistClicked',
        label: 'Falar com especialista',
        value: this.resumo.specialistClicked,
        helper: 'pedido de ajuda humana'
      }
    ];

    const gargalo = this.gargaloPrincipal;
    const viewed = this.resumo.viewed;

    return base.map((item, index) => {
      const anterior = index > 0 ? base[index - 1] : null;
      const percentFromTop = this.percentual(item.value, viewed);
      const percentFromPrevious = anterior ? this.percentual(item.value, anterior.value) : null;
      const lossAbsolute = anterior ? Math.max(anterior.value - item.value, 0) : 0;
      const lossPercent = anterior ? this.percentual(lossAbsolute, anterior.value) : null;

      return {
        ...item,
        percentFromTop,
        percentFromPrevious,
        lossAbsolute,
        lossPercent,
        isBottleneck: Boolean(gargalo && gargalo.key === item.key)
      };
    });
  }

  get tabelaOperacional(): DemoOperationalRow[] {
    return this.etapasFunil.map((item) => ({
      etapa: item.label,
      total: item.value,
      percentFromTop: item.percentFromTop,
      percentFromPrevious: item.percentFromPrevious,
      lossAbsolute: item.lossAbsolute,
      lossPercent: item.lossPercent
    }));
  }

  get comparativoDispositivos(): DemoBreakdownCard[] {
    return this.mapBreakdownCards(this.resumo.devices, 'device');
  }

  get comparativoOrigens(): DemoBreakdownCard[] {
    return this.mapBreakdownCards(this.resumo.sources, 'source');
  }

  get tourCards(): DemoBreakdownCard[] {
    return [
      {
        label: 'Tour iniciado',
        value: this.resumo.tourStarted,
        share: this.percentual(this.resumo.tourStarted, this.resumo.viewed),
        helper: 'parte da audiência que aceitou a introdução',
        tone: 'primary'
      },
      {
        label: 'Tour concluído',
        value: this.resumo.tourCompleted,
        share: this.percentual(this.resumo.tourCompleted, this.resumo.tourStarted),
        helper: 'conclusão do tour entre quem iniciou',
        tone: 'success'
      },
      {
        label: 'Tour pulado',
        value: this.resumo.tourSkipped,
        share: this.percentual(this.resumo.tourSkipped, this.resumo.viewed),
        helper: 'usuários que preferiram ir direto para a demo',
        tone: 'warning'
      },
      {
        label: 'Saída da demo',
        value: this.resumo.exitClicked,
        share: this.percentual(this.resumo.exitClicked, this.resumo.viewed),
        helper: 'cliques de abandono explícito',
        tone: 'info'
      }
    ];
  }

  get insightsRapidos(): DemoInsight[] {
    const gargalo = this.gargaloPrincipal;
    const melhorDispositivo = this.comparativoDispositivos[0];
    const melhorOrigem = this.comparativoOrigens[0];

    return [
      {
        label: 'Gargalo principal',
        value: gargalo
          ? `${gargalo.previousLabel} → ${gargalo.label}`
          : 'Sem gargalo destacado',
        helper: gargalo
          ? `queda de ${gargalo.lossPercent?.toFixed(1) || '0.0'}% entre etapas consecutivas`
          : 'o funil ainda não tem volume suficiente para destacar perda',
        tone: 'warning'
      },
      {
        label: 'Melhor origem',
        value: melhorOrigem ? this.normalizarNome(melhorOrigem.label) : 'Sem origem dominante',
        helper: melhorOrigem
          ? `${melhorOrigem.share.toFixed(1)}% das entradas da demo no período`
          : 'o backend ainda não retornou fontes para o período',
        tone: 'primary'
      },
      {
        label: 'Melhor dispositivo',
        value: melhorDispositivo ? this.normalizarNome(melhorDispositivo.label) : 'Sem dispositivo dominante',
        helper: melhorDispositivo
          ? `${melhorDispositivo.share.toFixed(1)}% do topo do funil`
          : 'o backend ainda não retornou devices para o período',
        tone: 'success'
      }
    ];
  }

  get baseContagemLabel(): string {
    return this.resumo.baseContagem || 'visitantes únicos por anonymousId';
  }

  formatarDataCurta(dataIso: string): string {
    if (!dataIso) {
      return '--';
    }

    const [ano, mes, dia] = dataIso.split('-');
    if (!ano || !mes || !dia) {
      return dataIso;
    }

    return `${dia}/${mes}/${ano}`;
  }

  formatarNumero(valor: number): string {
    return new Intl.NumberFormat('pt-BR').format(valor || 0);
  }

  formatarPercentual(valor: number | null): string {
    if (valor == null || Number.isNaN(valor)) {
      return '--';
    }

    return `${valor.toFixed(2)}%`;
  }

  percentualBarra(item: DemoFunnelStep): number {
    return Math.max(item.percentFromTop, item.value > 0 ? 10 : 0);
  }

  private carregarResumo(): void {
    if (!this.dataInicio || !this.dataFim) {
      this.toastr.warning('Defina um período válido para consultar a demo.');
      return;
    }

    if (this.dataInicio > this.dataFim) {
      this.toastr.warning('A data inicial não pode ser maior que a data final.');
      return;
    }

    this.carregando = true;
    this.erro = '';

    const anterior = this.calcularPeriodoAnterior();

    forkJoin({
      atual: this.demoFunnelService.buscarResumo$({
        dataInicio: this.dataInicio,
        dataFim: this.dataFim
      }),
      anterior: this.demoFunnelService.buscarResumo$(anterior)
    })
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: ({ atual, anterior }) => {
          this.resumo = atual;
          this.resumoAnterior = anterior;
        },
        error: () => {
          this.erro = 'Não foi possível carregar o funil da demo agora.';
          this.toastr.error('Falha ao carregar analytics da demo SmartCalc.');
        }
      });
  }

  private montarCardResumo(
    label: string,
    metricKey: MetricKey,
    helper: string,
    tone: DemoSummaryCard['tone']
  ): DemoSummaryCard {
    const atual = this.resumo[metricKey];
    const anterior = this.resumoAnterior[metricKey];
    const variacao = this.calcularVariacao(atual, anterior);

    return {
      label,
      value: this.formatarNumero(atual),
      helper,
      tone,
      variationLabel: variacao.label,
      variationTone: variacao.tone
    };
  }

  private calcularVariacao(
    atual: number,
    anterior: number
  ): { label: string; tone: DemoSummaryCard['variationTone'] } {
    if (anterior <= 0 && atual <= 0) {
      return {
        label: 'sem base anterior',
        tone: 'neutral'
      };
    }

    if (anterior <= 0 && atual > 0) {
      return {
        label: 'nova tração vs período anterior',
        tone: 'up'
      };
    }

    const percentual = ((atual - anterior) / anterior) * 100;
    const prefixo = percentual > 0 ? '+' : '';

    return {
      label: `${prefixo}${percentual.toFixed(1)}% vs período anterior`,
      tone: percentual > 0 ? 'up' : percentual < 0 ? 'down' : 'neutral'
    };
  }

  private mapBreakdownCards(
    items: AdminDemoAnalyticsItemResumo[],
    kind: 'device' | 'source'
  ): DemoBreakdownCard[] {
    const total = items.reduce((acc, item) => acc + item.quantidade, 0);

    return [...items]
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 6)
      .map((item, index) => ({
        label: item.nome,
        value: item.quantidade,
        share: this.percentual(item.quantidade, total),
        helper:
          kind === 'device'
            ? `${this.percentual(item.quantidade, total).toFixed(1)}% das entradas da demo`
            : `${this.percentual(item.quantidade, total).toFixed(1)}% da aquisição do período`,
        tone: (['primary', 'success', 'info', 'warning'][
          index % 4
        ] || 'primary') as DemoBreakdownCard['tone']
      }));
  }

  private get gargaloPrincipal():
    | (Pick<DemoFunnelStep, 'key' | 'label' | 'lossPercent'> & { previousLabel: string })
    | null {
    const base = [
      { key: 'tourStarted', label: 'Tour iniciado', value: this.resumo.tourStarted, previousLabel: 'Demo visualizada', previous: this.resumo.viewed },
      { key: 'tourCompleted', label: 'Tour concluído', value: this.resumo.tourCompleted, previousLabel: 'Tour iniciado', previous: this.resumo.tourStarted },
      { key: 'calculationCompleted', label: 'Cálculo realizado', value: this.resumo.calculationCompleted, previousLabel: 'Tour concluído', previous: this.resumo.tourCompleted },
      { key: 'orderGenerated', label: 'Pedido gerado', value: this.resumo.orderGenerated, previousLabel: 'Cálculo realizado', previous: this.resumo.calculationCompleted },
      { key: 'whatsappPreviewed', label: 'WhatsApp visualizado', value: this.resumo.whatsappPreviewed, previousLabel: 'Pedido gerado', previous: this.resumo.orderGenerated },
      { key: 'signupClicked', label: 'Criar conta', value: this.resumo.signupClicked, previousLabel: 'WhatsApp visualizado', previous: this.resumo.whatsappPreviewed },
      { key: 'specialistClicked', label: 'Falar com especialista', value: this.resumo.specialistClicked, previousLabel: 'WhatsApp visualizado', previous: this.resumo.whatsappPreviewed }
    ]
      .map((item) => ({
        ...item,
        lossPercent: item.previous > 0 ? ((item.previous - item.value) / item.previous) * 100 : null
      }))
      .filter((item) => item.lossPercent != null && item.lossPercent > 0)
      .sort((a, b) => (b.lossPercent || 0) - (a.lossPercent || 0));

    return base[0] ?? null;
  }

  private percentual(numerador: number, denominador: number): number {
    if (!denominador || denominador <= 0) {
      return 0;
    }

    return Number(((numerador / denominador) * 100).toFixed(2));
  }

  private calcularPeriodoAnterior(): { dataInicio: string; dataFim: string } {
    const inicioAtual = new Date(`${this.dataInicio}T00:00:00`);
    const fimAtual = new Date(`${this.dataFim}T00:00:00`);
    const diffMs = fimAtual.getTime() - inicioAtual.getTime();
    const duracaoDias = Math.max(Math.round(diffMs / 86400000), 0);

    const fimAnterior = new Date(inicioAtual);
    fimAnterior.setDate(fimAnterior.getDate() - 1);

    const inicioAnterior = new Date(fimAnterior);
    inicioAnterior.setDate(inicioAnterior.getDate() - duracaoDias);

    return {
      dataInicio: this.toIsoDate(inicioAnterior),
      dataFim: this.toIsoDate(fimAnterior)
    };
  }

  private criarResumoVazio(): AdminDemoAnalyticsFunnelSummaryResponse {
    return {
      timezone: 'America/Sao_Paulo',
      dataInicio: '',
      dataFim: '',
      baseContagem: 'visitantes únicos por anonymousId',
      viewed: 0,
      tourStarted: 0,
      tourSkipped: 0,
      tourCompleted: 0,
      calculationCompleted: 0,
      orderGenerated: 0,
      whatsappPreviewed: 0,
      signupClicked: 0,
      specialistClicked: 0,
      exitClicked: 0,
      calculationRatePercent: 0,
      orderRatePercent: 0,
      whatsappRatePercent: 0,
      signupRatePercent: 0,
      specialistRatePercent: 0,
      devices: [],
      sources: []
    };
  }

  private dataHoje(): string {
    return this.toIsoDate(new Date());
  }

  private dataIsoDiasAtras(dias: number): string {
    const data = new Date();
    data.setDate(data.getDate() - dias);
    return this.toIsoDate(data);
  }

  private toIsoDate(data: Date): string {
    const ano = data.getFullYear();
    const mes = `${data.getMonth() + 1}`.padStart(2, '0');
    const dia = `${data.getDate()}`.padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private normalizarNome(valor: string): string {
    if (!valor) {
      return 'Desconhecido';
    }

    return valor
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
