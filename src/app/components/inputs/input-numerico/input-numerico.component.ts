import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import {
  FormControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { DsFieldComponent } from 'src/app/ui/field';
import { DsInputDirective } from 'src/app/ui/input';

@Component({
  selector: 'app-input-numerico',
  standalone: true,
  templateUrl: './input-numerico.component.html',
  imports: [
    ReactiveFormsModule,
    DsFieldComponent,
    DsInputDirective
],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputNumericoComponent implements OnInit {

  @Input() control!: FormControl;
  @Input() label: string = 'Número';
  @Input() placeholder: string = '';
  @Input() valor = '';

  readonly inputId: string = `input-numerico-${Math.random().toString(36).slice(2, 9)}`;

  private onChange = (value: any) => {};
  private onTouched = () => {};

  ngOnInit(): void {
    if (!this.control) {
      throw new Error('O FormControl é obrigatório para <app-input-numerico>');
    }

    // Nada de min/max aqui — o pai define!
    this.control.updateValueAndValidity();
  }

  get errorTexto(): string {
    return this.control.invalid && this.control.touched ? this.errorMessage() : '';
  }

  errorMessage(): string {
    if (this.control.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (this.control.hasError('maxlength')) {
      return `Máximo de ${this.control.getError('maxlength')?.requiredLength} caracteres`;
    }
    if (this.control.hasError('max')) {
      const requiredMax = this.control.getError('max')?.max;
      return `Valor máximo permitido é ${requiredMax}`;
    }
    if (this.control.hasError('min')) {
      const requiredMin = this.control.getError('min')?.min;
      return `Valor mínimo permitido é ${requiredMin}`;
    }
    return 'Valor inválido';
  }

  get isRequired(): boolean {
    return this.control?.validator?.({} as any)?.['required'] ?? false;
  }

  writeValue(value: any): void {
    this.valor = value ?? '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  permitirApenasNumeros(event: KeyboardEvent): void {
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
    const isNumber = /^[0-9]$/.test(event.key);
    if (!isNumber && !allowedKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  atualizarValor(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.valor = value;
    this.onChange(value);
    this.onTouched();
  }
}
