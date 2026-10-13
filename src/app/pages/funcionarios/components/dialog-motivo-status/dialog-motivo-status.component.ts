
import { Component, Inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface DialogMotivoStatusData {
  titulo?: string;
  mensagem: string;
  acaoLabel?: string;
  mostrarDataEfetiva?: boolean;
  dataObrigatoria?: boolean;
  labelDataEfetiva?: string;
  dataInicial?: string;
}

export interface DialogMotivoStatusResult {
  motivo: string;
  dataEfetiva?: string;
}

@Component({
  selector: 'app-dialog-motivo-status',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
],
  template: `
    <h2 mat-dialog-title>{{ data.titulo || 'Confirmar ação' }}</h2>
    <mat-dialog-content>
      <p class="m-b-12">{{ data.mensagem }}</p>

      @if (data.mostrarDataEfetiva) {
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>{{ data.labelDataEfetiva || 'Data efetiva' }}</mat-label>
          <input matInput type="date" [formControl]="dataEfetivaControl" />
          @if (dataEfetivaControl.touched && dataEfetivaControl.invalid) {
            <mat-error>
              Data efetiva é obrigatória
            </mat-error>
          }
        </mat-form-field>
      }

      <mat-form-field appearance="outline" class="w-100">
        <mat-label>Motivo</mat-label>
        <textarea
          matInput
          [formControl]="motivoControl"
          rows="3"
          maxlength="240"
          placeholder="Informe o motivo"
        ></textarea>
        <mat-hint align="end">{{ (motivoControl.value || '').length }}/240</mat-hint>
        @if (motivoControl.touched && motivoControl.invalid) {
          <mat-error>
            Motivo é obrigatório
          </mat-error>
        }
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="confirmar()" [disabled]="formInvalido">
        {{ data.acaoLabel || 'Confirmar' }}
      </button>
    </mat-dialog-actions>
    `
})
export class DialogMotivoStatusComponent {
  motivoControl = new FormControl('', [Validators.required, Validators.maxLength(240)]);
  dataEfetivaControl = new FormControl('');

  constructor(
    public dialogRef: MatDialogRef<DialogMotivoStatusComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogMotivoStatusData
  ) {
    this.dataEfetivaControl.setValue(data.dataInicial || this.dataAtualISO());
    if (data.dataObrigatoria) {
      this.dataEfetivaControl.addValidators([Validators.required]);
      this.dataEfetivaControl.updateValueAndValidity();
    }
  }

  get formInvalido(): boolean {
    return this.motivoControl.invalid || (!!this.data.mostrarDataEfetiva && this.dataEfetivaControl.invalid);
  }

  confirmar(): void {
    this.motivoControl.markAsTouched();
    this.dataEfetivaControl.markAsTouched();
    if (this.formInvalido) return;

    const result: DialogMotivoStatusResult = {
      motivo: (this.motivoControl.value || '').trim(),
      dataEfetiva: this.data.mostrarDataEfetiva
        ? (this.dataEfetivaControl.value || '').trim() || undefined
        : undefined
    };
    this.dialogRef.close(result);
  }

  private dataAtualISO(): string {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = `${agora.getMonth() + 1}`.padStart(2, '0');
    const dia = `${agora.getDate()}`.padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}
