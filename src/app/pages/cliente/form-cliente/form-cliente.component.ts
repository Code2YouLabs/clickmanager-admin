import { Component, OnInit } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { ToastrService } from 'src/app/services/toastr.service';
import { ClienteRequest } from 'src/app/models/cliente/cliente-request.model';
import { ClienteService } from '../cliente.service';
import { Observable } from 'rxjs';
import { ClienteResponse } from 'src/app/models/cliente/cliente-response.model';
import { MatTabsModule } from '@angular/material/tabs';
import { InputTextoRestritoComponent } from "../../../components/inputs/input-texto/input-texto-restrito.component";
import { InputTelefoneComponent } from "../../../components/inputs/input-telefone/input-telefone.component";
import { InputEmailComponent } from "../../../components/inputs/input-email/input-custom.component";
import { InputDocumentoComponent } from "../../../components/inputs/input-documento/input-documento.component";
import { EnderecoFormComponent } from 'src/app/components/endereco-form/endereco-form.component';
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";
import { extrairMensagemErro } from 'src/app/utils/mensagem.util';

@Component({
  selector: 'app-form-cliente',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatTabsModule,
    InputTextoRestritoComponent,
    InputTelefoneComponent,
    InputEmailComponent,
    EnderecoFormComponent,
    InputDocumentoComponent,
    CardHeaderComponent
],
  templateUrl: './form-cliente.component.html'
})
export class FormClienteComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  clienteId?: number;
  retorno: string | null = null;

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private toastr: ToastrService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.verificarModoEdicao();

    this.route.queryParamMap.subscribe(params => {
      this.retorno = params.get('retorno');
    });
    
  }

  private inicializarFormulario(): void {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', Validators.required],
      documento: [''],
      endereco: this.fb.group({})
    });
  }

  private verificarModoEdicao(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.clienteId = +id;
        this.carregarCliente(this.clienteId);
      }
    });
  }

  private carregarCliente(id: number): void {
    this.clienteService.buscarPorId(id).subscribe({
      next: cliente => this.form.patchValue(cliente),
      error: (err) => this.toastr.error(extrairMensagemErro(err, 'Erro ao carregar cliente.'))
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
  
    const cliente: ClienteRequest = this.form.value;
    const destino = this.retorno ?? '/page/cliente';
  
  
    if (this.isEditMode) {
      const idParam = this.route.snapshot.paramMap.get('id');
      const id = idParam ? Number(idParam) : null;
  
      if (!id) {
        this.toastr.error('ID do cliente inválido.');
        return;
      }
  
      this.clienteService.atualizar(id, cliente).subscribe({
        next: () => {
          this.toastr.success('Cliente atualizado com sucesso!');
          this.router.navigate([destino]);
        },
        error: (err) => this.toastr.error(extrairMensagemErro(err, 'Erro ao atualizar cliente.'))
      });
    } else {
      this.clienteService.salvar(cliente).subscribe({
        next: () => {
          this.toastr.success('Cliente cadastrado com sucesso!');
          this.router.navigate([destino]);
        },
        error: (err) => this.toastr.error(extrairMensagemErro(err, 'Erro ao cadastrar cliente.'))
      });
    }
  } 

  setEnderecoGroup(group: FormGroup): void {
    this.form.setControl('endereco', group);
  }

  get nomeControl(): FormControl {
    return this.form.get('nome') as FormControl;
  }

  get emailControl(): FormControl {
    return this.form.get('email') as FormControl;
  }

  get telefoneControl(): FormControl {
    return this.form.get('telefone') as FormControl;
  }

  get documentoControl(): FormControl {
    return this.form.get('documento') as FormControl;
  }

  get cepControl() {
    return this.form.get('endereco.cep') as FormControl;
  }
  
  get logradouroControl() {
    return this.form.get('endereco.logradouro') as FormControl;
  }
  
  get numeroControl() {
    return this.form.get('endereco.numero') as FormControl;
  }
  
  get complementoControl() {
    return this.form.get('endereco.complemento') as FormControl;
  }
  
  get bairroControl() {
    return this.form.get('endereco.bairro') as FormControl;
  }
  
  get cidadeControl() {
    return this.form.get('endereco.cidade') as FormControl;
  }
  
  get estadoControl() {
    return this.form.get('endereco.estado') as FormControl;
  }

}
