import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'src/app/services/toastr.service';
import { Observable } from 'rxjs';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { StatusBadgeComponent } from 'src/app/components/status-badge/status-badge.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { FolhaConfiguracaoEmpresa, FolhaFuncionario, FolhaPagamento, PagamentoForma } from '../models/folha.model';
import { FolhaPagamentoService } from '../services/folha-pagamento.service';
import {
  CriarAcordoDialogResult,
  DialogCriarAcordoComponent
} from '../components/dialog-criar-acordo/dialog-criar-acordo.component';
import {
  DialogValorAcaoComponent,
  DialogValorAcaoData,
  DialogValorAcaoResult,
  DialogValorAcaoTipoOption
} from '../components/dialog-valor-acao/dialog-valor-acao.component';
import { DialogFolhaWhatsappComponent } from '../components/dialog-folha-whatsapp/dialog-folha-whatsapp.component';
import {
  DialogRenegociarAcordosComponent,
  RenegociarAcordoResumo,
  RenegociarAcordosDialogResult
} from '../components/dialog-renegociar-acordos/dialog-renegociar-acordos.component';

@Component({
  selector: 'app-detalhe-folha-pagamento',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    PageCardComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    TemPermissaoDirective
  ],
  templateUrl: './detalhe-folha-pagamento.component.html',
  styleUrl: './detalhe-folha-pagamento.component.scss'
})
export class DetalheFolhaPagamentoComponent implements OnInit {
  folha?: FolhaFuncionario;
  configuracao?: FolhaConfiguracaoEmpresa;
  competencia = '';
  funcionarioId = 0;
  gerandoDocumento = false;

  lancamentosCols = ['tipo', 'descricao', 'valor', 'criadoEm'];
  pagamentosCols = ['data', 'forma', 'valor', 'observacao'];
  readonly proventoTipoOptions: DialogValorAcaoTipoOption[] = [
    { value: 'HORA_EXTRA', label: 'Hora extra' },
    { value: 'COMISSAO', label: 'Comissão' }
  ];
  readonly descontoTipoOptions: DialogValorAcaoTipoOption[] = [
    { value: 'FALTA', label: 'Desconto por falta' }
  ];
  readonly pagamentoFormaOptions: DialogValorAcaoTipoOption[] = [
    { value: 'PIX', label: 'PIX' },
    { value: 'TRANSFERENCIA', label: 'Transferência' },
    { value: 'DINHEIRO', label: 'Dinheiro' }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: FolhaPagamentoService,
    private readonly dialog: MatDialog,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.competencia = this.route.snapshot.paramMap.get('competencia') || '';
    this.funcionarioId = Number(this.route.snapshot.paramMap.get('funcionarioId'));
    if (!this.competencia || !this.funcionarioId) {
      this.voltar();
      return;
    }
    this.carregarConfiguracao();
    this.recarregar();
  }

  voltar(): void {
    this.router.navigate(['/page/folha-pagamento']);
  }

  lancarProvento(): void {
    if (!this.folha || !this.podeLancarAjuste()) return;
    const salarioBase = Number(this.folha.salarioBase || 0);
    const sugestaoHoraExtra = Number((salarioBase * 0.08).toFixed(2));
    const sugestaoComissao = this.folha.setor === 'Comercial' ? 220 : 120;
    this.abrirDialogLancamento({
      titulo: 'Lançar provento',
      subtitulo: 'Escolha o tipo de provento e informe o valor desta competência.',
      labelTipo: 'Tipo de provento',
      tipoOptions: this.proventoTipoOptions,
      tipoInicial: 'HORA_EXTRA',
      valorInicial: Math.max(sugestaoHoraExtra, sugestaoComissao),
      descricaoInicial: '',
      botaoConfirmar: 'Lançar provento'
    }).subscribe((result) => {
      if (!result) return;
      const tipo = result.tipo === 'COMISSAO' ? 'COMISSAO' : 'HORA_EXTRA';
      const descricaoPadrao = tipo === 'COMISSAO' ? 'Comissão por vendas' : 'Hora extra';
      const mensagemSucesso = tipo === 'COMISSAO' ? 'Comissão lançada.' : 'Hora extra lançada.';
      this.service
        .lancarBonus$(this.competencia, this.funcionarioId, result.valor, result.descricao || descricaoPadrao)
        .subscribe({
          next: () => {
            this.toastr.success(mensagemSucesso);
            this.recarregar();
          },
          error: (err) => this.tratarErroAcaoFolhaFechada(err, 'lançar provento')
        });
    });
  }

