import { Component } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { EmailServidorConfig, EmailServidorService, EmailServidorTesteRequest } from './email-servidor.service';
import { ToastrService } from 'src/app/services/toastr.service';
import { MatDialog } from '@angular/material/dialog';
import { EmailServidorTesteDialogComponent } from './email-servidor-teste-dialog.component';
import { AuthService } from 'src/app/services/auth.service';
import { DsButtonComponent } from 'src/app/ui/button';
import { DsFieldComponent } from 'src/app/ui/field';
import { DsInputDirective } from 'src/app/ui/input';
import { DsCheckboxComponent } from 'src/app/ui/checkbox';

type CampoEmail = 'host' | 'porta' | 'usuario' | 'senha' | 'remetente';

@Component({
  selector: 'app-email-servidor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    CardHeaderComponent,
    DsButtonComponent,
    DsFieldComponent,
    DsInputDirective,
    DsCheckboxComponent
],
  templateUrl: './email-servidor.component.html',
  styleUrls: ['./email-servidor.component.scss']
})
export class EmailServidorComponent {
  form: FormGroup;
  private emailUsuario?: string;
  submitted = false;
  private mensagemPadraoTeste = 'E-mail de teste do servidor de e-mail do ClickManager. Se você recebeu esta mensagem, sua configuração está funcionando.';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private emailService: EmailServidorService,
    private toastr: ToastrService,
    private dialog: MatDialog,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      host: ['', Validators.required],
      porta: [587, [Validators.required, Validators.min(1)]],
      usuario: ['', [Validators.required, Validators.email]],
      senha: ['', Validators.required],
      remetente: ['', [Validators.required, Validators.email]],
      usarSsl: [true]
    });
    this.carregar();
    this.authService.usuario$.subscribe(usuario => {
      this.emailUsuario = usuario?.email || undefined;
    });
  }

  salvar(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = this.form.value as EmailServidorConfig;
    this.emailService.atualizar(payload).subscribe({
      next: () => this.toastr.success('Configuração de e-mail salva'),
      error: (err) => this.exibirErro(err, 'Erro ao salvar configuração de e-mail'),
    });
  }

  cancelar(): void {
    this.router.navigate(['/dashboards/dashboard1']);
  }

  testar(): void {
    this.submitted = true;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.warning('Preencha a configuração antes de testar.');
      return;
    }

    const dialogRef = this.dialog.open(EmailServidorTesteDialogComponent, {
      width: '600px',
      data: {
        emailDestino: this.emailUsuario ?? '',
        mensagemPadrao: this.mensagemPadraoTeste
      }
    });

    dialogRef.afterClosed().subscribe((result: { emailDestino: string; mensagem: string } | undefined) => {
      if (!result) return;
      this.dispararTeste(result);
    });
  }

  private dispararTeste(result: { emailDestino: string; mensagem: string }): void {
    const config = this.form.getRawValue() as EmailServidorConfig & { id?: number };
    const payload: EmailServidorTesteRequest = {
      emailDestino: result.emailDestino,
      mensagem: result.mensagem,
      host: config.host,
      porta: config.porta,
      usuario: config.usuario,
      senha: config.senha,
      remetente: config.remetente,
      usarSsl: config.usarSsl,
      id: (config as any).id
    };

    this.emailService.testarEnvio(payload).subscribe({
      next: () => {
        this.toastr.success(`E-mail de teste enviado. Verifique a caixa de entrada de ${payload.emailDestino}.`);
      },
      error: (err) => this.exibirErro(err, 'Não foi possível enviar o e-mail de teste.')
    });
  }

  invalid(campo: CampoEmail): boolean {
    const control = this.form.get(campo) as FormControl;
    return control.invalid && (control.touched || this.submitted);
  }

  error(campo: CampoEmail): string {
    if (!this.invalid(campo)) return '';
    const control = this.form.get(campo) as FormControl;
    if (control.hasError('required')) return 'Campo obrigatório';
    if (control.hasError('email')) return 'E-mail inválido';
    if (control.hasError('min')) {
      const requiredMin = control.getError('min')?.min;
      return `Valor mínimo permitido é ${requiredMin}`;
    }
    if (control.hasError('maxlength')) {
      return `Máximo de ${control.getError('maxlength')?.requiredLength} caracteres`;
    }
    return 'Valor inválido';
  }

  get hostControl() {
    return this.form.get('host') as FormControl;
  }

  get portaControl() {
    return this.form.get('porta') as FormControl;
  }

  get usuarioControl() {
    return this.form.get('usuario') as FormControl;
  }

  get senhaControl() {
    return this.form.get('senha') as FormControl;
  }

  get remetenteControl() {
    return this.form.get('remetente') as FormControl;
  }

  private carregar(): void {
    this.emailService.obter().subscribe({
      next: (cfg) => {
        if (cfg) {
          this.form.patchValue(cfg);
        }
      },
      error: (err) => this.exibirErro(err, 'Não foi possível carregar configuração de e-mail'),
    });
  }

  private exibirErro(err: any, fallback: string): void {
    const mensagem = err?.userMessage || fallback;
    this.toastr.error(mensagem);
  }
}