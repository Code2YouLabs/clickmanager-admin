import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-input-telefone',
  standalone: true,
  templateUrl: './input-telefone.component.html',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputTelefoneComponent implements OnInit, AfterViewInit {
  @Input() control!: FormControl;
  @Input() label: string = 'Telefone';
  @Input() placeholder: string = '';
  @Input() maxLength: number = 11;

  @ViewChild('input') inputRef!: ElementRef<HTMLInputElement>;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.control) {
      throw new Error('FormControl é obrigatório para <app-input-telefone>');
    }

    const existingValidators = this.control.validator ? [this.control.validator] : [];
    this.control.setValidators([
      ...existingValidators,
      Validators.required,
      this.telefoneValidoValidator()
    ]);
    this.control.updateValueAndValidity();
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();

    const valorAtual = this.control.value;
    if (valorAtual) {
      const raw = this.limparMascara(valorAtual);
      const formatado = this.formatarTelefone(raw);
      this.control.setValue(raw, { emitEvent: false });
      this.inputRef.nativeElement.value = formatado;
    }

    this.control.valueChanges
      .pipe(debounceTime(50))
      .subscribe(value => {
        const raw = this.limparMascara(value ?? '');
        const formatado = this.formatarTelefone(raw);
        if (this.inputRef?.nativeElement) {
          this.inputRef.nativeElement.value = formatado;
        }
      });
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = this.limparMascara(input.value);
    const valorAtual = this.control.value ?? '';

    if (valorAtual !== raw) {
      this.control.setValue(raw, { emitEvent: false });
    }

    input.value = this.formatarTelefone(raw);
  }

  permitirApenasNumeros(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
    const isNumber = /^[0-9]$/.test(event.key);
    if (!isNumber && !allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  private limparMascara(valor: string): string {
    return valor.replace(/\D/g, '');
  }

  private formatarTelefone(value: string): string {
    const digits = this.limparMascara(value);
    if (digits.length <= 10) {
      return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
  }

  private telefoneValidoValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const raw = this.limparMascara(control.value ?? '');
      return raw.length === 10 || raw.length === 11 ? null : { telefoneInvalido: true };
    };
  }

  get isRequired(): boolean {
    return !!this.control?.validator?.({} as AbstractControl)?.['required'];
  }

  errorMessage(): string {
    if (this.control.hasError('required')) return 'Campo obrigatório';
    if (this.control.hasError('telefoneInvalido')) return 'Telefone inválido';
    return '';
  }
}
