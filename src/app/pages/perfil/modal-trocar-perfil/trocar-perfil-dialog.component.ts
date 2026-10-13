import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { ToastrService } from 'src/app/services/toastr.service';
import { Perfil } from 'src/app/models/perfil.model';

@Component({
  selector: 'app-trocar-perfil-dialog',
  standalone: true,
  templateUrl: './trocar-perfil-dialog.component.html',
  styleUrls: ['./trocar-perfil-dialog.component.scss'],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule
]
})
export class TrocarPerfilDialogComponent implements OnInit {
  form!: FormGroup;
  perfis: Perfil[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TrocarPerfilDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { usuario: any, perfis: Perfil[] },
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.perfis = this.data.perfis;

    this.form = this.fb.group({
      perfilId: [this.data.usuario.perfil?.id || null, Validators.required]
    });
  }

  salvar(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        usuarioId: this.data.usuario.id,
        novoPerfilId: this.form.value.perfilId
      });
    } else {
      this.toastr.error('Selecione um perfil válido!');
    }
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
