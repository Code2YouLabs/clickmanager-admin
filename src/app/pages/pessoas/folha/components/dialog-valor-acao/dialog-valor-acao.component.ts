
import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { InputOptionsComponent } from 'src/app/components/inputs/input-options/input-options.component';
import { InputMoedaComponent } from 'src/app/components/inputs/input-moeda/input-moeda.component';
import { InputTextareaComponent } from 'src/app/components/inputs/input-textarea/input-textarea.component';

export interface DialogValorAcaoTipoOption {
  value: string;
  label: string;
}

export interface DialogValorAcaoData {
  titulo: string;
  subtitulo?: string;
  labelTipo?: string;
  tipoInicial?: string;
  tipoOptions?: DialogValorAcaoTipoOption[];
  labelValor?: string;
  valorInicial?: number;
  labelDescricao?: string;
  descricaoInicial?: string;
  descricaoObrigatoria?: boolean;
  botaoConfirmar?: string;
}

export interface DialogValorAcaoResult {
  tipo?: string;
  valor: number;
  descricao?: string;
}

@Component({
  selector: 'app-dialog-valor-acao',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    InputOptionsComponent,
    InputMoedaComponent,
    InputTextareaComponent
],
  templateUrl: './dialog-valor-acao.component.html',
  styleUrl: './dialog-valor-acao.component.scss'
})
export class DialogValorAcaoComponent {
  readonly hasTipo = Array.isArray(this.data.tipoOptions) && this.data.tipoOptions.length > 0;

  form = this.fb.group({
    tipo: [this.data.tipoInicial ?? null, this.hasTipo ? [Validators.required] : []],
    valor: [this.data.valorInicial ?? null, [Validators.required, Validators.min(0.01)]],
    descricao: [
      this.data.descricaoInicial ?? '',
      this.data.descricaoObrigatoria ? [Validators.required, Validators.maxLength(120)] : [Validators.maxLength(120)]
    ]
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: DialogValorAcaoData,
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<DialogValorAcaoComponent>
  ) {}

  get valorControl() {
    return this.form.get('valor') as any;
  }

  get tipoControl() {
    return this.form.get('tipo') as any;
  }

  get descricaoControl() {
    return this.form.get('descricao') as any;
  }

  confirmar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    const valor = Number(raw.valor);
    if (!Number.isFinite(valor) || valor <= 0) return;
    this.dialogRef.close({
      tipo: raw.tipo || undefined,
      valor,
      descricao: (raw.descricao || '').trim() || undefined
    } as DialogValorAcaoResult);
  }
}
