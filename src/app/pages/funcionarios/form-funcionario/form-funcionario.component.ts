
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { ToastrService } from 'src/app/services/toastr.service';
import { extrairMensagemErro } from 'src/app/utils/mensagem.util';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { FuncionarioFormValue, StatusFuncionario, TipoContrato } from '../models/funcionario.model';
import { FuncionariosService } from '../services/funcionarios.service';
import { InputTextoRestritoComponent } from 'src/app/components/inputs/input-texto/input-texto-restrito.component';
import { InputDocumentoComponent } from 'src/app/components/inputs/input-documento/input-documento.component';
import { InputTelefoneComponent } from 'src/app/components/inputs/input-telefone/input-telefone.component';
import { InputEmailComponent } from 'src/app/components/inputs/input-email/input-custom.component';
import { InputDataComponent } from 'src/app/components/inputs/input-data/input-data.component';
import { InputOptionsComponent } from 'src/app/components/inputs/input-options/input-options.component';
import { InputMoedaComponent } from 'src/app/components/inputs/input-moeda/input-moeda.component';
import { EnderecoFormComponent } from 'src/app/components/endereco-form/endereco-form.component';
import { AutoCompleteComponent } from 'src/app/components/inputs/auto-complete/auto-complete.component';
import { Usuario } from 'src/app/models/usuario/usuario.model';
import { UsuarioService } from 'src/app/pages/usuarios/services/usuario.service';

@Component({
  selector: 'app-form-funcionario',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    PageCardComponent,
    SectionCardComponent,
    TemPermissaoDirective,
    InputTextoRestritoComponent,
    InputDocumentoComponent,
    InputTelefoneComponent,
    InputEmailComponent,
    InputDataComponent,
    InputOptionsComponent,
    InputMoedaComponent,
    EnderecoFormComponent,
    AutoCompleteComponent
],
  templateUrl: './form-funcionario.component.html',
  styleUrl: './form-funcionario.component.scss'
})
export class FormFuncionarioComponent implements OnInit {
  funcionarioId: number | null = null;
  carregando = false;
  carregandoUsuarios = false;
  private enderecoPendente: any | null = null;
  tiposContrato: Array<{ id: TipoContrato; nome: string }> = [
    { id: 'CLT', nome: 'CLT' },
    { id: 'PJ', nome: 'PJ' },
    { id: 'ESTAGIO', nome: 'Estágio' },
    { id: 'TEMPORARIO', nome: 'Temporário' },
    { id: 'SEM_REGISTRO', nome: 'Sem registro' }
  ];
  statusOpcoes: StatusFuncionario[] = ['ATIVO', 'AFASTADO', 'DESLIGADO'];

  form = this.fb.group({
    usuarioBusca: [null as Usuario | string | null],
    usuarioId: [null as number | null],
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    cpf: ['', [Validators.required, Validators.maxLength(18)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    telefone: ['', [Validators.required, Validators.maxLength(30)]],
    cargo: ['', [Validators.required, Validators.maxLength(80)]],
    setor: ['', [Validators.required, Validators.maxLength(80)]],
    dataAdmissao: ['', [Validators.required]],
    tipoContrato: ['CLT' as TipoContrato, [Validators.required]],
    status: ['ATIVO' as StatusFuncionario, [Validators.required]],
    salario: [null as number | null],
    valorPassagem: [null as number | null],
    endereco: this.fb.group({})
  });

  readonly buscarUsuariosFn = (termo: string): Observable<Usuario[]> => this.buscarUsuarios$(termo);
  readonly displayUsuario = (usuario: any): string => this.formatarUsuarioDisplay(usuario);

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: FuncionariosService,
    private readonly usuarioService: UsuarioService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.funcionarioId = id;
      this.carregando = true;
      this.service.obterPorId$(id).subscribe((f) => {
        if (!f) {
          this.toastr.error('Funcionário não encontrado.');
          this.voltar();
          return;
        }
        if (f.status === 'DESLIGADO') {
          this.toastr.warning('Funcionário desligado não pode ser editado. Use a tela de detalhe para readmitir.');
          this.router.navigate(['/page/funcionarios/detalhe', id]);
          return;
        }
        this.form.patchValue({
          usuarioId: f.usuarioId ?? null,
          nome: f.nome,
          cpf: f.cpf,
          email: f.email,
          telefone: f.telefone,
          cargo: f.cargo,
          setor: f.setor,
          dataAdmissao: f.dataAdmissao,
          tipoContrato: f.tipoContrato,
          status: f.status,
          salario: f.salario ?? null,
          valorPassagem: f.valorPassagem ?? null
        });
        this.enderecoPendente = this.parseEndereco(f.endereco);
        const enderecoGroup = this.form.get('endereco') as FormGroup;
        if (enderecoGroup && this.enderecoPendente) {
          enderecoGroup.patchValue(this.enderecoPendente);
        }
        if (f.usuarioId) {
          this.carregarUsuarioVinculado(f.usuarioId);
        }
        this.carregando = false;
      });
    }
  }

  salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const formValue = this.form.getRawValue() as any;
    const payload: FuncionarioFormValue = {
      ...formValue,
      endereco: this.formatarEndereco(formValue.endereco)
    };
    delete (payload as any).usuarioBusca;
    if (this.funcionarioId) {
      this.service.atualizar$(this.funcionarioId, payload).subscribe({
        next: () => {
          this.toastr.success('Funcionário atualizado com sucesso.');
          this.redirecionarParaLista();
        },
        error: (err) => {
          this.toastr.error(extrairMensagemErro(err, 'Não foi possível atualizar o funcionário.'));
        }
      });
      return;
    }

