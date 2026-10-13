import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { InputNumericoComponent } from 'src/app/components/inputs/input-numerico/input-numerico.component';
import { FaixaDemanda } from 'src/app/models/preco/faixa-demanda.model';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-preco-demanda-config',
  standalone: true,
  templateUrl: './preco-demanda-config.component.html',
  imports: [InputNumericoComponent, CurrencyPipe, ReactiveFormsModule, MatButtonModule]
})
export class PrecoDemandaConfigComponent {
  @Input() produto: any;
  @Output() adicionar = new EventEmitter<any>();

  form: FormGroup;
  valorUnitario = 0;
  subTotal = 0;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      quantidade: [1, [Validators.required, Validators.min(1)]]
    });

    this.form.get('quantidade')?.valueChanges.subscribe(qtd => {
      this.atualizarValores(qtd);
    });
  }

  atualizarValores(qtd: number): void {
    const faixas: FaixaDemanda[] = this.produto?.preco?.faixas || [];

    let faixaSelecionada = faixas.find(faixa => qtd >= faixa.de && qtd <= faixa.ate);

    if (!faixaSelecionada) {
      faixaSelecionada = [...faixas]
        .filter(f => f.de <= qtd)
        .sort((a, b) => b.de - a.de)[0];
    }

    this.valorUnitario = faixaSelecionada?.valorUnitario || 0;
    this.subTotal = qtd * this.valorUnitario;
  }

  onAdicionar(): void {
    if (this.form.invalid) return;

    const quantidade = this.form.value.quantidade;

    this.adicionar.emit({
      produtoId: this.produto.id,
      nome: this.produto.nome,
      tipoPreco: this.produto.preco.tipo,
      quantidade,
      valor: this.valorUnitario,
      subTotal: this.subTotal
    });
  }

  get quantidadeControl(): FormControl {
    return this.form.get('quantidade') as FormControl;
  }
}
