import { CommonModule } from '@angular/common';
import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { InputOptionsComponent } from 'src/app/components/inputs/input-options/input-options.component';
import { InputMoedaComponent } from 'src/app/components/inputs/input-moeda/input-moeda.component';
import { InputTextareaComponent } from 'src/app/components/inputs/input-textarea/input-textarea.component';
import { FolhaConfiguracaoEmpresa } from '../../models/folha.model';

export interface DialogCriarAcordoData {
  competenciaAtual: string;
  politica?: FolhaConfiguracaoEmpresa;
  salarioBase?: number | null;
}

export interface CriarAcordoDialogResult {
  tipo: 'EMPRESTIMO';
  valorTotal: number;
  parcelas: number;
  competenciaInicio: string;
  descricao?: string;
}

@Component({
  selector: 'app-dialog-criar-acordo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    InputOptionsComponent,
    InputMoedaComponent,
    InputTextareaComponent
  ],
  templateUrl: './dialog-criar-acordo.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './dialog-criar-acordo.component.scss'
})
export class DialogCriarAcordoComponent {
  private readonly maxParcelasPadrao = 60;

  maxParcelasPermitidas = this.maxParcelasPadrao;
  opcoesParcelas = this.montarOpcoesParcelas(this.maxParcelasPermitidas);
  competencias = this.montarCompetencias(this.data.competenciaAtual, 24);
  acordoBloqueado = false;
  limiteValorAcordo: number | null = null;

  form = this.fb.group({
    valorTotal: [null as number | null, [Validators.required, Validators.min(1)]],
    parcelas: [3, [Validators.required, Validators.min(1), Validators.max(this.maxParcelasPadrao)]],
    competenciaInicio: [this.competencias[1] || this.competencias[0] || '', [Validators.required, Validators.pattern(/^\d{4}-\d{2}$/)]],
    descricao: ['', [Validators.maxLength(120)]]
  });

  get valorTotalControl() {
    return this.form.get('valorTotal') as any;
  }

  get parcelasControl() {
    return this.form.get('parcelas') as any;
  }

  get competenciaInicioControl() {
    return this.form.get('competenciaInicio') as any;
  }

  get descricaoControl() {
    return this.form.get('descricao') as any;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: DialogCriarAcordoData,
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<DialogCriarAcordoComponent>
  ) {
    this.aplicarPoliticaDaEmpresa();
  }

  confirmar(): void {
    if (this.acordoBloqueado) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const valor = Number(v.valorTotal);
    if (!Number.isFinite(valor) || valor <= 0) return;
    if (this.limiteValorAcordo !== null && valor > this.limiteValorAcordo) {
      this.valorTotalControl.setErrors({ maxPolitica: true });
      this.valorTotalControl.markAsTouched();
      return;
    }

    const result: CriarAcordoDialogResult = {
      tipo: 'EMPRESTIMO',
      valorTotal: valor,
      parcelas: Math.max(1, Number(v.parcelas || 1)),
      competenciaInicio: v.competenciaInicio!,
      descricao: (v.descricao || '').trim() || undefined
    };
    this.dialogRef.close(result);
  }

  get mensagemBloqueioAcordo(): string {
    if (!this.acordoBloqueado) return '';
    return 'Empréstimo não permitido para esta empresa na configuração da folha.';
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

  private aplicarPoliticaDaEmpresa(): void {
    const politica = this.data.politica;
    if (!politica) return;

    const permiteEmprestimo = Boolean(politica.permitirEmprestimo);
    if (!permiteEmprestimo) {
      this.acordoBloqueado = true;
      this.form.disable({ emitEvent: false });
      return;
    }

    const maxParcelasConfig = Number(politica.maxParcelasEmprestimo || 0);
    this.maxParcelasPermitidas = maxParcelasConfig > 0 ? maxParcelasConfig : this.maxParcelasPadrao;
    this.opcoesParcelas = this.montarOpcoesParcelas(this.maxParcelasPermitidas);
    this.parcelasControl.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(this.maxParcelasPermitidas)
    ]);
    if (Number(this.parcelasControl.value || 1) > this.maxParcelasPermitidas) {
      this.parcelasControl.setValue(this.maxParcelasPermitidas, { emitEvent: false });
    }
    const atual = Number(this.parcelasControl.value || 1);
    if (!Number.isFinite(atual) || atual < 1) {
      this.parcelasControl.setValue(Math.min(3, this.maxParcelasPermitidas), { emitEvent: false });
    }
    this.parcelasControl.updateValueAndValidity({ emitEvent: false });

    const carencia = Number(politica.carenciaMinCompetencias || 0);
    if (carencia > 0 && this.competencias.length > carencia) {
      this.competencias = this.competencias.slice(carencia);
      this.form.patchValue({ competenciaInicio: this.competencias[0] || '' }, { emitEvent: false });
    }

    const limitePercentual = Number(politica.limitePercentualSalario || 0);
    const salarioBase = Number(this.data.salarioBase || 0);
    if (limitePercentual > 0 && salarioBase > 0) {
      this.limiteValorAcordo = Number(((salarioBase * limitePercentual) / 100).toFixed(2));
    }
  }

  private montarOpcoesParcelas(max: number): Array<{ id: number; nome: string }> {
    const limite = Number.isFinite(max) && max > 0 ? Math.trunc(max) : this.maxParcelasPadrao;
    return Array.from({ length: limite }, (_, i) => ({ id: i + 1, nome: `${i + 1}` }));
  }
}
