import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DsFieldComponent } from 'src/app/ui/field';
import { DsInputDirective } from 'src/app/ui/input';

@Component({
  selector: 'app-input-email',
  standalone: true,
  templateUrl: './input-custom.component.html',
  imports: [
    DsFieldComponent,
    DsInputDirective,
    ReactiveFormsModule
],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputEmailComponent implements OnInit {
  @Input() control!: FormControl;
  @Input() label: string = 'E-mail';
  @Input() placeholder: string = 'Digite seu e-mail';
  @Input() maxlength: number = 200;
  readonly type: string = 'email'; // fixo

  readonly inputId: string = `input-email-${Math.random().toString(36).slice(2, 9)}`;

  ngOnInit(): void {
    if (!this.control) {
      throw new Error('O FormControl é obrigatório para <app-input-email>');
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
    if (this.control.hasError('email')) {
      return 'E-mail inválido';
    }
    return 'Valor inválido';
  }

  get isRequired(): boolean {
    return this.control?.validator?.({} as any)?.['required'] ?? false;
  }
}
