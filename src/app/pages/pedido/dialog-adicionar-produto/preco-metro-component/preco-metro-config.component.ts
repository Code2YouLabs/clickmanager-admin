import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { InputNumericoComponent } from '../../../../components/inputs/input-numerico/input-numerico.component';

type ModoCobranca = 'QUADRADO' | 'LINEAR';

interface PrecoMetroLike {
  tipo: 'METRO';
  precoMetro: number;
  precoMinimo?: number | null;
  alturaMaxima?: number | null;
  larguraMaxima?: number | null;
  modoCobranca: ModoCobranca;
}

@Component({
  selector: 'app-preco-metro-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    CurrencyPipe,
    InputNumericoComponent,
  ],
  templateUrl: './preco-metro-config.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./preco-metro-config.component.scss'],
})
export class PrecoMetroConfigComponent implements OnChanges {
  /** Produto genérico contendo pelo menos .preco (METRO) e metadados de variação para exibir */
  @Input() produto: any = null;

  /** Emite o payload final quando o usuário clica em "Adicionar" */
  @Output() adicionar = new EventEmitter<any>();

  /**
   * Emite o estado de prontidão para avançar.
   * - `true` após clicar em "Adicionar"
   * - `false` ao entrar/editar o formulário
   */
  @Output() readyChange = new EventEmitter<boolean>();

  form: FormGroup = this.fb.group({});
  valorUnitario = 0;
  subTotal = 0;
  areaM2 = 0;

  /** Se foi adicionado (trava inputs e habilita "Próximo" via readyChange) */
  added = false;

  constructor(private fb: FormBuilder) {}

  // Getters de conveniência
  get precoMetro(): PrecoMetroLike | null {
    return this.produto?.preco?.tipo === 'METRO' ? (this.produto.preco as PrecoMetroLike) : null;
  }
  get isLinear(): boolean {
    return this.precoMetro?.modoCobranca === 'LINEAR';
  }
  get alturaPlaceholder(): string {
    const max = this.precoMetro?.alturaMaxima ?? '—';
    return `Altura em cm (máx. ${max}cm)`;
  }
  get larguraPlaceholder(): string {
    const max = this.precoMetro?.larguraMaxima ?? '—';
    return `Largura em cm (máx. ${max}cm)`;
  }

  // Controles tipados
  get alturaControl(): FormControl { return this.form.get('altura') as FormControl; }
  get larguraControl(): FormControl | null { return this.form.get('largura') as FormControl; }
  get quantidadeControl(): FormControl { return this.form.get('quantidade') as FormControl; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['produto'] && this.precoMetro) {
      this.buildForm();
      this.added = false;
      this.readyChange.emit(false);
    }
  }

  private buildForm(): void {
    const p = this.precoMetro!;
    const controls: Record<string, FormControl> = {
      altura: new FormControl<number | null>(null, [
        Validators.required,
        ...(p.alturaMaxima ? [Validators.max(p.alturaMaxima)] : []),
      ]),
      quantidade: new FormControl<number>(1, [Validators.required, Validators.min(1)]),
    };

    if (p.modoCobranca === 'QUADRADO') {
      controls['largura'] = new FormControl<number | null>(null, [
        Validators.required,
        ...(p.larguraMaxima ? [Validators.max(p.larguraMaxima)] : []),
      ]);
    } else {
      // LINEAR: largura fixa; mantemos o control desabilitado para exibir
      controls['largura'] = new FormControl<number | null>({ value: p.larguraMaxima ?? null, disabled: true });
    }

    this.form = this.fb.group(controls);

    this.form.valueChanges.subscribe(raw => {
      // Sempre que o usuário altera, voltamos ao estado "não adicionado"
      if (this.added) {
        this.added = false;
        this.readyChange.emit(false);
      }

      const altura = Number(raw.altura ?? 0);
      const largura = this.isLinear ? (this.precoMetro?.larguraMaxima ?? 0) : Number(raw.largura ?? 0);
      const qtd = Number(raw.quantidade ?? 0);

      this.calcularPreco(altura, largura, qtd);
    });

    // inicializa com valores zerados
    this.calcularPreco(0, 0, 0);
  }

  private calcularPreco(alturaCm: number, larguraCm: number, quantidade: number): void {
    const p = this.precoMetro;
    if (!p) {
      this.valorUnitario = this.subTotal = this.areaM2 = 0;
      return;
    }

    // validações simples
    if (quantidade < 1 || alturaCm <= 0 || (p.modoCobranca === 'QUADRADO' && larguraCm <= 0)) {
      this.valorUnitario = this.subTotal = this.areaM2 = 0;
      return;
    }
    if ((p.alturaMaxima && alturaCm > p.alturaMaxima) || (p.larguraMaxima && larguraCm > p.larguraMaxima)) {
      this.valorUnitario = this.subTotal = this.areaM2 = 0;
      return;
    }

    // área sempre em m² para cálculo QUADRADO; no LINEAR, a "área" é apenas informativa (largura fixa)
    this.areaM2 = p.modoCobranca === 'QUADRADO' ? (alturaCm / 100) * (larguraCm / 100) : (alturaCm / 100) * ((larguraCm ?? 0) / 100);

    const calculado = (p.modoCobranca === 'QUADRADO')
      ? this.areaM2 * (p.precoMetro ?? 0)
      : (alturaCm / 100) * (p.precoMetro ?? 0); // LINEAR: preço por metro (altura), largura fixa embutida

    const minimo = Number(p.precoMinimo ?? 0);
    this.valorUnitario = Math.max(calculado, minimo);
    this.subTotal = this.valorUnitario * quantidade;
  }

    onAdicionar(): void {
    if (this.form.invalid || this.subTotal <= 0) return;

    const raw = this.form.getRawValue();
    const p = this.precoMetro!;
    const largura = this.isLinear ? (p.larguraMaxima ?? null) : raw.largura;

    const payload = {
      produtoId: this.produto?.id,
      nome: this.produto?.nome,
      tipoPreco: p.tipo,
      modoCobranca: p.modoCobranca,
      altura: raw.altura,
      largura,
      quantidade: raw.quantidade,
      areaM2: this.areaM2,
      valorUnitario: this.valorUnitario,
      subTotal: this.subTotal,
      total: this.subTotal,   
    };

    this.adicionar.emit(payload);

    this.added = true;
    this.readyChange.emit(true);
    this.form.disable({ emitEvent: false });
  }


  /** Permite editar novamente após adicionar (volta a travar o "Próximo" no pai) */
  editar(): void {
    this.added = false;
    this.readyChange.emit(false);
    this.form.enable({ emitEvent: false });

    // Se for LINEAR, mantemos largura desabilitada de propósito
    if (this.isLinear) {
      this.larguraControl?.disable({ emitEvent: false });
    }
  }
}
