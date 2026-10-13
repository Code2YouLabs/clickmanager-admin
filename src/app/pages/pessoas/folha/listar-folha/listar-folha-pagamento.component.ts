import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ToastrService } from 'src/app/services/toastr.service';
import { MatDialog } from '@angular/material/dialog';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { FolhaCompetencia, FolhaConfiguracaoEmpresa, FolhaResumoCompetenciaView } from '../models/folha.model';
import { FolhaPagamentoService } from '../services/folha-pagamento.service';
import { StatusBadgeComponent } from 'src/app/components/status-badge/status-badge.component';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import {
  CriarCompetenciaDialogResult,
  DialogCriarCompetenciaComponent
} from '../components/dialog-criar-competencia/dialog-criar-competencia.component';

@Component({
  selector: 'app-listar-folha-pagamento',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    PageCardComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    TemPermissaoDirective
  ],
  templateUrl: './listar-folha-pagamento.component.html',
  styleUrl: './listar-folha-pagamento.component.scss'
})
export class ListarFolhaPagamentoComponent implements OnInit {
  competencias: FolhaCompetencia[] = [];
  configuracao?: FolhaConfiguracaoEmpresa;
  competenciaSelecionada = '';
  folhasCompetencia: any[] = [];
  exportandoCompetencia = false;
  exportandoTodas = false;
  displayedColumns = ['funcionario', 'status', 'bruto', 'descontos', 'liquido', 'pago', 'pendente', 'acoes'];

  constructor(
    private readonly service: FolhaPagamentoService,
    private readonly router: Router,
    private readonly toastr: ToastrService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.carregarConfiguracao();
    this.carregarCompetenciasInicial();
  }

  onCompetenciaChange(): void {
    this.carregarFolhasCompetencia();
  }

  abrirDetalhe(funcionarioId: number): void {
    this.router.navigate(['/page/folha-pagamento/detalhe', this.competenciaSelecionada, funcionarioId]);
  }

  criarCompetencia(): void {
    const ref = this.dialog.open(DialogCriarCompetenciaComponent, {
      width: '520px'
    });

    ref.afterClosed().subscribe((result?: CriarCompetenciaDialogResult) => {
      if (!result) return;
      this.service.criarCompetencias$(result).subscribe((ok) => {
        if (!ok) {
          this.toastr.warning('Não foi possível criar as competências com os dados informados.');
          return;
        }
        this.toastr.success('Competência(s) criada(s) com sucesso.');
        this.recarregarCompetencias(`${result.ano}-${String(result.meses[0]).padStart(2, '0')}`);
      });
    });
  }

