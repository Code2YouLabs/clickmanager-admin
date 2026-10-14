import { CommonModule } from '@angular/common';
import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { InputOptionsComponent } from 'src/app/components/inputs/input-options/input-options.component';
import { InputTextareaComponent } from 'src/app/components/inputs/input-textarea/input-textarea.component';

export interface RenegociarAcordoResumo {
  id: number;
  tipo: 'ADIANTAMENTO' | 'EMPRESTIMO';
  descricao: string;
  saldoEmAberto: number;
  parcelasEmAberto: number;
}

export interface DialogRenegociarAcordosData {
  competenciaAtual: string;
  acordos: RenegociarAcordoResumo[];
}

export interface RenegociarAcordosDialogResult {
  acordoIds: number[];
  competenciaInicio: string;
  competenciaFim: string;
  parcelas: number;
  descricao?: string;
}

@Component({
  selector: 'app-dialog-renegociar-acordos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    InputOptionsComponent,
    InputTextareaComponent
  ],
  templateUrl: './dialog-renegociar-acordos.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './dialog-renegociar-acordos.component.scss'
})
export class DialogRenegociarAcordosComponent {
  readonly competencias = this.montarCompetencias(this.data.competenciaAtual, 24);
  readonly competenciaOptions = this.competencias.map((c) => ({ id: c, nome: c }));

  form = this.fb.group({
    acordoIds: [this.data.acordos.map((a) => a.id), [DialogRenegociarAcordosComponent.arrayObrigatorio]],
    competenciaInicio: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]],
    competenciaFim: ['', [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]],
    descricao: ['', [Validators.maxLength(160)]]
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: DialogRenegociarAcordosData,
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<DialogRenegociarAcordosComponent>
  ) {
    const inicioPadrao = this.competencias[1] || this.competencias[0] || '';
    const fimPadrao = this.fimPadraoAteDezembro(inicioPadrao);
    this.form.patchValue({
      competenciaInicio: inicioPadrao,
      competenciaFim: fimPadrao
    });

    this.competenciaInicioControl.valueChanges.subscribe((inicio: string | null) => {
      const fimAtual = this.competenciaFimControl.value || '';
      const opcoesFim = this.competenciasFim;
      if (!opcoesFim.includes(fimAtual)) {
        this.competenciaFimControl.setValue(this.fimPadraoAteDezembro(inicio || ''), { emitEvent: false });
      }
    });
  }

  get acordoIdsControl() {
    return this.form.get('acordoIds') as any;
  }

  get competenciaInicioControl() {
    return this.form.get('competenciaInicio') as any;
  }

  get competenciaFimControl() {
    return this.form.get('competenciaFim') as any;
  }

  get descricaoControl() {
    return this.form.get('descricao') as any;
  }

  get competenciasFim(): string[] {
    const inicio = this.competenciaInicioControl.value || '';
    return inicio ? this.competencias.filter((c) => c >= inicio) : this.competencias;
  }

  get acordosSelecionados(): RenegociarAcordoResumo[] {
    const selecionados = new Set<number>(this.acordoIdsControl.value || []);
    return this.data.acordos.filter((a) => selecionados.has(a.id));
  }

  get totalAbertoSelecionado(): number {
    return this.acordosSelecionados.reduce((acc, a) => acc + Number(a.saldoEmAberto || 0), 0);
  }

  get parcelasPrevistas(): number {
    const inicio = this.competenciaInicioControl.value || '';
    const fim = this.competenciaFimControl.value || '';
    if (!inicio || !fim || fim < inicio) return 0;
    return this.diffCompetencias(inicio, fim) + 1;
  }

  get valorParcelaEstimado(): number {
    if (this.parcelasPrevistas <= 0) return 0;
    return this.totalAbertoSelecionado / this.parcelasPrevistas;
  }

  isSelecionado(agreementId: number): boolean {
    const ids = this.acordoIdsControl.value || [];
    return ids.includes(agreementId);
  }

  toggleAcordo(agreementId: number, checked: boolean): void {
    const ids = [...(this.acordoIdsControl.value || [])];
    const has = ids.includes(agreementId);
    if (checked && !has) ids.push(agreementId);
    if (!checked && has) ids.splice(ids.indexOf(agreementId), 1);
    this.acordoIdsControl.setValue(ids);
    this.acordoIdsControl.markAsTouched();
  }

  selecionarTodos(): void {
    this.acordoIdsControl.setValue(this.data.acordos.map((a) => a.id));
    this.acordoIdsControl.markAsTouched();
  }

  limparSelecao(): void {
    this.acordoIdsControl.setValue([]);
    this.acordoIdsControl.markAsTouched();
  }

  confirmar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.parcelasPrevistas <= 0) return;

    const v = this.form.getRawValue();
    const result: RenegociarAcordosDialogResult = {
      acordoIds: [...(v.acordoIds || [])],
      competenciaInicio: v.competenciaInicio || '',
      competenciaFim: v.competenciaFim || '',
      parcelas: this.parcelasPrevistas,
      descricao: (v.descricao || '').trim() || undefined
    };
    this.dialogRef.close(result);
  }

  private static arrayObrigatorio(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    return Array.isArray(value) && value.length > 0 ? null : { required: true };
  }

  private montarCompetencias(base: string, quantidade: number): string[] {
    const [anoStr, mesStr] = (base || '').split('-');
    let ano = Number(anoStr);
    let mes = Number(mesStr);
    if (!Number.isFinite(ano) || !Number.isFinite(mes) || mes < 1 || mes > 12) {
      const agora = new Date();
      ano = agora.getFullYear();
      mes = agora.getMonth() + 1;
    }

    const lista: string[] = [];
    for (let i = 0; i < quantidade; i++) {
      const dt = new Date(ano, mes - 1 + i, 1);
      lista.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`);
    }
    return lista;
  }

  private fimPadraoAteDezembro(inicio: string): string {
    if (!inicio) return this.competencias[0] || '';
    const ano = Number(inicio.split('-')[0]);
    const dezembro = `${ano}-12`;
    const opcoesFim = this.competencias.filter((c) => c >= inicio);
    if (opcoesFim.includes(dezembro)) return dezembro;
    return opcoesFim[opcoesFim.length - 1] || inicio;
  }

  private diffCompetencias(inicio: string, fim: string): number {
    const [anoInicio, mesInicio] = inicio.split('-').map((v) => Number(v));
    const [anoFim, mesFim] = fim.split('-').map((v) => Number(v));
    return (anoFim - anoInicio) * 12 + (mesFim - mesInicio);
  }
}
