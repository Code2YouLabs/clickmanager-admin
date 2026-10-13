import { Component, Input } from '@angular/core';

import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-input-options',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule
],
  templateUrl: './input-options.component.html'
})
export class InputOptionsComponent {
  @Input() control!: FormControl;
  @Input() label: string = 'Selecione uma opção';
  @Input() placeholder: string = '- Selecione -';
  @Input() options: any[] = [];
  @Input() labelKey: string = 'nome';
  @Input() valueKey: string = 'id';
  @Input() showNull: boolean = true;
  @Input() nullLabel: string = '-- Selecione --';
  @Input() disabled: boolean = false;

  get isRequired(): boolean {
    return this.control?.validator?.({} as any)?.['required'] ?? false;
  }

  asLabel(opt: any): string {
    if (opt == null) return '';
    if (typeof opt === 'string' || typeof opt === 'number') return String(opt);
    return opt?.[this.labelKey] ?? '';
  }

  asValue(opt: any): any {
    if (opt == null) return null;
    if (typeof opt === 'string' || typeof opt === 'number') return opt;
    return opt?.[this.valueKey] ?? opt;
  }

  errorMessage(): string {
    if (this.control.hasError('required')) {
      return 'Campo obrigatório';
    }
    return 'Valor inválido';
  }
}
