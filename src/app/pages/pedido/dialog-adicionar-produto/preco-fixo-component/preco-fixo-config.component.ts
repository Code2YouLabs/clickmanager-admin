import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { InputNumericoComponent } from 'src/app/components/inputs/input-numerico/input-numerico.component';

@Component({
    selector: 'app-preco-fixo-config',
    standalone: true,
    templateUrl: './preco-fixo-config.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
      CommonModule,
      ReactiveFormsModule,
      MatButtonModule,
      CurrencyPipe,
      InputNumericoComponent
    ]
  })
  export class PrecoFixoConfigComponent {
    @Input() produto: any;
    @Output() adicionar = new EventEmitter<any>();
  
    form: FormGroup;
    subTotal = 0;
  
    constructor(private fb: FormBuilder) {
      this.form = this.fb.group({
        quantidade: [1, [Validators.required, Validators.min(1)]]
      });
  
      // Atualiza valor total sempre que a quantidade muda
      this.form.get('quantidade')?.valueChanges.subscribe(qtd => {
        this.atualizarValorTotal(qtd);
      });
    }
  
    ngOnChanges(): void {
      // Recalcula quando um novo produto for recebido
      if (this.produto) {
        this.atualizarValorTotal(this.form.value.quantidade);
      }
    }
  
    atualizarValorTotal(quantidade: number): void {
      const precoUnitario = this.produto?.preco?.valor || 0;
      this.subTotal = quantidade * precoUnitario;
    }
  
    onAdicionar(): void {
      if (this.form.invalid) return;
  
      this.adicionar.emit({
        produtoId: this.produto.id,
        nome: this.produto.nome,
        tipoPreco: this.produto.preco.tipo,
        quantidade: this.form.value.quantidade,
        valor: this.produto.preco.valor,
        subTotal: this.subTotal
      });
    }
  
    get quantidadeControl(): FormControl {
      return this.form.get('quantidade') as FormControl;
    }
  }
