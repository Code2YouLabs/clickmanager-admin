import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { SectionCardComponent } from '../section-card/section-card.component';
import { InputOptionsComponent } from '../inputs/input-options/input-options.component';
import { SharedComponentsModule } from '../shared-components.module';

@Component({
  selector: 'app-pagamentos-section',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    SectionCardComponent,
    InputOptionsComponent,
    SharedComponentsModule
  ],
  templateUrl: './pagamentos-section.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./pagamentos-section.component.scss']
})
export class PagamentosSectionComponent implements OnChanges, OnDestroy {
  @Input() pagamentoNovo: FormGroup | null = null;
  @Input() pagamentosControls: FormGroup[] = [];
  @Input() formasPagamento: any[] = [];
  @Input() pago: number = 0;
  @Input() restante: number = 0;
  @Input() pagamentosLista: any[] = [];
  @Input() expanded: boolean = false;
  @Input() mostrarAcoes: boolean = true;
  @Input() mostrarConfirmado: boolean = true;
  @Input() mostrarData: boolean = true;
  @Input() inativo: boolean = false;

  @Output() addPagamento = new EventEmitter<void>();
  @Output() removerPagamento = new EventEmitter<number>();

  private formaSub?: Subscription;
  private ajustandoValor = false;

  get formaControl(): FormControl {
    return (this.pagamentoNovo as FormGroup)?.get('forma') as FormControl;
  }

  get valorControl(): FormControl {
    return (this.pagamentoNovo as FormGroup)?.get('valor') as FormControl;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pagamentoNovo'] || changes['pagamentosLista'] || changes['restante'] || changes['pagamentosControls']) {
      this.bindAutoValorRestante();
    }

    const temPagamentoLista = (this.pagamentosLista?.length || 0) > 0;
    const temPagamentoControls = (this.pagamentosControls?.length || 0) > 0;
    if ((temPagamentoLista || temPagamentoControls) && !this.expanded) {
      this.expanded = true;
    }
  }

  ngOnDestroy(): void {
    this.formaSub?.unsubscribe();
  }

  valorValido(): boolean {
    const valor = Number(this.valorControl?.value) || 0;
    return this.restante <= 0 ? valor === 0 : valor <= this.restante;
  }

  expandPanel(): void {
    this.expanded = true;
  }

  private bindAutoValorRestante(): void {
    this.formaSub?.unsubscribe();
    if (!this.pagamentoNovo) return;

    const ctrl = this.formaControl;
    this.formaSub = ctrl.valueChanges.subscribe((novoValor) => {
      this.applyValorRestante(novoValor);
    });
  }

  private applyValorRestante(novaForma: any): void {
    if (!this.pagamentoNovo || this.inativo) return;
    // só preenche automaticamente quando já existem pagamentos e o usuário escolher uma forma válida
    const jaTemPagamentos =
      (this.pagamentosLista?.length || 0) > 0 || (this.pagamentosControls?.length || 0) > 0;
    if (!jaTemPagamentos || !novaForma) return;

    if (this.restante > 0 && this.valorControl.value !== this.restante) {
      this.ajustandoValor = true;
      this.valorControl.setValue(this.restante, { emitEvent: true });
      this.ajustandoValor = false;
    }
  }
}
