import { Component } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { BrandingComponent } from '../../../layouts/full/vertical/sidebar/branding.component';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'src/app/services/toastr.service';

@Component({
  selector: 'app-boxed-login',
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    BrandingComponent,
  ],
  templateUrl: './boxed-login.component.html',
})
export class AppBoxedLoginComponent {
  options = this.settings.getOptions();
  carregando = false;

  constructor(
    private settings: CoreService,
    private authService: AuthService,
    private toastr: ToastrService) {}

  form = new FormGroup({
    uname: new FormControl('', [Validators.required]),
    password: new FormControl('', [Validators.required]),
    lembrar: new FormControl(true)
  });

  get f() {
    return this.form.controls;
  }

  submit() {
    if (this.form.invalid || this.carregando) {
      this.form.markAllAsTouched();
      return;
    }

    const { uname, password, lembrar } = this.form.value;
    this.carregando = true;

    this.authService.login(uname!, password!, lembrar!).subscribe({
      next: () => {
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.toastr.error('Usuário ou senha admin inválidos.');
      }
    });
  }
}
