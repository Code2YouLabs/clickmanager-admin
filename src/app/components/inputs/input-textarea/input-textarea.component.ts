import { Component, Input } from '@angular/core';

import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-input-textarea',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
],
  templateUrl: './input-textarea.component.html'
})
export class InputTextareaComponent {
  @Input() control!: FormControl;
  @Input() label: string = 'Textarea';
  @Input() placeholder: string = '';
  @Input() rows: number = 5;

  get isRequired(): boolean {
    return this.control?.validator?.({} as any)?.['required'] ?? false;
  }

  errorMessage(): string {
    if (this.control.hasError('required')) {
      return 'Campo obrigatório';
    }
    if (this.control.hasError('maxlength')) {
      const max = this.control.getError('maxlength')?.requiredLength;
      return `Máximo de ${max} caracteres`;
    }
    return 'Valor inválido';
  }
}
