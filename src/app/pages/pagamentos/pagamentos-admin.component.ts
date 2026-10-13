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
  AdminListaPagamentosResponse,
  AdminPagamentoDetalheResponse,
  AdminPagamentoStatus,
  AdminPagamentoResumoResponse,
  AdminPagamentosResumoResponse
} from './models/admin-pagamento.model';
import { AdminPagamentosService } from './services/admin-pagamentos.service';

@Component({
  selector: 'app-pagamentos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DesignSystemIconsModule, MaterialModule],
  templateUrl: './pagamentos-admin.component.html',
  styleUrl: './pagamentos-admin.component.scss'
})
export class PagamentosAdminComponent implements OnInit {
  readonly statusOptions: Array<AdminPagamentoStatus | 'TODOS'> = [
    'TODOS',
    'PENDENTE',
    'APROVADO',
    'RECUSADO',
    'CANCELADO',
    'ESTORNADO',
    'CHARGEBACK'
  ];

  carregandoResumo = false;
  carregandoLista = false;
  carregandoDetalhe = false;

  busca = '';
  statusFiltro: AdminPagamentoStatus | 'TODOS' = 'TODOS';
  pagina = 0;
  tamanho = 20;
  totalItens = 0;
  totalPaginas = 0;

  resumo: AdminPagamentosResumoResponse = {
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

  pagamentos: AdminPagamentoResumoResponse[] = [];
  pagamentoSelecionado: AdminPagamentoDetalheResponse | null = null;

  constructor(
    private readonly pagamentosService: AdminPagamentosService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.carregarResumo();
    this.carregarLista(true);
  }

  aplicarFiltros(): void {
    this.pagina = 0;
    this.carregarLista(true, this.pagamentoSelecionado?.id ?? null);
  }

  limparFiltros(): void {
    this.busca = '';
    this.statusFiltro = 'TODOS';
    this.pagina = 0;
    this.carregarLista(true);
  }

  alterarPagina(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanho = event.pageSize;
    this.carregarLista(true, this.pagamentoSelecionado?.id ?? null);
  }

  selecionarPagamento(item: AdminPagamentoResumoResponse): void {
    this.carregarDetalhe(item.id);
  }

  get resumoResultados(): string {
    return `${this.totalItens} pagamento(s) encontrado(s)`;
  }

  statusLabel(status: AdminPagamentoStatus): string {
    return {
      PENDENTE: 'Pendente',
      APROVADO: 'Aprovado',
      RECUSADO: 'Recusado',
      CANCELADO: 'Cancelado',
      ESTORNADO: 'Estornado',
      CHARGEBACK: 'Chargeback'
    }[status];
  }

  statusClass(status: AdminPagamentoStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  }

  dataRelativa(iso?: string | null): string {
    if (!iso) {
      return 'Sem data';
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

  payloadFormatado(): string {
    const raw = this.pagamentoSelecionado?.payloadJson?.trim();
    if (!raw) {
      return 'Sem payload disponível.';
    }

    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  private carregarResumo(): void {
    this.carregandoResumo = true;
    this.pagamentosService.buscarResumo$()
      .pipe(finalize(() => (this.carregandoResumo = false)))
      .subscribe({
        next: (resumo) => {
          this.resumo = resumo;
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar o resumo dos pagamentos.');
        }
      });
  }

  private carregarLista(resolverSelecao = false, pagamentoId: number | null = null): void {
    this.carregandoLista = true;

    this.pagamentosService.listar$({
      busca: this.busca || null,
      status: this.statusFiltro === 'TODOS' ? null : this.statusFiltro,
      pagina: this.pagina,
      tamanho: this.tamanho
    })
      .pipe(finalize(() => (this.carregandoLista = false)))
      .subscribe({
        next: (res: AdminListaPagamentosResponse) => {
          this.pagamentos = res.itens || [];
          this.pagina = res.pagina;
          this.tamanho = res.tamanho;
          this.totalItens = res.totalItens;
          this.totalPaginas = res.totalPaginas;

          if (resolverSelecao) {
            this.resolverSelecao(pagamentoId);
          }
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar a lista de pagamentos.');
        }
      });
  }

  private resolverSelecao(pagamentoId: number | null): void {
    const idSelecionado = pagamentoId && this.pagamentos.some((item) => item.id === pagamentoId)
      ? pagamentoId
      : this.pagamentos[0]?.id;

    if (idSelecionado) {
      this.carregarDetalhe(idSelecionado);
    } else {
      this.pagamentoSelecionado = null;
    }
  }

  private carregarDetalhe(id: number): void {
    this.carregandoDetalhe = true;
    this.pagamentosService.buscarPorId$(id)
      .pipe(finalize(() => (this.carregandoDetalhe = false)))
      .subscribe({
        next: (pagamento) => {
          this.pagamentoSelecionado = pagamento;
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar o detalhe do pagamento.');
        }
      });
  }
}
