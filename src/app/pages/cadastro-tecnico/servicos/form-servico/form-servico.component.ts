import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ServicoService } from '../../services/servico.service';
import { ToastrService } from 'src/app/services/toastr.service';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { ServicoRequest } from 'src/app/models/servico/servico-request.model';
import { ServicoResponse } from 'src/app/models/servico/servico-response.model';
import { SharedComponentsModule } from 'src/app/components/shared-components.module';
import { InputTextareaComponent } from "../../../../components/inputs/input-textarea/input-textarea.component";
import { InputMultiSelectComponent } from "../../../../components/inputs/input-multi-select/input-multi-select-component";
import { PrecoSelectorComponent } from "../../../../components/preco/preco-selector.component";
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";

@Component({
  selector: 'app-form-servico',
  standalone: true,
  templateUrl: './form-servico.component.html',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatTabsModule,
    SharedComponentsModule,
    InputTextareaComponent,
    PrecoSelectorComponent,
    CardHeaderComponent
]
})
export class FormServicoComponent implements OnInit {

  form!: FormGroup;
  isEditMode = false;
  servicoId!: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private servicoService: ServicoService,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.verificarModoEdicao();
  }

  inicializarFormulario(): void {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      descricao: [''],
      preco: this.fb.group({}),
    });
  }

  verificarModoEdicao(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.servicoId = +id;
      this.carregarServico(this.servicoId);
    }
  }

  carregarServico(id: number): void {
    this.servicoService.buscarPorId(id).subscribe({
      next: (servico: ServicoResponse) => this.form.patchValue({
        nome: servico.nome,
        descricao: servico.descricao,
        preco: servico.preco
      }),
      error: () => {
        this.toastr.error('Erro ao carregar serviço.');
        this.router.navigate(['/page/cadastro-tecnico/servicos']);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request: ServicoRequest = this.form.value;
    const action = this.isEditMode
      ? this.servicoService.atualizar(this.servicoId, request)
      : this.servicoService.salvar(request);

    action.subscribe({
      next: () => {
        this.toastr.success(this.isEditMode ? 'Serviço atualizado com sucesso!' : 'Serviço criado com sucesso!');
        this.router.navigate(['/page/cadastro-tecnico/servico']);
      },
      error: () => {
        this.toastr.error(this.isEditMode ? 'Erro ao atualizar serviço.' : 'Erro ao criar serviço.');
      }
    });
  }

  get nomeControl(): FormControl {
    return this.form.get('nome') as FormControl;
  }

  get descricaoControl(): FormControl {
    return this.form.get('descricao') as FormControl;
  }

  get precoControl(): FormGroup {
    return this.form.get('preco') as FormGroup;
  }

}
