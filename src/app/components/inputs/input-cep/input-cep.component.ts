
import { ChangeDetectionStrategy, Component, Input, OnInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { debounceTime } from 'rxjs/operators';
import { CepUtilService } from 'src/app/utils/cep-util.service';
import { EnderecoViaCep } from 'src/app/models/endereco/endereco.viacep.model';

@Component({
  selector: 'app-input-cep',
  standalone: true,
  templateUrl: './input-cep.component.html',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputCepComponent implements OnInit {
  @Input() control!: FormControl;
  @Input() label: string = 'CEP';
  @Input() placeholder: string = '00000-000';
  @Input() autoBuscar = true;
  @Output() enderecoEncontrado = new EventEmitter<EnderecoViaCep | null>();

  @ViewChild('input') inputRef!: ElementRef<HTMLInputElement>;

  carregando = false;

  constructor(private cepService: CepUtilService) {}

  ngOnInit(): void {
    if (!this.control) {
      throw new Error('FormControl é obrigatório para <app-input-cep>');
    }
    const validators = this.control.validator ? [this.control.validator] : [];
    this.control.setValidators([...validators, this.cepValidator()]);
    this.control.updateValueAndValidity({ emitEvent: false });

    this.control.valueChanges.pipe(debounceTime(50)).subscribe((valor) => {
      const raw = this.limpar(valor ?? '');
      const formatado = this.formatar(raw);
      if (this.inputRef?.nativeElement) {
        this.inputRef.nativeElement.value = formatado;
      }
    });
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = this.limpar(input.value);
    this.control.setValue(raw, { emitEvent: false });
    input.value = this.formatar(raw);
  }

  onBlur(): void {
    if (!this.autoBuscar) return;
    const raw = this.limpar(this.control.value ?? '');
    if (raw.length !== 8) {
      this.enderecoEncontrado.emit(null);
      return;
    }

    this.carregando = true;
    this.cepService.buscarEndereco(raw).subscribe((endereco) => {
      this.carregando = false;
      this.enderecoEncontrado.emit(endereco);
    });
  }

  private limpar(valor: string): string {
    return String(valor).replace(/\D/g, '').slice(0, 8);
  }

  private formatar(raw: string): string {
    const digits = this.limpar(raw);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
  }

  private cepValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const raw = this.limpar(control.value ?? '');
      if (!raw) return null;
      return raw.length === 8 ? null : { cepInvalido: true };
    };
  }

  get isRequired(): boolean {
    return !!this.control?.validator?.({} as AbstractControl)?.['required'];
  }

  errorMessage(): string {
    if (this.control.hasError('required')) return 'Campo obrigatório';
    if (this.control.hasError('cepInvalido')) return 'CEP inválido';
    return 'Valor inválido';
  }
}
