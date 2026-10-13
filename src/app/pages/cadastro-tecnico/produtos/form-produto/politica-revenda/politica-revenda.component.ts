
import {
  Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges
} from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subscription } from 'rxjs';

// se quiser usar seus inputs customizados, importe-os aqui
// import { InputMoedaComponent } from '../inputs/input-moeda/input-moeda.component';

export interface PoliticaRevenda {
  id?: number;
  percentual: boolean;
  percentualDesconto?: number | null;
  precoFixo?: number | null;
}

@Component({
  selector: 'app-politica-revenda',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatSlideToggleModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule
],
  templateUrl: './politica-revenda.component.html'
})
export class PoliticaRevendaComponent implements OnInit, OnChanges, OnDestroy {

  @Input() formGroup!: FormGroup;                 // form pai (Produto)
  @Input() value: PoliticaRevenda | null = null;  // valor inicial (ex.: vindo do back)
  @Output() valueChange = new EventEmitter<PoliticaRevenda | null>();

  private subs: Subscription[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.ensureControls();
    this.patchFromValue(this.value);
    this.wireChanges();
    this.applyValidators();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && !changes['value'].firstChange) {
      this.patchFromValue(changes['value'].currentValue);
      this.applyValidators();
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  // =============== Controls helpers ===============

  private ensureControls(): void {
    if (!this.formGroup) return;

    if (!this.formGroup.contains('politicaAtiva')) {
      this.formGroup.addControl('politicaAtiva', new FormControl(false));
    }
    if (!this.formGroup.contains('politicaRevenda')) {
      this.formGroup.addControl('politicaRevenda', this.fb.group({
        percentual: [true],
        percentualDesconto: [null],
        precoFixo: [null]
      }));
    }
  }

  get ativaCtrl(): FormControl {
    return this.formGroup.get('politicaAtiva') as FormControl;
  }
  get grp(): FormGroup {
    return this.formGroup.get('politicaRevenda') as FormGroup;
  }
  get isPercentual(): boolean {
    return !!this.grp?.get('percentual')?.value;
  }

  // =============== Patch & Normalize ===============

  private patchFromValue(val: PoliticaRevenda | null): void {
    if (!this.formGroup) return;

    const ativa = !!val;
    this.ativaCtrl.setValue(ativa, { emitEvent: false });

    if (val) {
      this.grp.patchValue({
        percentual: !!val.percentual,
        percentualDesconto: val.percentual ? (val.percentualDesconto ?? null) : null,
        precoFixo: !val.percentual ? (val.precoFixo ?? null) : null
      }, { emitEvent: false });
    } else {
      this.grp.patchValue({
        percentual: true,
        percentualDesconto: null,
        precoFixo: null
      }, { emitEvent: false });
    }
  }

  private normalize(): PoliticaRevenda | null {
    const ativa = !!this.ativaCtrl.value;
    if (!ativa) return null;

    const percentual = !!this.grp.get('percentual')?.value;
    const percentualDesconto = this.numOrNull(this.grp.get('percentualDesconto')?.value);
    const precoFixo = this.numOrNull(this.grp.get('precoFixo')?.value);

    return {
      percentual,
      percentualDesconto: percentual ? percentualDesconto : undefined,
      precoFixo: !percentual ? precoFixo : undefined
    };
  }

  // =============== Validators & Wiring ===============

  private applyValidators(): void {
    const ativa = !!this.ativaCtrl.value;
    const pctCtrl = this.grp.get('percentualDesconto') as FormControl;
    const fixoCtrl = this.grp.get('precoFixo') as FormControl;
    const isPct = !!this.grp.get('percentual')?.value;

    pctCtrl.clearValidators();
    fixoCtrl.clearValidators();

    if (!ativa) {
      pctCtrl.setValue(null, { emitEvent: false });
      fixoCtrl.setValue(null, { emitEvent: false });
      pctCtrl.disable({ emitEvent: false });
      fixoCtrl.disable({ emitEvent: false });
    } else if (isPct) {
      pctCtrl.enable({ emitEvent: false });
      fixoCtrl.disable({ emitEvent: false });
      fixoCtrl.setValue(null, { emitEvent: false });
      pctCtrl.setValidators([Validators.required, Validators.min(0.01), Validators.max(100)]);
    } else {
      fixoCtrl.enable({ emitEvent: false });
      pctCtrl.disable({ emitEvent: false });
      pctCtrl.setValue(null, { emitEvent: false });
      fixoCtrl.setValidators([Validators.required, Validators.min(0.01)]);
    }

    this.grp.updateValueAndValidity({ emitEvent: false });
    this.formGroup.updateValueAndValidity({ emitEvent: false });
  }

  private wireChanges(): void {
    this.subs.push(
      this.ativaCtrl.valueChanges.subscribe(() => {
        this.applyValidators();
        this.valueChange.emit(this.normalize());
      }),
      this.grp.get('percentual')!.valueChanges.subscribe(() => {
        this.applyValidators();
        this.valueChange.emit(this.normalize());
      }),
      this.grp.get('percentualDesconto')!.valueChanges.subscribe(() => {
        this.valueChange.emit(this.normalize());
      }),
      this.grp.get('precoFixo')!.valueChanges.subscribe(() => {
        this.valueChange.emit(this.normalize());
      }),
    );
  }

  // =============== Utils ===============
  private numOrNull(v: any): number | null {
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
}
