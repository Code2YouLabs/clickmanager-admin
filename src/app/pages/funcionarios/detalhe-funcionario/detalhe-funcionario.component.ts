import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'src/app/services/toastr.service';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { StatusBadgeComponent } from 'src/app/components/status-badge/status-badge.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import {
  DialogMotivoStatusComponent,
  DialogMotivoStatusResult
} from '../components/dialog-motivo-status/dialog-motivo-status.component';
import { Funcionario, StatusFuncionario, TipoContrato } from '../models/funcionario.model';
import { FuncionariosService } from '../services/funcionarios.service';

type TipoMovimentacaoStatus =
  | 'AFASTAMENTO'
  | 'RETORNO_AFASTAMENTO'
  | 'DESLIGAMENTO'
  | 'READMISSAO';

@Component({
  selector: 'app-detalhe-funcionario',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    PageCardComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    TemPermissaoDirective
  ],
  templateUrl: './detalhe-funcionario.component.html',
  styleUrl: './detalhe-funcionario.component.scss'
})
export class DetalheFuncionarioComponent implements OnInit {
  funcionario?: Funcionario;
  mostrarHistoricoCompleto = false;
  private funcionarioId?: number;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: FuncionariosService,
    private readonly toastr: ToastrService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.voltar();
      return;
    }
    this.funcionarioId = id;
    this.recarregarFuncionario();
  }

  alterarStatus(status: StatusFuncionario): void {
    if (!this.funcionario) return;
    const contexto = this.obterContextoTransicao(this.funcionario.status, status);
    if (!contexto) {
      this.toastr.warning('Transição de status não permitida para este funcionário.');
      return;
    }

    const motivoRef = this.dialog.open(DialogMotivoStatusComponent, {
      width: '460px',
      data: {
        titulo: `Confirmar ${contexto.acao}`,
        mensagem: `Informe os dados para ${contexto.acao} o funcionário "${this.funcionario.nome}".`,
        acaoLabel: contexto.botaoConfirmar,
        mostrarDataEfetiva: true,
        dataObrigatoria: contexto.dataObrigatoria,
        labelDataEfetiva: contexto.labelDataEfetiva
      }
    });

    motivoRef.afterClosed().subscribe((result?: DialogMotivoStatusResult) => {
      if (!result?.motivo) return;
      this.executarAlteracaoStatus(status, result.motivo, result.dataEfetiva, contexto.tipoMovimentacao);
    });
  }

  editar(): void {
    if (!this.funcionario) return;
    this.router.navigate(['/page/funcionarios/editar', this.funcionario.id]);
  }

  voltar(): void {
    this.router.navigate(['/page/funcionarios']);
  }

  movimentacoesVisiveis(funcionario: Funcionario) {
    const ordenadas = [...(funcionario.movimentacoes || [])]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return this.mostrarHistoricoCompleto ? ordenadas : ordenadas.slice(0, 2);
  }

  alternarHistoricoCompleto(): void {
    this.mostrarHistoricoCompleto = !this.mostrarHistoricoCompleto;
  }

  historicoOrdenado<T extends { inicio: string }>(lista: T[] | undefined): T[] {
    return [...(lista || [])].sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
  }

  descricaoContrato(tipo: TipoContrato | string | undefined): string {
    switch (tipo) {
      case 'ESTAGIO':
        return 'Estágio';
      case 'TEMPORARIO':
        return 'Temporário';
      case 'SEM_REGISTRO':
        return 'Sem registro';
      default:
        return tipo || '—';
    }
  }

  private executarAlteracaoStatus(
    status: StatusFuncionario,
    motivo: string,
    dataEfetiva: string | undefined,
    tipoMovimentacao: TipoMovimentacaoStatus
  ): void {
    const motivoComContexto = this.montarMotivoComContexto(motivo, tipoMovimentacao, dataEfetiva);

    this.service.alterarStatus$(this.funcionario!.id, status, motivoComContexto).subscribe(() => {
      this.toastr.success('Status atualizado com sucesso.');
      this.recarregarFuncionario();
    });
  }

  private recarregarFuncionario(): void {
    if (!this.funcionarioId) return;
    this.service.obterPorId$(this.funcionarioId).subscribe((f) => {
      this.funcionario = f;
      if (!f) {
        this.toastr.error('Funcionário não encontrado.');
        this.voltar();
      }
    });
  }

  private obterContextoTransicao(origem: StatusFuncionario, destino: StatusFuncionario): {
    tipoMovimentacao: TipoMovimentacaoStatus;
    acao: string;
    botaoConfirmar: string;
    labelDataEfetiva: string;
    dataObrigatoria: boolean;
  } | null {
    if (origem === 'ATIVO' && destino === 'AFASTADO') {
      return {
        tipoMovimentacao: 'AFASTAMENTO',
        acao: 'afastamento',
        botaoConfirmar: 'Afastar',
        labelDataEfetiva: 'Data de início do afastamento',
        dataObrigatoria: true
      };
    }

    if (origem === 'AFASTADO' && destino === 'ATIVO') {
      return {
        tipoMovimentacao: 'RETORNO_AFASTAMENTO',
        acao: 'retorno ao trabalho',
        botaoConfirmar: 'Retornar ao trabalho',
        labelDataEfetiva: 'Data de retorno',
        dataObrigatoria: true
      };
    }

    if ((origem === 'ATIVO' || origem === 'AFASTADO') && destino === 'DESLIGADO') {
      return {
        tipoMovimentacao: 'DESLIGAMENTO',
        acao: 'desligamento',
        botaoConfirmar: 'Desligar',
        labelDataEfetiva: 'Data de desligamento',
        dataObrigatoria: true
      };
    }

    if (origem === 'DESLIGADO' && destino === 'ATIVO') {
      return {
        tipoMovimentacao: 'READMISSAO',
        acao: 'readmissão',
        botaoConfirmar: 'Readmitir',
        labelDataEfetiva: 'Data efetiva de readmissão',
        dataObrigatoria: false
      };
    }

    return null;
  }

  private montarMotivoComContexto(
    motivo: string,
    tipoMovimentacao: TipoMovimentacaoStatus,
    dataEfetiva?: string
  ): string {
    const partes = [`[${tipoMovimentacao}]`];
    if (dataEfetiva) partes.push(`[DATA:${dataEfetiva}]`);
    partes.push(motivo.trim());
    return partes.join(' ');
  }
}
