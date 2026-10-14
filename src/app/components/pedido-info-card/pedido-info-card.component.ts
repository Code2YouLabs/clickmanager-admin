import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { ReactiveFormsModule } from '@angular/forms';
import { SectionCardComponent } from '../section-card/section-card.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-pedido-info-card',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    SectionCardComponent,
    StatusBadgeComponent
  ],
  templateUrl: './pedido-info-card.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./pedido-info-card.component.scss']
})
export class PedidoInfoCardComponent {
  @Input() titulo = 'Dados do pedido';
  @Input() renderCard = true;
  @Input() divider = false;

  @Input() pedido: any | null = null;
  @Input() inativo = false;

  get numeroPedido(): string {
    if (!this.pedido) return '';
    if (this.isOrcamento) return this.pedido.numeroOrcamento || '';
    return this.pedido.numero || '';
  }

  get nomeOrcamento(): string {
    return this.pedido?.nomeOrcamento || '';
  }

  get isOrcamento(): boolean {
    return (this.pedido?.status || '').toUpperCase() === 'ORCAMENTO';
  }

  get orcamento(): any {
    return this.pedido?.orcamentoDetalhe || {};
  }

  get statusBadge(): string | null {
    if (this.isOrcamento) {
      return this.orcamento?.status || this.pedido?.status;
    }
    return this.pedido?.status;
  }
}