  lancarDesconto(): void {
    if (!this.folha || !this.podeLancarAjuste()) return;
    const salarioBase = Number(this.folha.salarioBase || 0);
    const sugestao = Number((salarioBase / 30).toFixed(2));
    this.abrirDialogLancamento({
      titulo: 'Lançar desconto',
      subtitulo: 'Informe o desconto manual desta competência.',
      labelTipo: 'Tipo de desconto',
      tipoOptions: this.descontoTipoOptions,
      tipoInicial: 'FALTA',
      valorInicial: sugestao,
      descricaoInicial: '',
      botaoConfirmar: 'Lançar desconto'
    }).subscribe((result) => {
      if (!result) return;
      const descricaoPadrao = 'Desconto por falta';
      this.service
        .lancarDesconto$(this.competencia, this.funcionarioId, result.valor, result.descricao || descricaoPadrao)
        .subscribe({
          next: () => {
            this.toastr.success('Desconto por falta lançado.');
            this.recarregar();
          },
          error: (err) => this.tratarErroAcaoFolhaFechada(err, 'lançar desconto')
        });
    });
  }

  registrarAdiantamento(): void {
    if (!this.folha || !this.podeLancarAjuste()) return;
    if (!this.permiteAdiantamento) {
      this.toastr.warning('Adiantamento não permitido para esta empresa.');
      return;
    }
    const opcoesCompetencia = this.opcoesCompetenciaDesconto(this.competencia, 12);
    this.abrirDialogLancamento({
      titulo: 'Registrar adiantamento',
      subtitulo: 'Informe o valor e em qual competência o desconto será aplicado.',
      labelTipo: 'Competência de desconto',
      tipoOptions: opcoesCompetencia,
      tipoInicial: this.competencia,
      labelValor: 'Valor do adiantamento (R$)',
      valorInicial: Number((Number(this.folha.salario || this.folha.salarioBase || 0) * 0.2).toFixed(2)),
      labelDescricao: 'Descrição',
      descricaoInicial: 'Adiantamento',
      botaoConfirmar: 'Registrar adiantamento'
    }).subscribe((result) => {
      if (!result) return;
      this.service
        .registrarAdiantamento$(
          this.competencia,
          this.funcionarioId,
          result.valor,
          result.tipo || this.competencia,
          result.descricao || 'Adiantamento'
        )
        .subscribe({
          next: () => {
            this.toastr.success('Adiantamento registrado com sucesso.');
            this.recarregar();
          },
          error: (err) => this.tratarErroAcaoFolhaFechada(err, 'registrar adiantamento')
        });
    });
  }

  abrirNovoAcordo(): void {
    if (!this.folha || !this.podeLancarAjuste()) return;
    const ref = this.dialog.open(DialogCriarAcordoComponent, {
      width: '560px',
      data: {
        competenciaAtual: this.competencia,
        politica: this.configuracao,
        salarioBase: this.folha.salarioBase || this.totalBruto
      }
    });

    ref.afterClosed().subscribe((result?: CriarAcordoDialogResult) => {
      if (!result) return;
      this.service.criarAcordo$(this.competencia, this.funcionarioId, result).subscribe({
        next: () => {
          this.toastr.success('Acordo criado e programado nas competências.');
          this.recarregar();
        },
        error: (err) => this.tratarErroAcaoFolhaFechada(err, 'criar acordo')
      });
    });
  }