  fecharCompetencia(): void {
    if (!this.competenciaSelecionada || !this.canFecharCompetencia) return;
    if (!this.canFecharCompetenciaQuitada) {
      this.toastr.warning(
        `Não é possível fechar a competência com saldo pendente (${this.formatarMoeda(this.totalPendenteCompetencia)}).`
      );
      return;
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Fechar competência',
        message: `Confirma o fechamento da competência ${this.competenciaSelecionada}?`,
        confirmText: 'Fechar',
        confirmColor: 'primary'
      }
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.service.fecharCompetencia$(this.competenciaSelecionada).subscribe(() => {
        this.toastr.success('Competência fechada.');
        this.recarregarCompetencias(this.proximaCompetencia(this.competenciaSelecionada));
      });
    });
  }

  reabrirCompetencia(): void {
    if (!this.competenciaSelecionada || !this.canReabrirCompetencia) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '440px',
      data: {
        title: 'Reabrir competência',
        message: `Confirma a reabertura da competência ${this.competenciaSelecionada}?`,
        confirmText: 'Reabrir',
        confirmColor: 'primary'
      }
    });

    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.service.reabrirCompetencia$(this.competenciaSelecionada).subscribe(() => {
        this.toastr.success('Competência reaberta.');
        this.recarregarCompetencias(this.competenciaSelecionada);
      });
    });
  }

  exportarCompetenciaCsv(): void {
    if (!this.competenciaSelecionada || this.exportandoCompetencia) return;
    this.exportandoCompetencia = true;
    this.service.exportarCsv$(this.competenciaSelecionada).subscribe({
      next: (res) => {
        this.baixarCsv(res, `folhas-${this.competenciaSelecionada}.csv`);
        this.toastr.success('Exportação da competência concluída.');
        this.exportandoCompetencia = false;
      },
      error: (err) => {
        this.toastr.error(err?.userMessage || 'Não foi possível exportar a competência.');
        this.exportandoCompetencia = false;
      }
    });
  }

  exportarTodasCsv(): void {
    if (this.exportandoTodas) return;
    this.exportandoTodas = true;
    this.service.exportarCsv$().subscribe({
      next: (res) => {
        this.baixarCsv(res, 'folhas-todas.csv');
        this.toastr.success('Exportação completa concluída.');
        this.exportandoTodas = false;
      },
      error: (err) => {
        this.toastr.error(err?.userMessage || 'Não foi possível exportar todas as folhas.');
        this.exportandoTodas = false;
      }
    });
  }

  private carregarFolhasCompetencia(): void {
    if (!this.competenciaSelecionada) {
      this.folhasCompetencia = [];
      return;
    }

    this.service.listarFolhasPorCompetencia$(this.competenciaSelecionada).subscribe({
      next: (folhas) => {
        this.folhasCompetencia = folhas
          .map((f) => ({
            funcionarioId: f.funcionarioId,
            funcionarioNome: f.funcionarioNome,
            statusFolha: f.statusFolha || f.status || 'ABERTO',
            bruto: this.service.totalBruto(f),
            descontos: this.service.totalDescontos(f),
            liquido: this.service.totalLiquido(f),
            pago: this.service.totalPago(f),
            pendente: this.service.saldoPendente(f)
          }))
          .sort((a, b) => String(a.funcionarioNome || '').localeCompare(String(b.funcionarioNome || ''), 'pt-BR'));
      },
      error: (err) => {
        this.folhasCompetencia = [];
        const status = Number(err?.status || 0);
        const msg =
          err?.userMessage ||
          err?.error?.message ||
          (status === 404
            ? 'A competência selecionada não foi encontrada. Atualize as competências e tente novamente.'
            : 'Não foi possível carregar as folhas desta competência.');
        this.toastr.warning(msg);

        if (status === 404) {
          this.recarregarCompetencias();
        }
      }
    });
  }

  private baixarCsv(response: HttpResponse<Blob>, fallbackName: string): void {
    const blob = response.body;
    if (!blob) return;
    const header = response.headers.get('content-disposition') || '';
    const nameMatch = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(header);
    const fileName = nameMatch ? decodeURIComponent(nameMatch[1].replace(/"/g, '')) : fallbackName;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  get resumoAtual(): FolhaResumoCompetenciaView | undefined {
    const competencia = this.competencias.find((c) => c.competencia === this.competenciaSelecionada);
    if (!competencia) return undefined;

    const totalColaboradores = this.folhasCompetencia.length;
    const totalBruto = this.folhasCompetencia.reduce((acc, x) => acc + Number(x.bruto || 0), 0);
    const totalDescontos = this.folhasCompetencia.reduce((acc, x) => acc + Number(x.descontos || 0), 0);
    const totalLiquido = this.folhasCompetencia.reduce((acc, x) => acc + Number(x.liquido || 0), 0);
    const totalPago = this.folhasCompetencia.reduce((acc, x) => acc + Number(x.pago || 0), 0);
    const totalPendente = this.folhasCompetencia.reduce((acc, x) => acc + Number(x.pendente || 0), 0);

    const statusGeral =
      competencia.status === 'FECHADA'
        ? 'FECHADO'
        : this.folhasCompetencia.length && this.folhasCompetencia.every((x) => x.statusFolha === 'PAGO')
        ? 'PAGO'
        : this.folhasCompetencia.some((x) => x.statusFolha === 'PARCIAL')
        ? 'PARCIAL'
        : 'ABERTO';

    return {
      competencia: competencia.competencia,
      totalColaboradores,
      totalBruto,
      totalDescontos,
      totalLiquido,
      totalPago,
      totalPendente,
      statusGeral
    };
  }

  get canFecharCompetencia(): boolean {
    const atual = this.competencias.find((c) => c.competencia === this.competenciaSelecionada);
    return !!atual && atual.status !== 'FECHADA';
  }

  get totalPendenteCompetencia(): number {
    return this.folhasCompetencia.reduce((acc, x) => acc + Number(x.pendente || 0), 0);
  }

  get canFecharCompetenciaQuitada(): boolean {
    return this.totalPendenteCompetencia <= 0;
  }

  get canReabrirCompetencia(): boolean {
    const atual = this.competencias.find((c) => c.competencia === this.competenciaSelecionada);
    return atual?.status === 'FECHADA';
  }

  get competenciaAtual(): FolhaCompetencia | undefined {
    return this.competencias.find((c) => c.competencia === this.competenciaSelecionada);
  }

  get closeCompetenciaTooltip(): string {
    if (!this.canFecharCompetencia) return '';
    if (!this.canFecharCompetenciaQuitada) {
      return 'Para fechar a competência, quite o saldo pendente total.';
    }
    return '';
  }

  private recarregarCompetencias(preferencial?: string): void {
    this.service.listarCompetencias$().subscribe((res) => {
      this.competencias = this.ordenarCompetencias(res);
      if (preferencial && this.competencias.some((x) => x.competencia === preferencial)) {
        this.competenciaSelecionada = preferencial;
      } else if (!this.competenciaSelecionada || !this.competencias.some((x) => x.competencia === this.competenciaSelecionada)) {
        this.competenciaSelecionada = this.primeiraCompetenciaAbertaOuPrimeira(this.competencias);
      }
      this.carregarFolhasCompetencia();
    });
  }

  private carregarCompetenciasInicial(): void {
    this.service.listarCompetencias$().subscribe({
      next: (res) => {
        this.competencias = this.ordenarCompetencias(res);
        this.competenciaSelecionada = this.primeiraCompetenciaAbertaOuPrimeira(this.competencias);
        this.carregarFolhasCompetencia();
      },
      error: () => {
        this.toastr.error('Não foi possível carregar as competências da folha.');
      }
    });
  }

  private formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0));
  }

  private primeiraCompetenciaAbertaOuPrimeira(lista: FolhaCompetencia[]): string {
    return lista.find((x) => x.status === 'ABERTA')?.competencia || lista[0]?.competencia || '';
  }

  private proximaCompetencia(competencia: string): string | undefined {
    const [anoStr, mesStr] = (competencia || '').split('-');
    const ano = Number(anoStr);
    const mes = Number(mesStr);
    if (!Number.isFinite(ano) || !Number.isFinite(mes) || mes < 1 || mes > 12) return undefined;
    const dt = new Date(ano, mes, 1);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
  }

  private ordenarCompetencias(lista: FolhaCompetencia[]): FolhaCompetencia[] {
    const atual = this.indiceCompetencia(this.competenciaMesAtual());
    const copia = [...(lista || [])];

    copia.sort((a, b) => {
      const ia = this.indiceCompetencia(a.competencia);
      const ib = this.indiceCompetencia(b.competencia);
      const aAtualOuFuturo = ia >= atual;
      const bAtualOuFuturo = ib >= atual;

      if (aAtualOuFuturo !== bAtualOuFuturo) return aAtualOuFuturo ? -1 : 1;
      if (aAtualOuFuturo) return ia - ib;
      return ib - ia;
    });

    return copia;
  }

  private competenciaMesAtual(): string {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  }

  private indiceCompetencia(competencia: string): number {
    const [anoStr, mesStr] = (competencia || '').split('-');
    const ano = Number(anoStr);
    const mes = Number(mesStr);
    if (!Number.isFinite(ano) || !Number.isFinite(mes) || mes < 1 || mes > 12) return Number.MIN_SAFE_INTEGER;
    return ano * 12 + (mes - 1);
  }

  get regraPadraoLabel(): string {
    if (!this.configuracao) return '5º dia útil';
    if (this.configuracao.regraPagamentoPadrao === 'DIA_FIXO') {
      return `Dia fixo (${this.configuracao.diaPagamentoPadrao || '—'})`;
    }
    return '5º dia útil';
  }

  get politicaAcordosLabel(): string {
    if (!this.configuracao) return 'Passagem: Não aplicar • Adiantamento: Não • Empréstimo: Não';
    const passagem = this.politicaPassagemLabel(this.configuracao.politicaPassagem);
    const adiantamento = this.configuracao.permitirAdiantamento ? 'Sim' : 'Não';
    const emprestimo = this.configuracao.permitirEmprestimo ? 'Sim' : 'Não';
    return `Passagem: ${passagem} • Adiantamento: ${adiantamento} • Empréstimo: ${emprestimo}`;
  }

  private carregarConfiguracao(): void {
    this.service.obterConfiguracaoFolha$().subscribe({
      next: (cfg) => (this.configuracao = cfg),
      error: () => {
        this.configuracao = undefined;
      }
    });
  }

  private politicaPassagemLabel(value?: string): string {
    const politica = String(value || 'NAO_APLICAR').toUpperCase();
    if (politica === 'PROVENTO') return 'Provento';
    if (politica === 'DESCONTO') return 'Desconto';
    return 'Não aplicar';
  }

}
