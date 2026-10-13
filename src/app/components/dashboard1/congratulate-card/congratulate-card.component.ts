import { Component, ViewChild, OnInit } from '@angular/core';
import {
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexLegend,
  ApexStroke,
  ApexTooltip,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexYAxis,
  ApexGrid,
  ApexPlotOptions,
  ApexFill,
  ApexMarkers,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { firstValueFrom } from 'rxjs';

import { MaterialModule } from '../../../material.module';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { DashboardComparativoResponse, DashboardService } from '../dashboard.service';


interface Mes {
  value: number;      // 0..11
  viewValue: string;  // 'Jan' | 'Fev' | ...
}

interface Estatistica {
  id: number;
  color: string;
  title: string;
  subtitle: string;
  icon: string;
}

export interface GraficoReceita {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels?: ApexDataLabels;
  plotOptions?: ApexPlotOptions;
  yaxis: ApexYAxis | ApexYAxis[];
  xaxis: ApexXAxis;
  fill?: ApexFill;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  grid: ApexGrid;
  markers?: ApexMarkers;
}

@Component({
  selector: 'app-congratulate-card',
  standalone: true,
  imports: [NgApexchartsModule, MaterialModule, DesignSystemIconsModule],
  templateUrl: './congratulate-card.component.html',
})
export class AppCongratulateCardComponent implements OnInit {

  @ViewChild('chart') chart?: ChartComponent;

  empresaNome = '';
  empresaDescricao = '';

  // ===== Selects =====
  meses: Mes[] = [
    { value: 0, viewValue: 'Jan' }, { value: 1, viewValue: 'Fev' }, { value: 2, viewValue: 'Mar' },
    { value: 3, viewValue: 'Abr' }, { value: 4, viewValue: 'Mai' }, { value: 5, viewValue: 'Jun' },
    { value: 6, viewValue: 'Jul' }, { value: 7, viewValue: 'Ago' }, { value: 8, viewValue: 'Set' },
    { value: 9, viewValue: 'Out' }, { value: 10, viewValue: 'Nov' }, { value: 11, viewValue: 'Dez' },
  ];
  anos: number[] = (() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2];
  })();
  mesA = 0; // Jan
  mesB = 1; // Fev
  ano = new Date().getFullYear();
  modo: 'quantidade' | 'receita' = 'quantidade';

  // ===== Séries do gráfico =====
  revenueSeries: ApexAxisChartSeries = [
    { name: 'Mês A', data: [], color: 'var(--mat-sys-primary)' },
    { name: 'Mês B', data: [], color: 'var(--chart-accent, #46caeb)' },
  ];

  // ===== Config base (dias 1..31) =====
  revenueChart: Omit<GraficoReceita, 'series'> = {
    chart: {
      type: 'line',
      fontFamily: 'inherit',
      foreColor: '#adb0bb',
      toolbar: { show: false },
      height: 260,
      stacked: false,
    },
    legend: { show: true, position: 'top' },
    stroke: { width: 3, curve: 'smooth' },
    markers: { size: 3 },
    grid: { show: true, borderColor: 'rgba(0,0,0,0.1)', xaxis: { lines: { show: true } } },
    xaxis: {
      type: 'category',
      categories: Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')),
      labels: { show: true },
      axisBorder: { show: false },
    },
    yaxis: {
      labels: { show: true, formatter: (v: number) => String(Math.round(v)) },
      min: 0,
      max: 1,
      tickAmount: 5,
    },
    tooltip: {
      theme: 'dark',
      fillSeriesColor: false,
      y: { formatter: (v: number) => String(v) },
    },
  } as any;

  // ===== KPI cards (preenchidos a partir do back) =====
  stats: Estatistica[] = [];

  constructor(private dashboardService: DashboardService) { }

  // ===== Ciclo =====
  async ngOnInit() {
    await this.carregarDoBack();
  }

  // Chamado pelos selects (Mês A/B, Ano, Modo)
  async onFiltroChange() {
    await this.carregarDoBack();
  }

  // ===== Chamada ao backend e montagem do gráfico/KPIs =====
  private async carregarDoBack() {
    const empresaId = 1;

    const resp: DashboardComparativoResponse = await firstValueFrom(
      this.dashboardService.obterComparativoSimples(
        empresaId,
        this.ano,
        this.mesA,
        this.mesB,
        this.modo
      )
    );

    this.empresaNome = resp.empresa?.nome ?? '';
    this.empresaDescricao = resp.empresa?.descricao ?? '';

    // KPIs → cards
    this.stats = resp.kpis.map((kpi, i) => ({
      id: i + 1,
      color: this.mapearCor(kpi.status),
      title: `${kpi.quantidade} Pedidos`,
      subtitle: `Em ${kpi.status}`,
      icon: this.mapearIcone(kpi.status),
    }));

    // Configura formatação do eixo conforme modo retornado
    const modoResp = (resp as any).filtros?.modo ?? this.modo;
    this.configurarEixoY(modoResp);

    // Séries do gráfico (já vêm com 31 posições)
    const nomeA = resp.comparativo.mesA?.label ?? this.nomeMes(this.mesA);
    const nomeB = resp.comparativo.mesB?.label ?? this.nomeMes(this.mesB);

    const serieA = resp.comparativo.series.mesA.dias ?? [];
    const serieB = resp.comparativo.series.mesB.dias ?? [];

    this.revenueSeries[0] = { ...this.revenueSeries[0], name: nomeA, data: serieA };
    this.revenueSeries[1] = { ...this.revenueSeries[1], name: nomeB, data: serieB };

    this.aplicarFallbackY(serieA, serieB);
  }

  // ===== Helpers de UI =====

  // Formata y/tooltip conforme modo
  private configurarEixoY(modo: 'quantidade' | 'receita') {
    if (modo === 'receita') {
      this.revenueChart.yaxis = {
        ...(this.revenueChart.yaxis as any),
        labels: {
          show: true,
          formatter: (v: number) =>
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v),
        },
      };
      this.revenueChart.tooltip = {
        ...this.revenueChart.tooltip,
        y: {
          formatter: (v: number) =>
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
        },
      };
    } else {
      this.revenueChart.yaxis = {
        ...(this.revenueChart.yaxis as any),
        labels: { show: true, formatter: (v: number) => String(Math.round(v)) },
      };
      this.revenueChart.tooltip = {
        ...this.revenueChart.tooltip,
        y: { formatter: (v: number) => String(v) },
      };
    }
  }

  // Evita “linhas sumidas” quando tudo é 0 e melhora visual
  private aplicarFallbackY(serieA: number[], serieB: number[]) {
    const maxVal = Math.max(...(serieA ?? [0]), ...(serieB ?? [0]), 0);
    const yMax = maxVal > 0 ? Math.ceil(maxVal * 1.2) : 1;

    this.revenueChart = {
      ...this.revenueChart,
      yaxis: {
        ...(this.revenueChart.yaxis as any),
        min: 0,
        max: yMax,
        tickAmount: 5,
      },
      markers: { size: 3 },
      stroke: { ...this.revenueChart.stroke, width: 3, curve: 'smooth' },
    };
  }

  private mapearCor(status: string): string {
    const mapa: Record<string, string> = {
      RASCUNHO: 'secondary',
      PENDENTE: 'warning',
      ORCAMENTO: 'info',
      AGUARDANDO_PAGAMENTO: 'orange',
      EM_PRODUCAO: 'primary',
      PRONTO: 'teal',
      ENTREGUE: 'success',
      CANCELADO: 'danger'
    };
    return mapa[status] ?? 'primary';
  }

  private mapearIcone(status: string): string {
    const mapa: Record<string, string> = {
      RASCUNHO: 'pencil',
      PENDENTE: 'clock-hour-3',
      ORCAMENTO: 'report-money',
      AGUARDANDO_PAGAMENTO: 'credit-card',
      EM_PRODUCAO: 'printer',
      PRONTO: 'check',
      ENTREGUE: 'truck-delivery',
      CANCELADO: 'x'
    };
    return mapa[status] ?? 'circle';
  }

  private nomeMes(index: number): string {
    const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return nomes[index] ?? '-';
  }
}
