import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { MaterialModule } from 'src/app/material.module';
import { InputMoedaComponent } from 'src/app/components/inputs/input-moeda/input-moeda.component';
import { InputNumericoComponent } from 'src/app/components/inputs/input-numerico/input-numerico.component';
import { InputTextoRestritoComponent } from 'src/app/components/inputs/input-texto/input-texto-restrito.component';


@Component({
  standalone: true,
  selector: 'app-dialog-descrever-item',
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    InputTextoRestritoComponent,
    InputNumericoComponent,
    InputMoedaComponent
],
  templateUrl: './dialog-descrever-item.component.html'
})
export class DialogDescreverItemComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DialogDescreverItemComponent>
  ) {
    this.form = this.fb.group({
      descricao: ['', [Validators.required, Validators.maxLength(200)]],
      quantidade: [1, [Validators.required, Validators.min(1)]],
      valorUnitario: [null, [Validators.required, Validators.min(0.01)]],
    });
  }

  adicionar(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  get descricaoControl(): FormControl {
    return this.form.get('descricao') as FormControl;
  }
  
  get quantidadeControl(): FormControl {
    return this.form.get('quantidade') as FormControl;
  }
  
  get valorUnitarioControl(): FormControl {
    return this.form.get('valorUnitario') as FormControl;
  }
  
}
