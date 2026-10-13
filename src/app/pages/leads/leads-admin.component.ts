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
  AdminLeadDetalheResponse,
  AdminLeadOrigem,
  AdminLeadStatus,
  AdminLeadsResumoResponse,
  AdminLeadResumo
} from './models/admin-lead.model';
import { AdminLeadsService } from './services/admin-leads.service';

@Component({
  selector: 'app-leads-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DesignSystemIconsModule, MaterialModule],
  templateUrl: './leads-admin.component.html',
  styleUrl: './leads-admin.component.scss'
})
export class LeadsAdminComponent implements OnInit {
  readonly statusOptions: Array<AdminLeadStatus | 'TODOS'> = ['TODOS', 'NOVO', 'EM_CONTATO', 'QUALIFICADO', 'CONVERTIDO', 'DESCARTADO'];
  readonly origemOptions: Array<AdminLeadOrigem | 'TODOS'> = ['TODOS', 'NEWSLETTER', 'FORM_CONTATO', 'CTA_DEMO', 'WHATSAPP'];

  carregandoResumo = false;
  carregandoLista = false;
  carregandoDetalhe = false;
  atualizandoStatus = false;
  salvandoObservacao = false;

  busca = '';
  statusFiltro: AdminLeadStatus | 'TODOS' = 'TODOS';
  origemFiltro: AdminLeadOrigem | 'TODOS' = 'TODOS';
  pagina = 0;
  tamanho = 20;
  totalItens = 0;
  totalPaginas = 0;

  resumo: AdminLeadsResumoResponse = {
    novos: 0,
    emContato: 0,
    qualificados: 0,
    convertidos: 0
  };

  leads: AdminLeadResumo[] = [];
  leadSelecionado: AdminLeadDetalheResponse | null = null;
  statusEdicao: AdminLeadStatus | null = null;
  novaObservacao = '';

  constructor(
    private readonly leadsService: AdminLeadsService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.carregarResumo();
    this.carregarLista(true);
  }

  aplicarFiltros(): void {
    this.pagina = 0;
    this.carregarLista(true, this.leadSelecionado?.id ?? null);
  }

  limparFiltros(): void {
    this.busca = '';
    this.statusFiltro = 'TODOS';
    this.origemFiltro = 'TODOS';
    this.pagina = 0;
    this.carregarLista(true);
  }

  alterarPagina(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanho = event.pageSize;
    this.carregarLista(true, this.leadSelecionado?.id ?? null);
  }

  selecionarLead(lead: AdminLeadResumo): void {
    this.carregarDetalhe(lead.id);
  }

  atualizarStatus(): void {
    if (!this.leadSelecionado?.id || !this.statusEdicao || this.atualizandoStatus) {
      return;
    }

    this.atualizandoStatus = true;
    this.leadsService.atualizarStatus$(this.leadSelecionado.id, this.statusEdicao)
      .pipe(finalize(() => (this.atualizandoStatus = false)))
      .subscribe({
        next: (detalhe) => {
          if (detalhe) {
            this.aplicarDetalheAtualizado(detalhe);
          } else {
            this.recarregarAposMutacao(this.leadSelecionado!.id);
          }
          this.toastr.success('Status do lead atualizado.');
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível atualizar o status do lead.');
        }
      });
  }

  adicionarObservacao(): void {
    if (!this.leadSelecionado?.id || this.salvandoObservacao) {
      return;
    }

    const observacao = this.novaObservacao.trim();
    if (!observacao) {
      return;
    }

    this.salvandoObservacao = true;
    this.leadsService.adicionarObservacao$(this.leadSelecionado.id, observacao)
      .pipe(finalize(() => (this.salvandoObservacao = false)))
      .subscribe({
        next: (detalhe) => {
          this.novaObservacao = '';
          if (detalhe) {
            this.aplicarDetalheAtualizado(detalhe);
          } else {
            this.recarregarAposMutacao(this.leadSelecionado!.id);
          }
          this.toastr.success('Observação adicionada com sucesso.');
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível adicionar a observação.');
        }
      });
  }

  get resumoResultados(): string {
    return `${this.totalItens} lead(s) encontrado(s)`;
  }

  statusLabel(status: AdminLeadStatus): string {
    return {
      NOVO: 'Novo',
      EM_CONTATO: 'Em contato',
      QUALIFICADO: 'Qualificado',
      CONVERTIDO: 'Convertido',
      DESCARTADO: 'Descartado'
    }[status];
  }

  statusClass(status: AdminLeadStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  origemLabel(origem: AdminLeadOrigem): string {
    return {
      NEWSLETTER: 'Newsletter',
      FORM_CONTATO: 'Formulário',
      CTA_DEMO: 'CTA Demo',
      WHATSAPP: 'WhatsApp'
    }[origem];
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

  private carregarResumo(): void {
    this.carregandoResumo = true;
    this.leadsService.buscarResumo$()
      .pipe(finalize(() => (this.carregandoResumo = false)))
      .subscribe({
        next: (resumo) => {
          this.resumo = resumo;
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar o resumo dos leads.');
        }
      });
  }

  private carregarLista(resolverSelecao = false, leadId: number | null = null): void {
    this.carregandoLista = true;
    this.leadsService.listar$({
      busca: this.busca || null,
      status: this.statusFiltro === 'TODOS' ? null : this.statusFiltro,
      origem: this.origemFiltro === 'TODOS' ? null : this.origemFiltro,
      pagina: this.pagina,
      tamanho: this.tamanho
    })
      .pipe(finalize(() => (this.carregandoLista = false)))
      .subscribe({
        next: (res) => {
          this.leads = res.itens || [];
          this.pagina = res.pagina;
          this.tamanho = res.tamanho;
          this.totalItens = res.totalItens;
          this.totalPaginas = res.totalPaginas;
          if (resolverSelecao) {
            this.resolverSelecao(leadId);
          }
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar a lista de leads.');
        }
      });
  }

  private resolverSelecao(leadId: number | null): void {
    const idSelecionado = leadId && this.leads.some((item) => item.id === leadId)
      ? leadId
      : this.leads[0]?.id;

    if (idSelecionado) {
      this.carregarDetalhe(idSelecionado);
    } else {
      this.leadSelecionado = null;
      this.statusEdicao = null;
    }
  }

  private carregarDetalhe(id: number): void {
    this.carregandoDetalhe = true;
    this.leadsService.buscarPorId$(id)
      .pipe(finalize(() => (this.carregandoDetalhe = false)))
      .subscribe({
        next: (lead) => {
          this.leadSelecionado = lead;
          this.statusEdicao = lead.status;
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar o detalhe do lead.');
        }
      });
  }

  private recarregarAposMutacao(id: number): void {
    this.carregarResumo();
    this.carregarLista(false);
    this.carregarDetalhe(id);
  }

  private aplicarDetalheAtualizado(detalhe: AdminLeadDetalheResponse): void {
    this.leadSelecionado = detalhe;
    this.statusEdicao = detalhe.status;
    this.leads = this.leads.map((item) => item.id === detalhe.id ? detalhe : item);
    this.carregarResumo();
  }
}