  abrirRenegociacaoAcordos(): void {
    if (!this.folha || !this.podeLancarAjuste()) return;
    const acordos = this.acordosRenegociaveis();
    if (!acordos.length) {
      this.toastr.info('Nenhum acordo com saldo em aberto para renegociar.');
      return;
    }

    const ref = this.dialog.open(DialogRenegociarAcordosComponent, {
      width: '640px',
      data: {
        competenciaAtual: this.competencia,
        acordos
      }
    });

    ref.afterClosed().subscribe((result?: RenegociarAcordosDialogResult) => {
      if (!result) return;
      this.service.renegociarAcordos$(this.competencia, this.funcionarioId, result).subscribe({
        next: () => {
          this.toastr.success('Acordos renegociados com sucesso.');
          this.recarregar();
        },
        error: (err) => this.tratarErroAcaoFolhaFechada(err, 'renegociar acordos')
      });
    });
  }

  registrarPagamento(): void {
    if (!this.folha) return;
    const sugestao = this.saldoPendente;
    if (sugestao <= 0) {
      this.toastr.info('Folha já quitada.');
      return;
    }

    this.abrirDialogLancamento({
      titulo: 'Registrar pagamento',
      subtitulo: 'Informe o valor recebido neste pagamento.',
      labelTipo: 'Forma de pagamento',
      tipoOptions: this.pagamentoFormaOptions,
      tipoInicial: 'PIX',
      valorInicial: sugestao,
      descricaoInicial: 'Pagamento',
      botaoConfirmar: 'Registrar pagamento'
    }).subscribe((result) => {
      if (!result) return;
      const forma = (result.tipo || 'PIX') as PagamentoForma;
      this.service.registrarPagamento$(this.competencia, this.funcionarioId, result.valor, forma, result.descricao).subscribe({
        next: () => {
          this.toastr.success('Pagamento registrado.');
          this.recarregar();
        },
        error: (err) => this.tratarErroAcaoFolhaFechada(err, 'registrar pagamento')
      });
    });
  }

  abrirResumoWhatsapp(): void {
    if (!this.folha) return;
    const mensagem = this.montarMensagemWhatsapp(this.folha);
    this.dialog.open(DialogFolhaWhatsappComponent, {
      width: '640px',
      data: {
        funcionarioNome: this.folha.funcionarioNome,
        competencia: this.folha.competencia,
        mensagem,
        telefone: this.folha.telefone || ''
      }
    });
  }

  gerarDocumentoPagamento(): void {
    if (!this.folha || this.gerandoDocumento) return;
    this.gerandoDocumento = true;
    this.service.baixarDocumentoPagamento$(this.competencia, this.funcionarioId).subscribe({
      next: (res) => {
        this.baixarPdf(res);
        this.toastr.success(`${this.tituloDocumentoPagamento} gerado com sucesso.`);
        this.gerandoDocumento = false;
      },
      error: (err) => {
        this.toastr.error(err?.userMessage || `Não foi possível gerar ${this.tituloDocumentoPagamento.toLowerCase()}.`);
        this.gerandoDocumento = false;
      }
    });
  }

  fecharFolha(): void {
    if (!this.folha) return;
    if (!this.canFecharFolha) {
      this.toastr.warning(
        `Não é possível fechar a folha com saldo pendente (${this.formatarMoeda(this.saldoPendente)}).`
      );
      return;
    }
    this.service.fecharCompetencia$(this.competencia).subscribe(() => {
      this.toastr.success('Competência fechada.');
      this.recarregar();
    });
  }

  reabrirFolha(): void {
    if (!this.folha) return;
    this.service.reabrirCompetencia$(this.competencia).subscribe(() => {
      this.toastr.success('Competência reaberta.');
      this.recarregar();
    });
  }

