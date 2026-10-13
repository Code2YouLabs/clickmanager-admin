import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { ToastrService } from 'src/app/services/toastr.service';
import { DEFINICOES, PermissaoDefinicao } from 'src/app/permissions/permissions.config';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { InputTextoRestritoComponent } from 'src/app/components/inputs/input-texto/input-texto-restrito.component';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';

@Component({
  selector: 'app-perfil-dialog',
  standalone: true,
  templateUrl: './perfil-dialog.component.html',
  styleUrls: ['./perfil-dialog.component.scss'],
  imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatSlideToggleModule,
        InputTextoRestritoComponent,
        DesignSystemIconsModule
      ]
})
export class PerfilDialogComponent implements OnInit {
    form!: FormGroup;
    grupos: Record<string, PermissaoDefinicao[]> = {};
  
    constructor(
      private fb: NonNullableFormBuilder,
      private dialogRef: MatDialogRef<PerfilDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private toastr: ToastrService
    ) {}
  
    ngOnInit(): void {
    
      this.grupos = DEFINICOES.reduce((acc: Record<string, PermissaoDefinicao[]>, def) => {
        if (!acc[def.grupo]) acc[def.grupo] = [];
        acc[def.grupo].push(def);
        return acc;
      }, {});
    
      const permissoesObj = Object.fromEntries(DEFINICOES.map(p => [p.chave, false]));
    
      this.form = this.fb.group({
        nome: ['', Validators.required],
        descricao: [''],
        permissoes: this.fb.group(permissoesObj)
      });
    
      if (this.data?.perfil) {
        const permissoesPerfil: string[] = (this.data.perfil.permissoes || []).map((p: any) => p.chave);
        const permissoesMarcadas: any = {};
      
        for (const definicao of DEFINICOES) {
          permissoesMarcadas[definicao.chave] = permissoesPerfil.includes(definicao.chave);
        }
      
        this.form.patchValue({
          nome: this.data.perfil.nome,
          descricao: this.data.perfil.descricao,
          permissoes: permissoesMarcadas
        });
      }
    } 
  
    salvar(): void {
      if (this.form.invalid) {
        this.toastr.warning('Preencha todos os campos obrigatórios corretamente.', 'Formulário inválido');
        return;
      }
  
      this.dialogRef.close({
        event: 'Save',
        data: this.form.getRawValue()
      });
    }
  
    cancelar(): void {
      this.dialogRef.close();
    }
  
    getPermissaoControl(chave: string): FormControl<boolean> {
      return this.form.get('permissoes.' + chave) as FormControl<boolean>;
    }

    get permissoesGroup(): FormGroup {
      return this.form.get('permissoes') as FormGroup;
    }

    get nomeControl(): FormControl {
      return this.form.get('nome') as FormControl;
    }

    get descricaoControl(): FormControl {
      return this.form.get('descricao') as FormControl;
    }

    get todasSelecionadas(): boolean {
      const permissoes = this.permissoesGroup?.value;
      return permissoes ? Object.values(permissoes).every(Boolean) : false;
    }

    selecionarTodos(checked: boolean): void {
      if (!this.permissoesGroup) return;
      Object.keys(this.permissoesGroup.controls).forEach(key => {
        this.permissoesGroup.get(key)?.setValue(checked);
      });
    }
  }
