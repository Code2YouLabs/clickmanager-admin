import { Component, Input } from '@angular/core';

import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerToggle, MatDatepicker } from '@angular/material/datepicker';

@Component({
  selector: 'app-input-data',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
],
  templateUrl: './input-data.component.html'
})
export class InputDataComponent {
  @Input() control!: FormControl;
  @Input() label: string = 'Data';
  @Input() placeholder: string = 'dd/mm/aaaa';

  get isRequired(): boolean {
    return this.control?.validator?.({} as any)?.['required'] ?? false;
  }

  errorMessage(): string {
    if (this.control.hasError('required')) {
      return 'Campo obrigatório';
    }
    return 'Data inválida';
  }
}