  get totalBruto(): number {
    return this.folha ? this.service.totalBruto(this.folha) : 0;
  }

  get salarioAtual(): number | null {
    if (!this.folha) return null;
    if (Number.isFinite(this.folha.salario)) return Number(this.folha.salario);
    if (Number.isFinite(this.folha.salarioBase)) return Number(this.folha.salarioBase);
    return null;
  }

  get totalDescontos(): number {
    return this.folha ? this.service.totalDescontos(this.folha) : 0;
  }

  get totalLiquido(): number {
    return this.folha ? this.service.totalLiquido(this.folha) : 0;
  }

  get totalPago(): number {
    return this.folha ? this.service.totalPago(this.folha) : 0;
  }

  get saldoPendente(): number {
    return this.folha ? this.service.saldoPendente(this.folha) : 0;
  }

  get canFecharFolha(): boolean {
    return this.saldoPendente <= 0;
  }

  get permiteAdiantamento(): boolean {
    return Boolean(this.configuracao?.permitirAdiantamento);
  }

  get tituloDocumentoPagamento(): string {
    const contrato = String(this.folha?.tipoContrato || '').toUpperCase();
    return contrato === 'CLT' ? 'Contracheque' : 'Comprovante de pagamento';
  }

  private recarregar(): void {
    this.service.obterFolha$(this.competencia, this.funcionarioId).subscribe((folha) => {
      this.folha = folha;
      if (!folha) {
        this.toastr.error('Folha não encontrada para o colaborador/competência informados.');
        this.voltar();
        return;
      }
    });
  }

  private carregarConfiguracao(): void {
    this.service.obterConfiguracaoFolha$().subscribe({
      next: (cfg) => (this.configuracao = cfg),
      error: () => {
        this.configuracao = undefined;
      }
    });
  }

  private podeLancarAjuste(): boolean {
    if (!this.folha) return false;
    if ((this.folha.statusFolha || this.folha.status) === 'FECHADO') {
      this.toastr.info('Folha fechada. Reabra para lançar ajustes.');
      return false;
    }
    return true;
  }

  private abrirDialogLancamento(data: DialogValorAcaoData): Observable<DialogValorAcaoResult | undefined> {
    const ref = this.dialog.open(DialogValorAcaoComponent, {
      width: '520px',
      data
    });
    return ref.afterClosed();
  }

  private opcoesCompetenciaDesconto(baseCompetencia: string, quantidade: number): DialogValorAcaoTipoOption[] {
    const [anoStr, mesStr] = String(baseCompetencia || '').split('-');
    let ano = Number(anoStr);
    let mes = Number(mesStr);
    if (!Number.isFinite(ano) || !Number.isFinite(mes) || mes < 1 || mes > 12) {
      const hoje = new Date();
      ano = hoje.getFullYear();
      mes = hoje.getMonth() + 1;
    }

    return Array.from({ length: Math.max(1, quantidade) }, (_, i) => {
      const dt = new Date(ano, mes - 1 + i, 1);
      const competencia = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
      return { value: competencia, label: competencia };
    });
  }

