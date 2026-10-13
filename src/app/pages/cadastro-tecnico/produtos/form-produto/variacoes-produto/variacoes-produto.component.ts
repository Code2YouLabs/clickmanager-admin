import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';

import { ToastrService } from 'src/app/services/toastr.service';

import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MatTable, MatTableDataSource, MatTableModule } from '@angular/material/table';

import { VariacaoProduto } from './models/variacao.model';
import { VariacaoProdutoHelperService } from './variacao-produto-helper.service';
import { AutoCompleteComponent } from '../../../../../components/inputs/auto-complete/auto-complete.component';
import { InputMultiSelectComponent } from '../../../../../components/inputs/input-multi-select/input-multi-select-component';
import { PrecoSelectorComponent } from 'src/app/components/preco/preco-selector.component';
import { NomeDePipe } from '../../../../../pipe/nomeDe.pipe';
import { PoliticaRevendaRequest } from 'src/app/models/politica-revenda/politica-revenda-request.model';
import { MatAccordion, MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { PoliticaRevendaResponse } from 'src/app/models/politica-revenda/politica-revenda-response.model';
import { PoliticaRevenda } from 'src/app/models/politica-revenda.model';
import { MatDialog } from '@angular/material/dialog';
import { VariacaoDetalheDialogComponent } from 'src/app/components/dialog/variacao-detalhe-dialog/variacao-detalhe-dialog.component';

@Component({
    standalone: true,
    selector: 'app-variacoes-produto',
    templateUrl: './variacoes-produto.component.html',
    styleUrls: ['./variacoes-produto.component.scss'],
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
    MatRadioModule,
    MatExpansionModule,
    AutoCompleteComponent,
    PrecoSelectorComponent,
    InputMultiSelectComponent,
    NomeDePipe
],
})
export class VariacoesProdutoComponent {

    @ViewChild(MatAccordion) accordion?: MatAccordion;
    @ViewChild('novaVarPanel') novaVarPanel?: MatExpansionPanel;

    materiais: any[] = [];
    formatos: any[] = [];
    servicosDisponiveis: any[] = [];
    acabamentosDisponiveis: { id: any; nome: string }[] = [];
    coresDisponiveis: any[] = [];

    @Input() set variacoesIniciais(v: VariacaoProduto[] | null) {
        if (!v || !v.length) return;

        // preenche a MatTable
        this.dataSource.data = v;

        // força render (às vezes precisa quando vem de async)
        this.table?.renderRows?.();

        // notifica o pai para que ele tenha this.variacoes inicial
        this.emitirVariacoes();
    }
    @Input() politicaProduto: PoliticaRevenda | null = null;

    @Output() variacoesChange = new EventEmitter<VariacaoProduto[]>();

    formVariacaoAtual!: FormGroup;

    // ✅ fonte da tabela
    dataSource = new MatTableDataSource<VariacaoProduto>([]);
    displayedColumns: string[] = ['material', 'formato', 'cor', 'preco', 'politica', 'ver', 'acoes'];

    @ViewChild(MatTable) table!: MatTable<VariacaoProduto>;


