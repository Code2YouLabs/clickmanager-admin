import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'src/app/services/toastr.service';

@Component({
  selector: 'app-boxed-forgot-password',
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    BrandingComponent,
  ],
  templateUrl: './boxed-forgot-password.component.html',
})
export class AppBoxedForgotPasswordComponent {
  options = this.settings.getOptions();

  constructor(
    private settings: CoreService,
    private router: Router,
    private authService: AuthService,
    private toastr: ToastrService) { }

  form = new FormGroup({
    email: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  submit() {
    const email = this.form.value.email;

    if (!email) {
      this.toastr.warning('Informe um e-mail válido');
      return;
    }

    this.authService.recuperarSenha(email).subscribe({
      next: () => {
        this.toastr.success('Link de recuperação enviado para o e-mail.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erro ao enviar e-mail de recuperação.';
        this.toastr.error(msg);
      }
    });
  }
}
