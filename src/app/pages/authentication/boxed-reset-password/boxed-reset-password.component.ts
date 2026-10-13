import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'src/app/services/toastr.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-boxed-reset-password',
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    BrandingComponent,
    CommonModule
  ],
  templateUrl: './boxed-reset-password.component.html',
})
export class AppBoxedResetPasswordComponent implements OnInit {
  token: string = '';

  form = new FormGroup({
    novaSenha: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.toastr.error('Token de redefinição de senha não encontrado na URL.');
        this.router.navigate(['/login']);
      }
    });
  }

  get f() {
    return this.form.controls;
  }

  submit(): void {
    const senha = this.form.value.novaSenha;
    if (!this.token || !senha) return;

    this.authService.resetarSenha(this.token, senha).subscribe({
      next: () => {
        this.toastr.success('Senha redefinida com sucesso!');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.toastr.error('Erro ao redefinir a senha. O link pode ter expirado.');
      }
    });
  }
}
