// src/app/pages/onboarding/onboarding-wizard.component.ts
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MaterialModule } from 'src/app/material.module';
import { ToastrService } from 'src/app/services/toastr.service';
import { BrandingComponent } from 'src/app/layouts/full/vertical/sidebar/branding.component';
import { OnboardingService } from './onboarding.service';
import { CommonModule } from '@angular/common';
import { CardHeaderComponent } from "../card-header/card-header.component";
import { EmpresaFormComponent } from "src/app/pages/empresa/empresa-form.component";

export interface OnboardingWizardData {
  empresaNome: string;
  naoMostrarMaisDefault?: boolean;
}

type OpcaoPadrao = { id: number; nome: string; descricao?: string };

@Component({
  selector: 'app-onboarding-wizard',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatCheckboxModule,
    BrandingComponent,
    CardHeaderComponent,
    EmpresaFormComponent
],
  templateUrl: './onboarding-wizard.component.html'
})
export class OnboardingWizardComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  // Step 1: grupo “dummy” só pra deixar o step válido no modo linear
  empresaStepGroup: FormGroup;
  acabamentosForm: FormGroup;
  coresForm: FormGroup;
  formatosForm: FormGroup;
  materiaisForm: FormGroup;
  servicosForm: FormGroup;
  finalForm: FormGroup;

  carregandoAcabamentos = true;
  carregandoCores = true;
  carregandoFormatos = true;
  carregandoMateriais = true;
  carregandoServicos = true;

  acabamentosPadrao: OpcaoPadrao[] = [];
  coresPadrao: OpcaoPadrao[] = [];
  formatosPadrao: OpcaoPadrao[] = [];
  materiaisPadrao: OpcaoPadrao[] = [];
  servicosPadrao: OpcaoPadrao[] = [];

  selecionadosAcabamentos = new Set<number>();
  selecionadosCores = new Set<number>();
  selecionadosFormatos = new Set<number>();
  selecionadosMateriais = new Set<number>();
  selecionadosServicos = new Set<number>();

  constructor(
    private fb: FormBuilder,
    private onboardingService: OnboardingService,
    private toastr: ToastrService,
    private dialogRef: MatDialogRef<OnboardingWizardComponent>,
    @Inject(MAT_DIALOG_DATA) public data: OnboardingWizardData
  ) {
    this.empresaStepGroup = this.fb.group({
      done: [false, Validators.requiredTrue],
    });

    this.acabamentosForm = this.fb.group({
      selecionadosIds: new FormControl<number[]>([], []),
    });

    this.coresForm = this.fb.group({
      selecionadosIds: new FormControl<number[]>([], []),
    });

    this.formatosForm = this.fb.group({
      selecionadosIds: new FormControl<number[]>([], []),
    });

    this.materiaisForm = this.fb.group({
      selecionadosIds: new FormControl<number[]>([], []),
    });

    this.servicosForm = this.fb.group({
      selecionadosIds: new FormControl<number[]>([], []),
    });

    this.finalForm = this.fb.group({
      naoMostrarMais: [!!this.data?.naoMostrarMaisDefault],
    });
  }

  fechar(): void {
    this.dialogRef.close(false);
  }

  ngOnInit(): void {
    this.carregarAcabamentosPadrao();
    this.carregarCoresPadrao();
    this.carregarFormatosPadrao();
    this.carregarMateriaisPadrao();
    this.carregarServicosPadrao();
  }

  private carregarAcabamentosPadrao(): void {
    this.onboardingService.listarAcabamentosPadrao().subscribe({
      next: (lista) => {
        this.acabamentosPadrao = lista;
        this.carregandoAcabamentos = false;
      },
      error: () => {
        this.toastr.error('Erro ao carregar acabamentos padrão');
        this.carregandoAcabamentos = false;
      },
    });
  }

  private carregarCoresPadrao(): void {
    this.onboardingService.listarCoresPadrao().subscribe({
      next: (lista) => {
        this.coresPadrao = lista;
        this.carregandoCores = false;
      },
      error: () => {
        this.toastr.error('Erro ao carregar cores padrão');
        this.carregandoCores = false;
      },
    });
  }

  private carregarFormatosPadrao(): void {
    this.onboardingService.listarFormatosPadrao().subscribe({
      next: (lista) => {
        this.formatosPadrao = lista;
        this.carregandoFormatos = false;
      },
      error: () => {
        this.toastr.error('Erro ao carregar formatos padrão');
        this.carregandoFormatos = false;
      },
    });
  }

  private carregarMateriaisPadrao(): void {
    this.onboardingService.listarMateriaisPadrao().subscribe({
      next: (lista) => {
        this.materiaisPadrao = lista;
        this.carregandoMateriais = false;
      },
      error: () => {
        this.toastr.error('Erro ao carregar materiais padrão');
        this.carregandoMateriais = false;
      },
    });
  }

  private carregarServicosPadrao(): void {
    this.onboardingService.listarServicosPadrao().subscribe({
      next: (lista) => {
        this.servicosPadrao = lista;
        this.carregandoServicos = false;
      },
      error: () => {
        this.toastr.error('Erro ao carregar serviços padrão');
        this.carregandoServicos = false;
      },
    });
  }

  get naoMostrarMais(): boolean {
    return this.finalForm.get('naoMostrarMais')?.value === true;
  }

  toggleAcabamento(checked: boolean, id: number): void {
    this.atualizarSelecionados(checked, id, this.selecionadosAcabamentos, this.acabamentosForm);
  }

  toggleCor(checked: boolean, id: number): void {
    this.atualizarSelecionados(checked, id, this.selecionadosCores, this.coresForm);
  }

  toggleFormato(checked: boolean, id: number): void {
    this.atualizarSelecionados(checked, id, this.selecionadosFormatos, this.formatosForm);
  }

  toggleMaterial(checked: boolean, id: number): void {
    this.atualizarSelecionados(checked, id, this.selecionadosMateriais, this.materiaisForm);
  }

  toggleServico(checked: boolean, id: number): void {
    this.atualizarSelecionados(checked, id, this.selecionadosServicos, this.servicosForm);
  }

  selecionarTodosAcabamentos(checked: boolean): void {
    this.selecionarTodos(checked, this.acabamentosPadrao, this.selecionadosAcabamentos, this.acabamentosForm);
  }

  selecionarTodasCores(checked: boolean): void {
    this.selecionarTodos(checked, this.coresPadrao, this.selecionadosCores, this.coresForm);
  }

  selecionarTodosFormatos(checked: boolean): void {
    this.selecionarTodos(checked, this.formatosPadrao, this.selecionadosFormatos, this.formatosForm);
  }

  selecionarTodosMateriais(checked: boolean): void {
    this.selecionarTodos(checked, this.materiaisPadrao, this.selecionadosMateriais, this.materiaisForm);
  }

  selecionarTodosServicos(checked: boolean): void {
    this.selecionarTodos(checked, this.servicosPadrao, this.selecionadosServicos, this.servicosForm);
  }

  private atualizarSelecionados(
    checked: boolean,
    id: number,
    selecionados: Set<number>,
    form: FormGroup
  ): void {
    if (checked) {
      selecionados.add(id);
    } else {
      selecionados.delete(id);
    }
    form.get('selecionadosIds')?.setValue(Array.from(selecionados));
  }

  private selecionarTodos(
    checked: boolean,
    lista: OpcaoPadrao[],
    selecionados: Set<number>,
    form: FormGroup
  ): void {
    selecionados.clear();
    if (checked) {
      lista.forEach(item => selecionados.add(item.id));
    }
    form.get('selecionadosIds')?.setValue(Array.from(selecionados));
  }


  onEmpresaSalva(): void {
  // marca o step 1 como válido
  this.empresaStepGroup.get('done')?.setValue(true);

  this.onboardingService.concluirTarefa({ step: 'DADOS_EMPRESA' }).subscribe({
    next: () => {
      this.toastr.success(
        'Dados da empresa salvos e etapa concluída com sucesso.'
      );
      this.stepper.next(); 
    },
    error: () => {
      this.toastr.error('Erro ao concluir etapa de dados da empresa.');
    },
  });
}


  // STEP 2
  salvarAcabamentosEProsseguir(): void {
    const ids = Array.from(this.selecionadosAcabamentos);

    if (!ids.length) {
      this.toastr.warning(
        'Selecione pelo menos um acabamento ou pule essa etapa.'
      );
      return;
    }

    this.onboardingService
      .concluirTarefa({
        step: 'ACABAMENTOS_PADRAO',
        acabamentosSelecionadosIds: ids,
      })
      .subscribe({
        next: () => {
          this.toastr.success('Acabamentos padrão adicionados com sucesso.');
          this.stepper.next();
        },
        error: () => {
          this.toastr.error('Erro ao cadastrar acabamentos padrão.');
        },
      });
  }

  salvarCoresEProsseguir(): void {
    const ids = Array.from(this.selecionadosCores);

    if (!ids.length) {
      this.toastr.warning('Selecione pelo menos uma cor ou pule essa etapa.');
      return;
    }

    this.onboardingService
      .concluirTarefa({
        step: 'CORES_PADRAO',
        coresSelecionadasIds: ids,
      })
      .subscribe({
        next: () => {
          this.toastr.success('Cores padrão adicionadas com sucesso.');
          this.stepper.next();
        },
        error: () => {
          this.toastr.error('Erro ao cadastrar cores padrão.');
        },
      });
  }

  salvarFormatosEProsseguir(): void {
    const ids = Array.from(this.selecionadosFormatos);

    if (!ids.length) {
      this.toastr.warning('Selecione pelo menos um formato ou pule essa etapa.');
      return;
    }

    this.onboardingService
      .concluirTarefa({
        step: 'FORMATOS_PADRAO',
        formatosSelecionadosIds: ids,
      })
      .subscribe({
        next: () => {
          this.toastr.success('Formatos padrão adicionados com sucesso.');
          this.stepper.next();
        },
        error: () => {
          this.toastr.error('Erro ao cadastrar formatos padrão.');
        },
      });
  }

  salvarMateriaisEProsseguir(): void {
    const ids = Array.from(this.selecionadosMateriais);

    if (!ids.length) {
      this.toastr.warning('Selecione pelo menos um material ou pule essa etapa.');
      return;
    }

    this.onboardingService
      .concluirTarefa({
        step: 'MATERIAIS_PADRAO',
        materiaisSelecionadosIds: ids,
      })
      .subscribe({
        next: () => {
          this.toastr.success('Materiais padrão adicionados com sucesso.');
          this.stepper.next();
        },
        error: () => {
          this.toastr.error('Erro ao cadastrar materiais padrão.');
        },
      });
  }

  salvarServicosEProsseguir(): void {
    const ids = Array.from(this.selecionadosServicos);

    if (!ids.length) {
      this.toastr.warning('Selecione pelo menos um serviço ou pule essa etapa.');
      return;
    }

    this.onboardingService
      .concluirTarefa({
        step: 'SERVICOS_PADRAO',
        servicosSelecionadosIds: ids,
      })
      .subscribe({
        next: () => {
          this.toastr.success('Serviços padrão adicionados com sucesso.');
          this.stepper.next();
        },
        error: () => {
          this.toastr.error('Erro ao cadastrar serviços padrão.');
        },
      });
  }

  // FINAL
  finalizarOnboarding(): void {
    if (this.naoMostrarMais) {
      this.onboardingService.desativarOnboarding().subscribe({
        next: () => {
          this.toastr.success('Onboarding desativado para próximos acessos.');
          this.dialogRef.close(true);
        },
        error: () => {
          this.toastr.error('Erro ao desativar onboarding.');
          this.dialogRef.close(false);
        },
      });
    } else {
      this.toastr.success('Onboarding concluído!');
      this.dialogRef.close(true);
    }
  }
}
