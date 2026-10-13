import { Component, Inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputEmailComponent } from 'src/app/components/inputs/input-email/input-custom.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

export interface EmailTesteDialogData {
  emailDestino: string;
  mensagemPadrao: string;
}

@Component({
  selector: 'app-email-servidor-teste-dialog',
  standalone: true,
  templateUrl: './email-servidor-teste-dialog.component.html',
  styleUrls: ['./email-servidor-teste-dialog.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    InputEmailComponent,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
]
})
export class EmailServidorTesteDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EmailServidorTesteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EmailTesteDialogData,
  ) {
    this.form = this.fb.group({
      emailDestino: [data.emailDestino || '', [Validators.required, Validators.email]],
      mensagem: [data.mensagemPadrao || '', [Validators.required, Validators.minLength(5)]],
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.value);
  }

  get emailControl() {
    return this.form.get('emailDestino') as FormControl;
  }

  get mensagemControl() {
    return this.form.get('mensagem') as FormControl;
  }
}
