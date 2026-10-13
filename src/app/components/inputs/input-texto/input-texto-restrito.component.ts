import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DsFieldComponent } from 'src/app/ui/field';
import { DsInputDirective } from 'src/app/ui/input';

@Component({
  selector: 'app-input-texto-restrito',
  standalone: true,
  templateUrl: './input-texto-restrito.component.html',
  imports: [
    DsFieldComponent,
    DsInputDirective,
    ReactiveFormsModule
],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputTextoRestritoComponent implements OnInit {
  @Input() control!: FormControl;
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() maxlength: number = 200;
  @Input() bloquearNumeros: boolean = false;

  readonly inputId: string = `input-texto-restrito-${Math.random().toString(36).slice(2, 9)}`;

  ngOnInit(): void {
    if (!this.control) {
      throw new Error('O FormControl é obrigatório para <app-input-texto-restrito>');
    }
  }

  updateErrorMessage(): void {
    this.control.markAsTouched();
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
    return 'Valor inválido';
  }

  get isRequired(): boolean {
    return this.control?.validator?.({} as any)?.['required'] ?? false;
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.bloquearNumeros) return;
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onInput(event: Event): void {
    if (!this.bloquearNumeros) return;
    const input = event.target as HTMLInputElement;
    const semNumeros = input.value.replace(/\d/g, '');
    if (semNumeros !== input.value) {
      input.value = semNumeros;
      this.control.setValue(semNumeros);
    }
  }
}