    constructor(
        private fb: FormBuilder,
        private helperService: VariacaoProdutoHelperService,
        private toastr: ToastrService,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.helperService.carregarDadosIniciais().subscribe(({ materiais, formatos, servicos, acabamentos }) => {
            this.materiais = materiais;
            this.formatos = formatos;
            this.servicosDisponiveis = servicos;
            this.acabamentosDisponiveis = acabamentos;
        });

        this.iniciarFormulario();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['variacoesIniciais'] && this.variacoesIniciais) {
            this.dataSource.data = [...this.variacoesIniciais];
            this.emitirVariacoes();
        }
    }

    iniciarFormulario(): void {
        this.formVariacaoAtual = this.fb.group({
            materialId: [null, Validators.required],
            formatoId: [null],
            cor: [null],
            acabamentos: this.fb.control([]),
            servicos: this.fb.control([]),

            preco: this.fb.group({}),

            politicaAtiva: this.fb.control(false),

            politicaRevenda: this.fb.group({
                percentual: [true],
                percentualDesconto: [null],
                precoFixo: [null],
            }),
        });

        this.wirePoliticaRevendaReactions();
        this.applyPoliticaEstado(this.formVariacaoAtual.get('politicaAtiva')!.value, 'init');
    }

    private wirePoliticaRevendaReactions(): void {
        this.formVariacaoAtual.get('politicaAtiva')!.valueChanges.subscribe((on: boolean) => {
            this.applyPoliticaEstado(on, 'toggle');
        });

        this.politicaRevendaGroup.get('percentual')!.valueChanges.subscribe(() => {
            this.applyPoliticaEstado(this.formVariacaoAtual.get('politicaAtiva')!.value, 'radio');
        });
    }

    private applyPoliticaEstado(ativa: boolean, from: 'init' | 'toggle' | 'radio' = 'init'): void {
        const grp = this.politicaRevendaGroup;
        const isPercentual = !!grp.get('percentual')!.value;

        grp.get('percentualDesconto')!.clearValidators();
        grp.get('precoFixo')!.clearValidators();

        if (!ativa) {
            grp.get('percentualDesconto')!.disable({ emitEvent: false });
            grp.get('precoFixo')!.disable({ emitEvent: false });
            grp.get('percentualDesconto')!.setValue(null, { emitEvent: false });
            grp.get('precoFixo')!.setValue(null, { emitEvent: false });
        } else if (isPercentual) {
            grp.get('percentualDesconto')!.enable({ emitEvent: false });
            grp.get('precoFixo')!.disable({ emitEvent: false });
            grp.get('percentualDesconto')!.setValidators([Validators.required, Validators.min(0.01), Validators.max(100)]);
            grp.get('precoFixo')!.setValue(null, { emitEvent: false });
        } else {
            grp.get('precoFixo')!.enable({ emitEvent: false });
            grp.get('percentualDesconto')!.disable({ emitEvent: false });
            grp.get('precoFixo')!.setValidators([Validators.required, Validators.min(0.01)]);
            grp.get('percentualDesconto')!.setValue(null, { emitEvent: false });
        }

        grp.updateValueAndValidity({ emitEvent: false });

    }

    verVariacao(v: VariacaoProduto) {
        this.dialog.open(VariacaoDetalheDialogComponent, {
            width: '760px',
            maxHeight: '85vh',
            data: {
                variacao: v,
                lookups: {
                    materiais: this.materiais ?? [],
                    formatos: this.formatos ?? [],
                    cores: this.coresDisponiveis ?? [],
                    acabamentos: this.acabamentosDisponiveis ?? [],
                    servicos: this.servicosDisponiveis ?? [],
                },
                politicaProduto: this.politicaProduto ?? null,
            }
        });
    }

    addVariacao(): void {
        // marca tudo p/ validar
        this.formVariacaoAtual.markAllAsTouched();

        const precoFG = this.formVariacaoAtual.get('preco') as FormGroup | null;
        precoFG?.updateValueAndValidity();

        if (this.formVariacaoAtual.invalid || precoFG?.invalid) {
            const msgPreco = (precoFG?.errors as any)?.precoInvalido?.msg;
            this.toastr.error(msgPreco || 'Preencha os campos obrigatórios.', 'Formulário incompleto');
            this.scrollToFirstInvalid();
            return;
        }

        const toId = (x: any) => (x == null ? null : (typeof x === 'object' ? Number(x.id) : Number(x)));
        const raw = this.formVariacaoAtual.getRawValue();

        // --- Cor: salva id e rótulo para exibir na tabela ---
        const corId = toId(raw.cor);
        const corLabel =
            raw?.cor && typeof raw.cor === 'object'
                ? (raw.cor.nome ?? raw.cor.descricao ?? '---')
                : this.resolveLabel(corId, this.coresDisponiveis);

        // --- Política vem de dentro de "preco" ---
        const politicaAtiva = !!raw?.preco?.politicaAtiva;
        let politicaNormalizada: { percentual: boolean; percentualDesconto: number | null; precoFixo: number | null } | null = null;

        if (politicaAtiva) {
            const pr = raw.preco?.politicaRevenda ?? {};
            if (pr?.percentual) {
                const n = Number(pr.percentualDesconto);
                if (!isFinite(n) || n <= 0) {
                    this.toastr.error('Percentual inválido (> 0).');
                    (precoFG?.get('politicaRevenda.percentualDesconto') as FormControl)?.markAsTouched();
                    return;
                }
                politicaNormalizada = { percentual: true, percentualDesconto: n, precoFixo: null };
            } else {
                const n = Number(pr.precoFixo);
                if (!isFinite(n) || n <= 0) {
                    this.toastr.error('Preço fixo inválido (> 0).');
                    (precoFG?.get('politicaRevenda.precoFixo') as FormControl)?.markAsTouched();
                    return;
                }
                politicaNormalizada = { percentual: false, percentualDesconto: null, precoFixo: n };
            }
        }

        // --- Monta a variação para a tabela/emitir para o pai ---
        const nova: any = {
            materialId: toId(raw.materialId),
            formatoId: toId(raw.formatoId),

            // cor para o backend + label para a UI
            corId,
            corLabel,

            acabamentos: (raw.acabamentos ?? []).map(toId).filter((v: any) => v != null),
            servicos: (raw.servicos ?? []).map(toId).filter((v: any) => v != null),

            // mantém todo o sub-form de preço
            preco: raw.preco,

            // política normalizada (ou null se inativa)
            politicaRevenda: politicaNormalizada,
        };

        // atualiza a fonte da tabela e emite para o pai
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

    // ======= Busca/labels =======
    buscarMateriais = (filtro: string) => this.helperService.buscarMateriais(filtro);
    buscarFormatos = (filtro: string) => this.helperService.buscarFormatos(filtro);
    buscarCores = (filtro: string) => (this.helperService as any).buscarCores
        ? (this.helperService as any).buscarCores(filtro)
        : [];

    mostrarDescricaoMaterial = (x: any) => x?.nome || '';
    mostrarDescricaoFormato = (x: any) => x?.nome || '';
    mostrarDescricao = (x: any) => x?.nome || '';

    // ======= Helpers de form =======
    getFormControl(control: AbstractControl | null): FormControl {
        return control as FormControl;
    }
    getFormGroup(control: AbstractControl | null): FormGroup {
        return control as FormGroup;
    }
    get corControl(): FormControl {
        return this.formVariacaoAtual.get('cor') as FormControl;
    }

    get politicaRevendaGroup(): FormGroup {
        return this.formVariacaoAtual.get('politicaRevenda') as FormGroup;
    }
    get percentualRevendaDescontoControl(): FormControl {
        return this.politicaRevendaGroup.get('percentualDesconto') as FormControl;
    }
    get precoRevendaFixoControl(): FormControl {
        return this.politicaRevendaGroup.get('precoFixo') as FormControl;
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

    // ======= Resumos para a tabela =======
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

    resolveLabel(val: any, options: any[]): string {
        if (val == null) return '---';
        const id = typeof val === 'object' ? val.id : val;
        const found = options?.find(o => String(o.id) === String(id));
        return found?.nome ?? found?.descricao ?? (typeof val === 'object' ? (val.nome ?? val.descricao ?? '---') : '---');
    }

    politicaResumo(pol?: PoliticaRevenda | null): string {
        if (!pol) return '—';
        if (pol.percentual && pol.percentualDesconto != null) {
            return `Desconto ${pol.percentualDesconto}%`;
        }
        if (!pol.percentual && pol.precoFixo != null) {
            return `Preço fixo ${this.moeda(pol.precoFixo)}`;
        }
        return '—';
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
