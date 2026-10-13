
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr.service';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { InputOptionsComponent } from 'src/app/components/inputs/input-options/input-options.component';
import { InputNumericoComponent } from 'src/app/components/inputs/input-numerico/input-numerico.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { FolhaConfiguracaoEmpresa } from '../../pessoas/folha/models/folha.model';
import { FolhaPagamentoService } from '../../pessoas/folha/services/folha-pagamento.service';
import { MaterialModule } from 'src/app/material.module';

@Component({
  selector: 'app-folha-config',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaterialModule,
    CardHeaderComponent,
    SectionCardComponent,
    InputOptionsComponent,
    InputNumericoComponent,
    TemPermissaoDirective
],
  templateUrl: './folha-config.component.html',
  styleUrl: './folha-config.component.scss'
})
export class FolhaConfigComponent implements OnInit {
  carregando = false;
  salvando = false;

  readonly regraPagamentoOptions = [
    { id: 'QUINTO_DIA_UTIL', nome: '5º dia útil' },
    { id: 'DIA_FIXO', nome: 'Dia fixo' }
  ];
  readonly simNaoOptions = [
    { id: true, nome: 'Sim' },
    { id: false, nome: 'Não' }
  ];
  readonly politicaPassagemOptions = [
    { id: 'NAO_APLICAR', nome: 'Não aplicar na folha' },
    { id: 'PROVENTO', nome: 'Somar como provento' },
    { id: 'DESCONTO', nome: 'Descontar na folha' }
  ];

