import { Component, inject, OnInit, signal } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { RouterModule } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { InputPesquisaComponent } from 'src/app/components/inputs/input-pesquisa/input-pesquisa.component';
import { PedidoService } from '../pedido.service';
import { PedidoListagem } from 'src/app/models/pedido/pedido-listagem.model';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { PageCardComponent } from "src/app/components/page-card/page-card.component";
import { FiltroPesquisaCardComponent } from "src/app/components/filtro-pesquisa-card/filtro-pesquisa-card.component";
import { TabsSectionCardComponent } from "src/app/components/tabs-section-card/tabs-section-card.component";
import { SectionCardComponent } from "src/app/components/section-card/section-card.component";
import { StatusBadgeComponent } from "src/app/components/status-badge/status-badge.component";
import { PedidoTabelaComponent } from "src/app/components/pedido-tabela/pedido-tabela.component";

@Component({
  selector: 'app-listar-pedido',
  standalone: true,
  templateUrl: './listar-pedido.component.html',
  styleUrls: ['./listar-pedido.component.scss'],
  imports: [
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatTabsModule,
    InputPesquisaComponent,
    TemPermissaoDirective,
    PageCardComponent,
    FiltroPesquisaCardComponent,
    TabsSectionCardComponent,
    SectionCardComponent,
    StatusBadgeComponent,
    PedidoTabelaComponent
],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class ListarPedidoComponent implements OnInit {
  private readonly pedidoService = inject(PedidoService);

  pedidos = signal<PedidoListagem[]>([]);
  totalPedidos = 0;
  tamanhoPagina = 10;
  paginaAtual = 0;
  textoPesquisa = '';
  statusSelecionado = 'TODOS';
  statusOptions: string[] = [];
  sortParams: string[] = ['dataCriacao,desc'];
  sortActive = 'dataCriacao';
  sortDirection: 'asc' | 'desc' | '' = 'desc';
  abaAtual: 'todos' | 'orcamentos' | 'rascunhos' = 'todos';

  expandedElement: PedidoListagem | null = null;
  readonly columnsToDisplay = ['numero', 'dataCriacao', 'cliente', 'status', 'total', 'acoes'];
  readonly columnsToDisplayWithExpand = [...this.columnsToDisplay, 'expand'];

  ngOnInit(): void {
    this.carregarStatus();
    this.carregarPedidos();
  }

  carregarStatus(): void {
    this.pedidoService.listarStatus().subscribe(lista => {
      const filtrados = (lista || []).filter(s => s !== 'RASCUNHO' && s !== 'ORCAMENTO');
      this.statusOptions = ['TODOS', ...filtrados];
    });
  }

  carregarPedidos(): void {
    const statusFiltro = this.statusSelecionado !== 'TODOS' ? this.statusSelecionado : undefined;
    this.pedidoService.listar(this.paginaAtual, this.tamanhoPagina, this.textoPesquisa, statusFiltro, this.sortParams)
      .subscribe(pagina => {
        const filtrandoTodos = this.abaAtual === 'todos' && !statusFiltro;
        let conteudo = pagina.content;
        if (filtrandoTodos) {
          conteudo = conteudo.filter(p => p.status !== 'RASCUNHO' && p.status !== 'ORCAMENTO');
        }
        this.pedidos.set(conteudo);
        this.totalPedidos = filtrandoTodos ? conteudo.length : pagina.totalElements;
      });
  }

  onPesquisar(texto: string): void {
    this.textoPesquisa = texto;
    this.paginaAtual = 0;
    this.carregarPedidos();
  }

  onPaginaAlterada(event: PageEvent): void {
    this.paginaAtual = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
    this.carregarPedidos();
  }

  onStatusChange(valor: string): void {
    this.statusSelecionado = valor || 'TODOS';
    this.paginaAtual = 0;
    this.carregarPedidos();
  }

  onSort(sort: Sort): void {
    this.sortActive = sort.active;
    this.sortDirection = sort.direction;

    if (!sort.direction) {
      this.sortParams = [];
      this.carregarPedidos();
      return;
    }

    if (sort.active === 'cliente') {
      this.sortParams = [`cliente,${sort.direction}`];
    } else if (sort.active === 'status' || sort.active === 'orcamentoStatus') {
      this.sortParams = [`status,${sort.direction}`];
    } else if (sort.active === 'orcamentoNome') {
      this.sortParams = [`orcamento.nome,${sort.direction}`];
    } else if (sort.active === 'vencimento') {
      this.sortParams = [`orcamento.vencimento,${sort.direction}`];
    } else if (sort.active === 'total') {
      this.sortParams = [`total,${sort.direction}`, 'dataCriacao,desc'];
    } else {
      this.sortParams = [];
    }

    this.carregarPedidos();
  }

  onTabChange(event: MatTabChangeEvent): void {
    if (event.index === 0) {
      this.abaAtual = 'todos';
      this.statusSelecionado = 'TODOS';
    } else if (event.index === 1) {
      this.abaAtual = 'orcamentos';
      this.statusSelecionado = 'ORCAMENTO';
    } else {
      this.abaAtual = 'rascunhos';
      this.statusSelecionado = 'RASCUNHO';
    }
    this.paginaAtual = 0;
    this.carregarPedidos();
  }

  get dataSource() {
    return this.pedidos();
  }
}
