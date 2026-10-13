import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { FormsModule } from '@angular/forms';

import { MatAccordion, MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';

import { ToastrService } from 'src/app/services/toastr.service';

import { AutoCompleteComponent } from 'src/app/components/inputs/auto-complete/auto-complete.component';
import { PrecoSelectorComponent } from 'src/app/components/preco/preco-selector.component';
import { NomeDePipe } from 'src/app/pipe/nomeDe.pipe';

import { AcabamentoVariacaoResponse } from 'src/app/models/acabamento/acabamento-variacao-response.model';
import { AcabamentoVariacaoHelperService } from './variacoes-acabamento-helper.service';
import { TipoAplicacaoAcabamento } from 'src/app/models/acabamento/tipo-aplicacao-acabamento.enum';
import { of } from 'rxjs';

export interface AcabamentoVariacaoForm {
  id?: number;
  materialId?: any;
  formatoId?: any;
  tipoAplicacao: TipoAplicacaoAcabamento | string;
  preco: any;
  ativo?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-variacoes-acabamento',
  templateUrl: './variacoes-acabamento.component.html',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    MatOptionModule,
    MatCardModule,
    MatTableModule,
    MatExpansionModule,
    MatAccordion,
    AutoCompleteComponent,
    PrecoSelectorComponent,
    NomeDePipe
],
})
export class VariacoesAcabamentoComponent {

  @ViewChild(MatAccordion) accordion?: MatAccordion;
  @ViewChild('novaVarPanel') novaVarPanel?: MatExpansionPanel;
  @ViewChild(MatTable) table!: MatTable<AcabamentoVariacaoForm>;

  materiais: any[] = [];
  formatos: any[] = [];

  @Input() variacoesIniciais: AcabamentoVariacaoResponse[] | null = null;

  @Output() variacoesChange = new EventEmitter<AcabamentoVariacaoForm[]>();

  formVariacaoAtual!: FormGroup;

  dataSource = new MatTableDataSource<AcabamentoVariacaoForm>([]);
  displayedColumns: string[] = ['material', 'formato', 'tipoAplicacao', 'preco', 'acoes'];

  TipoAplicacaoAcabamento = TipoAplicacaoAcabamento;