  form = this.fb.group({
    regraPagamentoPadrao: ['QUINTO_DIA_UTIL' as 'DIA_FIXO' | 'QUINTO_DIA_UTIL', [Validators.required]],
    diaPagamentoPadrao: [null as number | null, [Validators.min(1), Validators.max(31)]],
    politicaPassagem: ['NAO_APLICAR' as 'NAO_APLICAR' | 'PROVENTO' | 'DESCONTO', [Validators.required]],
    permitirAdiantamento: [false],
    permitirEmprestimo: [false],
    limitePercentualSalario: [null as number | null, [Validators.min(0), Validators.max(100)]],
    maxParcelasEmprestimo: [null as number | null, [Validators.min(1)]],
    carenciaMinCompetencias: [0 as number | null, [Validators.min(0)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: FolhaPagamentoService,
    private readonly toastr: ToastrService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.form.get('regraPagamentoPadrao')?.valueChanges.subscribe((regra) => {
      const diaControl = this.diaPagamentoControl;
      if (regra === 'DIA_FIXO') {
        diaControl.addValidators([Validators.required, Validators.min(1), Validators.max(31)]);
      } else {
        diaControl.setValue(null, { emitEvent: false });
        diaControl.clearValidators();
      }
      diaControl.updateValueAndValidity({ emitEvent: false });
    });

    this.form.get('permitirEmprestimo')?.valueChanges.subscribe((permitir) => {
      if (!permitir) {
        this.maxParcelasControl.setValue(null, { emitEvent: false });
      }
      this.atualizarDependenciasPolitica();
    });
    this.form.get('permitirAdiantamento')?.valueChanges.subscribe(() => this.atualizarDependenciasPolitica());

    this.carregar();
  }

  get regraPagamentoControl(): FormControl {
    return this.form.get('regraPagamentoPadrao') as FormControl;
  }

  get diaPagamentoControl(): FormControl {
    return this.form.get('diaPagamentoPadrao') as FormControl;
  }

  get permitirAdiantamentoControl(): FormControl {
    return this.form.get('permitirAdiantamento') as FormControl;
  }

  get permitirEmprestimoControl(): FormControl {
    return this.form.get('permitirEmprestimo') as FormControl;
  }

  get politicaPassagemControl(): FormControl {
    return this.form.get('politicaPassagem') as FormControl;
  }

  get maxParcelasControl(): FormControl {
    return this.form.get('maxParcelasEmprestimo') as FormControl;
  }

  get carenciaControl(): FormControl {
    return this.form.get('carenciaMinCompetencias') as FormControl;
  }

  get resumoRegraPagamento(): string {
    const regra = String(this.regraPagamentoControl.value || 'QUINTO_DIA_UTIL');
    if (regra === 'DIA_FIXO') {
      const dia = Number(this.diaPagamentoControl.value || 0);
      return dia > 0 ? `Dia fixo (${dia})` : 'Dia fixo';
    }
    return '5º dia útil';
  }

  get resumoPoliticaPassagem(): string {
    const politica = String(this.politicaPassagemControl.value || 'NAO_APLICAR');
    if (politica === 'PROVENTO') return 'Somar como provento';
    if (politica === 'DESCONTO') return 'Descontar na folha';
    return 'Não aplicar na folha';
  }

  get resumoPoliticaAcordos(): string {
    const adiantamento = Boolean(this.permitirAdiantamentoControl.value) ? 'Adiantamento: sim' : 'Adiantamento: não';
    const emprestimo = Boolean(this.permitirEmprestimoControl.value) ? 'Empréstimo: sim' : 'Empréstimo: não';
    return `${adiantamento} • ${emprestimo}`;
  }

  get exibirParametrosAcordo(): boolean {
    return Boolean(this.permitirAdiantamentoControl.value) || Boolean(this.permitirEmprestimoControl.value);
  }

  get exibirParametrosEmprestimo(): boolean {
    return Boolean(this.permitirEmprestimoControl.value);
  }

  salvar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const payload: FolhaConfiguracaoEmpresa = {
      regraPagamentoPadrao: raw.regraPagamentoPadrao!,
      diaPagamentoPadrao: raw.regraPagamentoPadrao === 'DIA_FIXO' ? Number(raw.diaPagamentoPadrao) : null,
      politicaPassagem: raw.politicaPassagem || 'NAO_APLICAR',
      permitirAdiantamento: Boolean(raw.permitirAdiantamento),
      permitirEmprestimo: Boolean(raw.permitirEmprestimo),
      limitePercentualSalario:
        raw.limitePercentualSalario === null || raw.limitePercentualSalario === undefined
          ? null
          : Number(raw.limitePercentualSalario),
      maxParcelasEmprestimo:
        raw.maxParcelasEmprestimo === null || raw.maxParcelasEmprestimo === undefined
          ? null
          : Number(raw.maxParcelasEmprestimo),
      carenciaMinCompetencias:
        raw.carenciaMinCompetencias === null || raw.carenciaMinCompetencias === undefined
          ? 0
          : Number(raw.carenciaMinCompetencias)
    };

    this.salvando = true;
    this.service.salvarConfiguracaoFolha$(payload).subscribe({
      next: (cfg) => {
        this.toastr.success('Configuração da folha salva com sucesso.');
        this.patchForm(cfg);
        this.salvando = false;
      },
      error: (err) => {
        this.toastr.error(err?.userMessage || 'Não foi possível salvar a configuração da folha.');
        this.salvando = false;
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/page/folha-pagamento']);
  }

  private carregar(): void {
    this.carregando = true;
    this.service.obterConfiguracaoFolha$().subscribe({
      next: (cfg) => {
        this.patchForm(cfg);
        this.carregando = false;
      },
      error: (err) => {
        this.toastr.error(err?.userMessage || 'Não foi possível carregar a configuração da folha.');
        this.carregando = false;
      }
    });
  }

  private patchForm(cfg: FolhaConfiguracaoEmpresa): void {
    this.form.patchValue(
      {
        regraPagamentoPadrao: cfg.regraPagamentoPadrao || 'QUINTO_DIA_UTIL',
        diaPagamentoPadrao: cfg.diaPagamentoPadrao ?? null,
        politicaPassagem: cfg.politicaPassagem || 'NAO_APLICAR',
        permitirAdiantamento: Boolean(cfg.permitirAdiantamento),
        permitirEmprestimo: Boolean(cfg.permitirEmprestimo),
        limitePercentualSalario: cfg.limitePercentualSalario ?? null,
        maxParcelasEmprestimo: cfg.maxParcelasEmprestimo ?? null,
        carenciaMinCompetencias: cfg.carenciaMinCompetencias ?? 0
      },
      { emitEvent: true }
    );
    this.atualizarDependenciasPolitica();
  }

  private atualizarDependenciasPolitica(): void {
    const permitirAdiantamento = Boolean(this.permitirAdiantamentoControl.value);
    const permitirEmprestimo = Boolean(this.permitirEmprestimoControl.value);
    const existeAcordoAtivo = permitirAdiantamento || permitirEmprestimo;

    if (!permitirEmprestimo) {
      this.maxParcelasControl.setValue(null, { emitEvent: false });
      this.maxParcelasControl.disable({ emitEvent: false });
    } else {
      this.maxParcelasControl.enable({ emitEvent: false });
    }

    const limiteControl = this.form.get('limitePercentualSalario') as FormControl;
    if (!existeAcordoAtivo) {
      limiteControl.setValue(null, { emitEvent: false });
      this.carenciaControl.setValue(0, { emitEvent: false });
      limiteControl.disable({ emitEvent: false });
      this.carenciaControl.disable({ emitEvent: false });
    } else {
      limiteControl.enable({ emitEvent: false });
      this.carenciaControl.enable({ emitEvent: false });
    }
  }
}
