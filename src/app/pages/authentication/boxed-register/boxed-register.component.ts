import { Component, OnInit } from '@angular/core';
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
import { ToastrService } from 'src/app/services/toastr.service';
import { OnboardingService } from '../side-register/side-register.service';
import { InputTextoRestritoComponent } from 'src/app/components/inputs/input-texto/input-texto-restrito.component';
import { InputTelefoneComponent } from 'src/app/components/inputs/input-telefone/input-telefone.component';
import { InputDocumentoComponent } from 'src/app/components/inputs/input-documento/input-documento.component';
import { InputEmailComponent } from 'src/app/components/inputs/input-email/input-custom.component';

@Component({
  selector: 'app-boxed-register',
  standalone: true,
  imports: [
    RouterModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    BrandingComponent,
    InputTextoRestritoComponent,
    InputTelefoneComponent,
    InputDocumentoComponent,
    InputEmailComponent,
  ],
  templateUrl: './boxed-register.component.html',
})
export class AppBoxedRegisterComponent implements OnInit {

  options = this.settings.getOptions();

  constructor(
    private settings: CoreService,
    private router: Router,
    private toastr: ToastrService,
    private onboardingService: OnboardingService
  ) { }

  // Formulário aninhado: empresa + usuario
  form = new FormGroup({
    empresa: new FormGroup({
      nome: new FormControl<string | null>('', [Validators.required]),
      telefone: new FormControl<string | null>('', [Validators.required]),
      email: new FormControl<string | null>('', [Validators.email]),
      cnpj: new FormControl<string | null>('', [Validators.required])
    }),
    usuario: new FormGroup({
      nome: new FormControl<string | null>('', [Validators.required, Validators.minLength(6)]),
      email: new FormControl<string | null>('', [Validators.required, Validators.email]),
      telefone: new FormControl<string | null>(''),
      senha: new FormControl<string | null>('', [Validators.required, Validators.minLength(6)]),
      confirmarSenha: new FormControl<string | null>('', [Validators.required]),
    }),
  });

  ngOnInit(): void {
    // Aqui NÃO verificamos mais se já existe usuário,
    // pois agora cada empresa faz seu próprio cadastro (multi-tenant).
  }

  // getters para facilitar o template
  get empresa(): FormGroup {
    return this.form.get('empresa') as FormGroup;
  }

  get usuario(): FormGroup {
    return this.form.get('usuario') as FormGroup;
  }

  get empresaNomeControl(): FormControl {
    return this.empresa.get('nome') as FormControl;
  }

  get empresaTelefoneControl(): FormControl {
    return this.empresa.get('telefone') as FormControl;
  }

  get empresaEmailControl(): FormControl {
    return this.empresa.get('email') as FormControl;
  }

  get empresaCnpjControl(): FormControl {
    return this.empresa.get('cnpj') as FormControl;
  }

  get usuarioNomeControl(): FormControl {
    return this.usuario.get('nome') as FormControl;
  }

  get usuarioEmailControl(): FormControl {
    return this.usuario.get('email') as FormControl;
  }

  get usuarioTelefoneControl(): FormControl {
    return this.usuario.get('telefone') as FormControl;
  }

  get usuarioSenhaControl(): FormControl {
    return this.usuario.get('senha') as FormControl;
  }

  get usuarioConfirmarSenhaControl(): FormControl {
    return this.usuario.get('confirmarSenha') as FormControl;
  }

  get senhaDivergente(): boolean {
    const senha = this.usuario.get('senha')?.value;
    const confirmar = this.usuario.get('confirmarSenha')?.value;
    return !!senha && !!confirmar && senha !== confirmar;
  }

  submit() {
    if (this.form.invalid || this.senhaDivergente) {
      this.form.markAllAsTouched();
      this.toastr.error('Preencha todos os campos obrigatórios corretamente.');
      return;
    }

    const raw = this.form.value;

    const empresa = raw.empresa!;
    const usuario = raw.usuario!;

    const payload = {
      empresa: {
        nome: empresa.nome!,
        telefone: empresa.telefone!,
        email: empresa.email || '',
        cnpj: empresa.cnpj!
      },
      usuario: {
        nome: usuario.nome!,
        username: usuario.email!,       
        email: usuario.email!,
        telefone: usuario.telefone || '',
        senha: usuario.senha!,
        proprietario: true              
      },
    };

    this.onboardingService.registrarEmpresaComGestor(payload).subscribe({
      next: () => {
        this.toastr.success('Empresa e gestor cadastrados com sucesso!');
        this.router.navigate(['/login']);
      },
      error: err => {
        const msg = err?.error?.message || 'Erro desconhecido';
        this.toastr.error('Erro ao concluir cadastro: ' + msg);
      }
    });
  }
}
