import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ApexChart,
  ApexLegend,
  ApexPlotOptions,
  ApexStroke,
  ApexTooltip,
  ChartComponent,
  NgApexchartsModule,
} from 'ng-apexcharts';
import { MaterialModule } from '../../../material.module';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import {
  DashboardService,
  ReceitaResumoRequest,
  ReceitaResumoResponse,
  FormaPagamento,
  Periodo
} from '../dashboard.service';
import { firstValueFrom } from 'rxjs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

type DonutChart = {
  series: number[];
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  labels: string[];
  colors: string[];
};

@Component({
  selector: 'app-receita-resumo',
  standalone: true,
  imports: [MaterialModule, NgApexchartsModule, DesignSystemIconsModule, CommonModule, MatButtonToggleModule],
  templateUrl: './receita-resumo.component.html',
})
export class AppReceitaResumoComponent implements OnInit {
  @ViewChild('chart') chart?: ChartComponent;

  // -------- Filtros de período (front) --------
  ranges = [
    { id: 'mes_atual', label: 'Mês atual (início → hoje)', periodo: 'MES_ATUAL' as Periodo },
    { id: 'ultimos_30', label: 'Últimos 30 dias',          periodo: 'ULTIMOS_30' as Periodo },
    { id: 'mes_passado', label: 'Último mês',               periodo: 'MES_PASSADO' as Periodo },
    { id: 'ytd', label: 'Ano atual (YTD)',                  periodo: 'YTD' as Periodo },
  ] as const;
  selectedRange = 'mes_atual' as typeof this.ranges[number]['id'];

  // -------- Totais no cabeçalho --------
  totalValor = 0; // R$
  totalPedidos = 0;

  // -------- Donut de formas de pagamento --------
  pagamentoLabels: Record<FormaPagamento, string> = {
    PIX: 'Pix',
    DINHEIRO: 'Dinheiro',
    CARTAO_CREDITO: 'Cartão Crédito',
    CARTAO_DEBITO: 'Cartão Débito',
    DEPOSITO: 'Depósito',
    BOLETO: 'Boleto',
  };

  pagamentoCores: Record<FormaPagamento, string> = {
    PIX: 'var(--mat-sys-primary)',
    DINHEIRO: '#22c55e',
    CARTAO_CREDITO: '#46caeb',
    CARTAO_DEBITO: '#60a5fa',
    DEPOSITO: '#0ea5e9',
    BOLETO: '#f59e0b',
  };

  chartData: DonutChart = {
    series: [],
    labels: [],
    colors: [],
    chart: {
      type: 'donut',
      height: 220,
      toolbar: { show: false },
      fontFamily: 'inherit',
      foreColor: '#adb0bb',
    },
    plotOptions: { pie: { donut: { size: '80%' } } },
    stroke: { show: false },
    legend: { show: true, position: 'bottom' },
    tooltip: {
      y: {
        formatter: (v: number) =>
          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v),
      },
    },
  };

  constructor(private dashboard: DashboardService) {}

  async ngOnInit() {
    await this.carregarDoBack();
  }

  async onRangeChange() {
    await this.carregarDoBack();
  }

  // ======== Backend =======
  private async carregarDoBack() {
    const periodo = this.ranges.find(r => r.id === this.selectedRange)!.periodo;

    const req: ReceitaResumoRequest = { periodo }; 
    const resp: ReceitaResumoResponse = await firstValueFrom(
      this.dashboard.obterReceitaResumo(req)
    );

    // Cabeçalho
    this.totalValor = resp.valorTotal ?? 0;
    this.totalPedidos = resp.totalPedidos ?? 0;

    // Donut: garantir ordem consistente das formas
    const formas: FormaPagamento[] = ['PIX','DINHEIRO','CARTAO_CREDITO','CARTAO_DEBITO','DEPOSITO','BOLETO'];
    const mapa = new Map<FormaPagamento, number>();
    for (const f of resp.porForma || []) mapa.set(f.forma, f.valor ?? 0);

    const series = formas.map(f => mapa.get(f) ?? 0);
    const labels = formas.map(f => this.pagamentoLabels[f]);
    const colors = formas.map(f => this.pagamentoCores[f]);

    this.chartData = { ...this.chartData, series, labels, colors };
  }

  // ===== helpers de UI =====
  private rangesMap: Record<string, string> = {
    mes_atual: 'Mês atual (início → hoje)',
    ultimos_30: 'Últimos 30 dias',
    mes_passado: 'Último mês',
    ytd: 'Ano atual (YTD)',
  };

  get selectedRangeLabel(): string {
    return this.rangesMap[this.selectedRange] || 'Mês atual (início → hoje)';
  }

  formatBRL(v: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

}
