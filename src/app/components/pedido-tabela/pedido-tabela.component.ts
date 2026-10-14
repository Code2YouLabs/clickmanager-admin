import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { PedidoListagem } from 'src/app/models/pedido/pedido-listagem.model';

@Component({
  selector: 'app-pedido-tabela',
  standalone: true,
  templateUrl: './pedido-tabela.component.html',
  styleUrls: ['./pedido-tabela.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    StatusBadgeComponent
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ]
})
export class PedidoTabelaComponent {
  @Input() data: PedidoListagem[] = [];
  @Input() total = 0;
  @Input() pageSize = 10;
  @Input() sortActive = 'dataCriacao';
  @Input() sortDirection: 'asc' | 'desc' | '' = 'desc';
  @Input() mostrarNumero = true;
  @Input() mostrarOrcamento = false;
  @Input() mostrarStatus = true;

  @Output() pageChange = new EventEmitter<PageEvent>();
  @Output() sortChange = new EventEmitter<Sort>();

  expandedElement: PedidoListagem | null = null;

  get columnsToDisplay(): string[] {
    const cols: string[] = [];

    if (this.mostrarOrcamento) {
      cols.push('orcamentoNumero', 'orcamentoNome', 'vencimento');
    } else if (this.mostrarNumero) {
      cols.push('numero');
    }

    cols.push('dataCriacao', 'cliente');

    if (this.mostrarStatus) {
      cols.push(this.mostrarOrcamento ? 'orcamentoStatus' : 'status');
    }

    cols.push('total', 'acoes');

    return cols;
  }

  get columnsToDisplayWithExpand(): string[] {
    return [...this.columnsToDisplay, 'expand'];
  }

  onSort(sort: Sort): void {
    this.sortChange.emit(sort);
  }

  onPage(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
