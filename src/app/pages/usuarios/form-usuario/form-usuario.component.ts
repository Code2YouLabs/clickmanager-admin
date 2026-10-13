import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ToastrService } from 'src/app/services/toastr.service';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { UsuarioService } from '../services/usuario.service';
import { PerfilService } from '../services/perfil.service';
import { Perfil } from 'src/app/models/perfil.model';

@Component({
  selector: 'app-form-usuario',
  standalone: true,
  templateUrl: './form-usuario.component.html',
  styleUrls: ['./form-usuario.component.scss'],
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    CardHeaderComponent
]
})
export class FormUsuarioComponent implements OnInit {
  form!: FormGroup;
  perfis: Perfil[] = [];
  isEditMode = false;
  usuarioId?: number;

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private perfilService: PerfilService,
    private toastrService: ToastrService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.criarFormulario();
    this.carregarPerfis();
    this.verificarModoEdicao();
  }

  private criarFormulario(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(100)]],
      username: ['', [Validators.required, Validators.maxLength(50), Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      perfilId: [null, [Validators.required]],
      ativo: [true]
    });
  }

  private verificarModoEdicao(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.isEditMode = !!id;

      const senhaControl = this.form.get('senha');

      if (this.isEditMode) {
        this.usuarioId = Number(id);
        senhaControl?.clearValidators();
        senhaControl?.updateValueAndValidity();
        this.carregarUsuario(this.usuarioId);
      } else {
        senhaControl?.setValidators([Validators.required, Validators.minLength(6)]);
        senhaControl?.updateValueAndValidity();
      }
    });
  }

  private carregarPerfis(): void {
    this.perfilService.listar().subscribe(perfis => {
      this.perfis = perfis;
    });
  }

  private carregarUsuario(id: number): void {
    this.usuarioService.buscarPorId(id).subscribe(usuario => {
      this.form.patchValue({
        nome: usuario.nome,
        username: usuario.username,
        perfilId: usuario.perfil?.id ?? null,
        ativo: usuario.ativo
      });
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const usuario = this.form.value;
    const destino = '/page/usuarios/listar';

    if (this.isEditMode && this.usuarioId) {
      this.usuarioService.atualizar(this.usuarioId, usuario).subscribe({
        next: () => {
          this.toastrService.success('Usuário atualizado com sucesso!');
          this.router.navigate([destino]);
        },
        error: () => this.toastrService.error('Erro ao atualizar usuário.')
      });
    } else {
      this.usuarioService.salvar(usuario).subscribe({
        next: () => {
          this.toastrService.success('Usuário cadastrado com sucesso!');
          this.router.navigate([destino]);
        },
        error: () => this.toastrService.error('Erro ao cadastrar usuário.')
      });
    }
  }

  getErrorMessage(campo: string): string {
    const control = this.form.get(campo);
    if (control?.hasError('required')) return 'Campo obrigatório';
    if (control?.hasError('maxlength')) return `Máximo de ${control.getError('maxlength').requiredLength} caracteres`;
    if (control?.hasError('minlength')) return `Mínimo de ${control.getError('minlength').requiredLength} caracteres`;
    if (control?.hasError('email')) return 'E-mail inválido';
    return 'Campo inválido';
  }
}
