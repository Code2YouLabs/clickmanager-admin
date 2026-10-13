
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export interface CriarCompetenciaDialogResult {
  ano: number;
  meses: number[];
}

@Component({
  selector: 'app-dialog-criar-competencia',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
],
  templateUrl: './dialog-criar-competencia.component.html',
  styleUrl: './dialog-criar-competencia.component.scss'
})
export class DialogCriarCompetenciaComponent {
  readonly anoAtual = new Date().getFullYear();
  readonly meses = [
    { id: 1, nome: 'Janeiro' },
    { id: 2, nome: 'Fevereiro' },
    { id: 3, nome: 'Março' },
    { id: 4, nome: 'Abril' },
    { id: 5, nome: 'Maio' },
    { id: 6, nome: 'Junho' },
    { id: 7, nome: 'Julho' },
    { id: 8, nome: 'Agosto' },
    { id: 9, nome: 'Setembro' },
    { id: 10, nome: 'Outubro' },
    { id: 11, nome: 'Novembro' },
    { id: 12, nome: 'Dezembro' }
  ];

  form = this.fb.group({
    meses: [<number[]>[], [Validators.required]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<DialogCriarCompetenciaComponent>
  ) {}

  confirmar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const result: CriarCompetenciaDialogResult = {
      ano: this.anoAtual,
      meses: (v.meses || []).slice().sort((a, b) => a - b)
    };
    this.dialogRef.close(result);
  }
}