    this.service.criar$(payload).subscribe({
      next: () => {
        this.toastr.success('Funcionário criado com sucesso.');
        this.redirecionarParaLista();
      },
      error: (err) => {
        this.toastr.error(extrairMensagemErro(err, 'Não foi possível criar o funcionário.'));
      }
    });
  }

  voltar(): void {
    this.redirecionarParaLista();
  }

  setEnderecoGroup(group: FormGroup): void {
    this.form.setControl('endereco', group);
    if (this.enderecoPendente) {
      group.patchValue(this.enderecoPendente);
    }
  }

  get nomeControl(): FormControl {
    return this.form.get('nome') as FormControl;
  }

  get usuarioBuscaControl(): FormControl {
    return this.form.get('usuarioBusca') as FormControl;
  }

  get usuarioIdControl(): FormControl {
    return this.form.get('usuarioId') as FormControl;
  }

  get cpfControl(): FormControl {
    return this.form.get('cpf') as FormControl;
  }

  get telefoneControl(): FormControl {
    return this.form.get('telefone') as FormControl;
  }

  get emailControl(): FormControl {
    return this.form.get('email') as FormControl;
  }

  get cargoControl(): FormControl {
    return this.form.get('cargo') as FormControl;
  }

  get setorControl(): FormControl {
    return this.form.get('setor') as FormControl;
  }

  get dataAdmissaoControl(): FormControl {
    return this.form.get('dataAdmissao') as FormControl;
  }

  get tipoContratoControl(): FormControl {
    return this.form.get('tipoContrato') as FormControl;
  }

  get statusControl(): FormControl {
    return this.form.get('status') as FormControl;
  }

  get salarioControl(): FormControl {
    return this.form.get('salario') as FormControl;
  }

  get valorPassagemControl(): FormControl {
    return this.form.get('valorPassagem') as FormControl;
  }

  onUsuarioSelecionado(usuario: Usuario): void {
    if (!usuario || !usuario.id) return;

    this.form.patchValue({
      usuarioId: usuario.id,
      nome: (usuario.nome || this.nomeControl.value || '').toString(),
      email: (usuario.email || usuario.username || this.emailControl.value || '').toString(),
      telefone: (usuario.telefone || this.telefoneControl.value || '').toString()
    });
  }

  limparVinculoUsuario(): void {
    this.form.patchValue({
      usuarioBusca: null,
      usuarioId: null
    });
  }

  private formatarEndereco(endereco: any): string {
    if (!endereco || typeof endereco !== 'object') return '';

    const logradouro = (endereco.logradouro || '').trim();
    const numero = (endereco.numero || '').trim();
    const bairro = (endereco.bairro || '').trim();
    const cidade = (endereco.cidade || '').trim();
    const estado = (endereco.estado || '').trim();
    const cep = (endereco.cep || '').trim();

    const partes: string[] = [];
    const ruaNumero = [logradouro, numero].filter(Boolean).join(', ');
    if (ruaNumero) partes.push(ruaNumero);
    if (bairro) partes.push(bairro);

    const cidadeUf = [cidade, estado].filter(Boolean).join('/');
    if (cidadeUf) partes.push(cidadeUf);
    if (cep) partes.push(`CEP: ${cep}`);

    return partes.join(' - ');
  }

  private parseEndereco(endereco?: string): any {
    if (!endereco) return null;
    return {
      cep: '',
      logradouro: endereco,
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: ''
    };
  }

  private carregarUsuarioVinculado(id: number): void {
    this.usuarioService.buscarPorId(id).subscribe({
      next: (usuario) => {
        if (!usuario) return;
        this.form.patchValue({ usuarioBusca: usuario }, { emitEvent: false });
      },
      error: () => {
        // Se falhar, o formulário continua funcional sem bloquear edição.
      }
    });
  }

  // Compatibilidade com ambientes onde o endpoint novo ainda não subiu.
  private normalizarListaUsuarios(res: any, termo: string): Usuario[] {
    const lista: Usuario[] = Array.isArray(res) ? res : Array.isArray(res?.content) ? res.content : [];
    return this.filtrarUsuarios(lista, termo);
  }

  private buscarUsuarios$(termo: string): Observable<Usuario[]> {
    const t = (termo || '').trim().toLowerCase();
    if (t.length < 2) return of([]);

    this.carregandoUsuarios = true;
    return this.usuarioService.listarVinculaveis(t, 30).pipe(
      // endpoint novo
      catchError(() => this.usuarioService.listar(0, 200, true)),
      // fallback antigo + filtro local
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map((res: any) => this.normalizarListaUsuarios(res, t)),
      // evita travar autocomplete em erro transitório
      catchError(() => {
        this.carregandoUsuarios = false;
        return of([]);
      }),
      tap(() => (this.carregandoUsuarios = false))
    );
  }

  private filtrarUsuarios(lista: Usuario[], termo: string): Usuario[] {
    return (lista || [])
      .filter((u) => {
        const nome = (u?.nome || '').toLowerCase();
        const email = (u?.email || '').toLowerCase();
        const username = (u?.username || '').toLowerCase();
        return nome.includes(termo) || email.includes(termo) || username.includes(termo);
      })
      .slice(0, 30);
  }

  private formatarUsuarioDisplay(usuario: any): string {
    if (!usuario) return '';
    if (typeof usuario === 'string') return usuario;
    const nome = (usuario?.nome || '').toString();
    const login = (usuario?.email || usuario?.username || '').toString();
    return login ? `${nome} • ${login}` : nome;
  }

  private redirecionarParaLista(): void {
    this.router.navigateByUrl('/page/funcionarios', { replaceUrl: true });
  }
}
