import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SectionCardComponent } from '../section-card/section-card.component';

export interface ItemPedidoView {
  descricao: string;
  quantidade: number;
  valor: number;
  subTotal?: number;
}

@Component({
  selector: 'app-itens-pedido-section',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    SectionCardComponent
  ],
  templateUrl: './itens-pedido-section.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./itens-pedido-section.component.scss']
})
export class ItensPedidoSectionComponent {
  @Input() itens: ItemPedidoView[] = [];
  @Input() subtotal: number = 0;
  @Input() permitirAlterarQuantidade: boolean = true;
  @Input() mostrarAcoes: boolean = true;
  @Input() inativo = false;

  @Output() buscarProdutos = new EventEmitter<void>();
  @Output() descreverItens = new EventEmitter<void>();
  @Output() removerItem = new EventEmitter<number>();
  @Output() alterarQuantidade = new EventEmitter<{ index: number; quantidade: number }>();

  onQtdChange(index: number, valor: any): void {
    if (!this.permitirAlterarQuantidade) return;
    const qtd = Math.max(1, Number(valor) || 1);
    this.alterarQuantidade.emit({ index, quantidade: qtd });
  }
}