  private baixarPdf(response: HttpResponse<Blob>): void {
    const blob = response.body;
    if (!blob) return;
    const header = response.headers.get('content-disposition') || '';
    const match = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(header);
    const fallback = String(this.tituloDocumentoPagamento || 'documento')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    const fileName = match ? decodeURIComponent(match[1].replace(/"/g, '')) : `${fallback}-${this.competencia}.pdf`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  trackPagamento = (_: number, p: FolhaPagamento) => p.id;

  trackParcela = (_: number, p: { numero: number; competencia: string }) => `${p.numero}-${p.competencia}`;

  private acordosRenegociaveis(): RenegociarAcordoResumo[] {
    return (this.folha?.acordos || [])
      .map((a) => {
        const parcelas = a.listaParcelas || a.parcelas || [];
        const parcelasAbertas = parcelas.filter((p) => !this.parcelaQuitadaOuCancelada(p.status));
        const saldoParcelado = parcelasAbertas.reduce((acc, p) => {
          const previsto = Number(p.valorPrevisto || 0);
          const descontado = Number(p.valorDescontado || 0);
          return acc + Math.max(0, previsto - descontado);
        }, 0);
        const saldoSemParcela = !parcelas.length && a.status === 'ATIVO' ? Number(a.valorTotal || 0) : 0;
        const saldoEmAberto = Number((saldoParcelado + saldoSemParcela).toFixed(2));
        return {
          id: a.id,
          tipo: a.tipo,
          descricao: a.descricao || '—',
          saldoEmAberto,
          parcelasEmAberto: parcelasAbertas.length
        } as RenegociarAcordoResumo;
      })
      .filter((a) => a.saldoEmAberto > 0);
  }

  private parcelaQuitadaOuCancelada(status?: string): boolean {
    const s = String(status || '').toUpperCase();
    return s === 'PAGO' || s === 'CANCELADA';
  }

  private tratarErroAcaoFolhaFechada(err: any, acao: string): void {
    const payload = err?.error || {};
    const code = String(payload?.code || '').toUpperCase();
    const competenciaSugerida = String(payload?.competenciaSugerida || '').trim();
    const competenciaAtual = String(payload?.competenciaAtual || this.competencia || '').trim();

    if (code !== 'COMPETENCIA_FECHADA') {
      this.toastr.error(err?.userMessage || payload?.message || `Não foi possível ${acao}.`);
      return;
    }

    if (!competenciaSugerida) {
      this.toastr.warning(payload?.message || 'Competência fechada. Lance na próxima competência aberta.');
      return;
    }

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '460px',
      data: {
        title: 'Competência fechada',
        message:
          `A competência ${competenciaAtual} está fechada e não aceita novos lançamentos.\n\n` +
          `Deseja continuar na competência sugerida ${competenciaSugerida}?`,
        confirmText: `Ir para ${competenciaSugerida}`,
        cancelText: 'Cancelar',
        confirmColor: 'primary'
      }
    });

    ref.afterClosed().subscribe((irParaSugerida) => {
      if (!irParaSugerida) return;
      this.router.navigate(['/page/folha-pagamento/detalhe', competenciaSugerida, this.funcionarioId]);
    });
  }

  private formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(valor || 0));
  }

  private montarMensagemWhatsapp(f: FolhaFuncionario): string {
    const proventos = (f.lancamentos || []).filter((l) => l.tipo === 'PROVENTO');
    const descontos = (f.lancamentos || []).filter((l) => l.tipo === 'DESCONTO');
    const pagamentos = [...(f.pagamentos || [])].sort(
      (a, b) => this.timestamp(b.data) - this.timestamp(a.data)
    );
    const acordos = f.acordos || [];

    const bruto = this.service.totalBruto(f);
    const totalDescontos = this.service.totalDescontos(f);
    const liquido = this.service.totalLiquido(f);
    const pago = this.service.totalPago(f);
    const pendente = this.service.saldoPendente(f);
    const status = f.statusFolha || f.status || (pendente <= 0 ? 'PAGO' : 'ABERTO');
    const ultimoPagamento = pagamentos[0];

    const cabecalho = [
      '*Resumo da folha de pagamento*',
      `\n\nFuncionário: *${f.funcionarioNome}*`,
      `\nCompetência: *${f.competencia}*`,
      `\nStatus: *${status}*`,
      '\n\n*Totais*',
      `\n- Bruto: ${this.formatarMoeda(bruto)}`,
      `\n- Descontos: ${this.formatarMoeda(totalDescontos)}`,
      `\n- Líquido: ${this.formatarMoeda(liquido)}`,
      `\n- Pago: ${this.formatarMoeda(pago)}`,
      `\n- Pendente: ${this.formatarMoeda(pendente)}`
    ].join('');

    const destaquePagamento =
      status === 'PAGO'
        ? `\n\n*PAGO:* ${this.formatarMoeda(pago)} em ${this.formatarDataHora(ultimoPagamento?.data)}`
        : pago > 0
          ? `\n\n*PAGO ATÉ AGORA:* ${this.formatarMoeda(pago)}`
          : '';

    const secaoProventos = proventos.length
      ? `\n\n*Ganhos (proventos)*\n${proventos.map((l) => `- ${l.descricao}: ${this.formatarMoeda(l.valor)}`).join('\n')}`
      : '\n\n*Ganhos (proventos)*\n- Sem lançamentos';

    const secaoDescontos = descontos.length
      ? `\n\n*Descontos*\n${descontos
          .map((l) => `- ${this.formatarDescricaoDescontoWhatsapp(l.descricao, acordos)}: ${this.formatarMoeda(l.valor)}`)
          .join('\n')}`
      : '\n\n*Descontos*\n- Sem lançamentos';

    const secaoPagamentos = pagamentos.length
      ? `\n\n*Pagamentos registrados*\n${pagamentos
          .map((p) => `- ${this.formatarDataHora(p.data)} | ${p.forma}: ${this.formatarMoeda(p.valor)}`)
          .join('\n')}`
      : '\n\n*Pagamentos registrados*\n- Nenhum pagamento nesta competência';

    const secaoAcordos = acordos.length
      ? `\n\n*Acordos e parcelas*\n${acordos
          .map((a) => {
            const parcelas = (a.listaParcelas || a.parcelas || []);
            const pagas = parcelas.filter((p) => p.status === 'PAGO').length;
            const faltantes = Math.max(0, parcelas.length - pagas);
            const resumoParcelas = parcelas.length
              ? `\n  Parcelas: ${pagas} pagas / ${faltantes} faltantes`
              : '';
            const detalheParcelas = parcelas.length
              ? `\n${parcelas
                  .map(
                    (p) =>
                      `  - Parcela ${p.numero} (${p.competencia}): prevista ${this.formatarMoeda(p.valorPrevisto)}, descontada ${this.formatarMoeda(p.valorDescontado)} [${p.status}]`
                  )
                  .join('\n')}`
              : '';
            return `- ${a.tipo}: ${a.descricao} (${this.formatarMoeda(a.valorTotal)}) [${a.status}]${resumoParcelas}${detalheParcelas}`;
          })
          .join('\n')}`
      : '\n\n*Acordos e parcelas*\n- Sem acordos nesta competência';

    const rodape = '\n\nEm caso de dúvida sobre algum lançamento, converse com o responsável financeiro.';
    return `${cabecalho}${destaquePagamento}${secaoProventos}${secaoDescontos}${secaoPagamentos}${secaoAcordos}${rodape}`;
  }

  private formatarDataHora(v?: string): string {
    if (!v) return '-';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleString('pt-BR');
  }

  private timestamp(v?: string): number {
    if (!v) return 0;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }

  private formatarDescricaoDescontoWhatsapp(descricao?: string, acordos: any[] = []): string {
    const raw = String(descricao || '').trim();
    const match = raw.match(/^Parcela acordo\s*#(\d+)\s*-\s*(\d+)(.*)$/i);
    if (!match) return raw || 'Desconto';

    const acordoRef = Number(match[1]);
    const numeroParcela = Number(match[2]);
    const sufixo = (match[3] || '').trim();

    const acordo =
      acordos.find((a) => Number(a?.id) === acordoRef) ||
      (acordoRef > 0 ? acordos[acordoRef - 1] : undefined);
    const totalParcelas = (acordo?.listaParcelas || acordo?.parcelas || []).length || numeroParcela;

    const base = `Parcela ${numeroParcela} de ${totalParcelas} do acordo #${acordoRef}`;
    return sufixo ? `${base} ${sufixo}` : base;
  }
}
