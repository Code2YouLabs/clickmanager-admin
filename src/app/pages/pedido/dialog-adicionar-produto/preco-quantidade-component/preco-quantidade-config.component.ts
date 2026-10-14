import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-preco-quantidade-config',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatRadioModule, CurrencyPipe, MatCardModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './preco-quantidade-config.component.html'
})
export class PrecoQuantidadeConfigComponent implements OnInit {
  @Input() produto: any;
  @Output() adicionar = new EventEmitter<any>();

  faixaSelecionada: any = null;
  valorTotal = 0;

  ngOnInit(): void {
    if (this.produto?.preco?.faixas?.length) {
      this.faixaSelecionada = this.produto.preco.faixas[0];
      this.atualizarValorTotal();
    }
  }

  selecionarFaixa(faixa: any): void {
    this.faixaSelecionada = faixa;
    this.atualizarValorTotal();
  }

  atualizarValorTotal(): void {
    if (this.faixaSelecionada) {
      this.valorTotal = this.faixaSelecionada.quantidade * this.faixaSelecionada.valor;
    }
  }

  onAdicionar(): void {
    if (!this.faixaSelecionada) return;

    this.adicionar.emit({
      produtoId: this.produto.id,
      nome: this.produto.nome,
      tipoPreco: this.produto.preco.tipo,
      quantidade: this.faixaSelecionada.quantidade,
      valor: this.faixaSelecionada.valor / this.faixaSelecionada.quantidade,
      subTotal: this.faixaSelecionada.valor
    });
  }
}