  constructor(
    private readonly fb: FormBuilder,
    private readonly helperService: AcabamentoVariacaoHelperService,
    private readonly toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.helperService.carregarDadosIniciais().subscribe(({ materiais, formatos }) => {
      this.materiais = materiais;
      this.formatos = formatos;
    });

    this.iniciarFormulario();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['variacoesIniciais'] && this.variacoesIniciais) {
      const mapped: AcabamentoVariacaoForm[] =
        (this.variacoesIniciais ?? []).map(v => ({
          id: v.id,
          materialId: v.materialId ?? null,
          formatoId: v.formatoId ?? null,
          tipoAplicacao: TipoAplicacaoAcabamento.toValue(v.tipoAplicacao) ?? v.tipoAplicacao,
          preco: v.preco,
          ativo: v.ativo,
        }));

      this.dataSource.data = mapped;
      this.emitirVariacoes();
    }
  }


  iniciarFormulario(): void {
    this.formVariacaoAtual = this.fb.group({
      materialId: [null],        // opcional (pode ser acabamento genérico)
      formatoId: [null],         // opcional
      tipoAplicacao: ['', Validators.required],
      preco: this.fb.group({}),  // <app-preco-selector> preenche/valida
      ativo: [true],
    });
  }

  // ======= Adicionar / Remover =======

  addVariacao(): void {
    this.formVariacaoAtual.markAllAsTouched();

    const precoFG = this.formVariacaoAtual.get('preco') as FormGroup | null;
    precoFG?.updateValueAndValidity();

    if (this.formVariacaoAtual.invalid || precoFG?.invalid) {
      const msgPreco = (precoFG?.errors as any)?.precoInvalido?.msg;
      this.toastr.error(msgPreco || 'Preencha os campos obrigatórios.', 'Formulário incompleto');
      this.scrollToFirstInvalid();
      return;
    }

    const raw = this.formVariacaoAtual.getRawValue();

    const materialId = raw.materialId
      ? (typeof raw.materialId === 'object' ? raw.materialId.id : raw.materialId)
      : null;

    const formatoId = raw.formatoId
      ? (typeof raw.formatoId === 'object' ? raw.formatoId.id : raw.formatoId)
      : null;

    const tipoAplicacao = TipoAplicacaoAcabamento.toValue(raw.tipoAplicacao);

    const nova: AcabamentoVariacaoForm = {
      materialId,
      formatoId,
      tipoAplicacao: tipoAplicacao!,
      preco: raw.preco,
      ativo: raw.ativo ?? true,
    };

    this.dataSource.data = [...this.dataSource.data, nova];
    this.emitirVariacoes();

    this.toastr.success('Variação adicionada com sucesso!');
    this.iniciarFormulario();
    this.novaVarPanel?.close();
  }

  removerVariacao(index: number): void {
    const arr = [...this.dataSource.data];
    arr.splice(index, 1);
    this.dataSource.data = arr;
    this.emitirVariacoes();
    this.toastr.info('Variação removida.');
  }

  emitirVariacoes(): void {
    this.variacoesChange.emit(this.dataSource.data);
  }

  // ======= Busca / labels =======

  buscarMateriais = (filtro: string) => this.helperService.buscarMateriais(filtro);
  buscarFormatos = (filtro: string) => this.helperService.buscarFormatos(filtro);
  buscarTiposAplicacao = (filtro: string) => of(TipoAplicacaoAcabamento.buscar(filtro));

  mostrarDescricaoMaterial = (x: any) => x?.nome || '';
  mostrarDescricaoFormato = (x: any) => x?.nome || '';


  mostrarTipoAplicacao = (item: any): string =>
    TipoAplicacaoAcabamento.label(item);


  // ======= Helpers form =======

  getFormControl(control: AbstractControl | null): FormControl {
    return control as FormControl;
  }

  getFormGroup(control: AbstractControl | null): FormGroup {
    return control as FormGroup;
  }

  private scrollToFirstInvalid(): void {
    setTimeout(() => {
      const el = document.querySelector(
        'mat-form-field .ng-invalid, .ng-invalid input, .ng-invalid textarea, .ng-invalid select'
      ) as HTMLElement | null;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as any)?.focus?.();
    }, 0);
  }

  // ======= Resumo preço =======

  precoResumo(preco: any): string {
    if (!preco?.tipo) return '—';
    switch (preco.tipo) {
      case 'FIXO':
        return this.moeda(preco.valor);
      case 'HORA':
        return `${this.moeda(preco.valorHora)}/h`;
      case 'QUANTIDADE': {
        const faixas = preco.faixas ?? [];
        if (!faixas.length) return '—';
        const first = faixas[0];
        return `${faixas.length} faixa(s) (ex.: ${first.quantidade} → ${this.moeda(first.valor)})`;
      }
      case 'DEMANDA': {
        const faixas = preco.faixas ?? [];
        if (!faixas.length) return '—';
        const first = faixas[0];
        const head = `${first.de}–${first.ate} → ${this.moeda(first.valorUnitario)}`;
        return faixas.length > 1 ? `${head} (+${faixas.length - 1})` : head;
      }
      case 'METRO': {
        const modo = preco.modoCobranca === 'LINEAR' ? 'm' : 'm²';
        return `${this.moeda(preco.precoMetro)}/${modo}`;
      }
      default:
        return '—';
    }
  }

  private moeda(v: any): string {
    const n = Number(v);
    if (isNaN(n)) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
  }

  trackByIndex(index: number, _row: any): number {
    return index;
  }
}
