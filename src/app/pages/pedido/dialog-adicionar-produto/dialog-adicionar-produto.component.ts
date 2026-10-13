import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';

import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogClose } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProdutoService } from '../../cadastro-tecnico/services/produto.service';
import { SelecionarProdutoStepComponent } from './steps/selecionar-produto-step/selecionar-produto-step.component';
import { EscolherVariacaoStepComponent } from './steps/escolher-variacao-step/escolher-variacao-step.component';
import { ServicosStepComponent } from './steps/servicos-step/servicos-step.component';
import { RevisaoStepComponent } from './steps/revisao-step/revisao-step.component';

import { ProdutoListagem } from 'src/app/models/produto/produto-listagem.model';
import { Preco } from 'src/app/models/preco/preco-response.model';
import { ServicoResponse } from 'src/app/models/servico/servico-response.model';

import { ConfigurarPrecoStepComponent } from './steps/configurar-preco-step/configurar-preco-step.component';
import { AcabamentoVariacaoResponse } from 'src/app/models/acabamento/acabamento-variacao-response.model';

type Variacao = {
    id: number;
    materialId: number; materialNome: string;
    formatoId: number | null; formatoNome: string | null;
    corId?: number | null; corNome?: string | null;
    preco: Preco;
    acabamentos: AcabamentoVariacaoResponse[];
    servicos: ServicoResponse[];
};


@Component({
    standalone: true,
    selector: 'app-dialog-adicionar-produto',
    templateUrl: './dialog-adicionar-produto.component.html',
    styleUrls: ['./dialog-adicionar-produto.component.scss'],
    imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatStepperModule,
    MatButtonModule,
    MatRadioModule,
    MatDividerModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogClose,
    SelecionarProdutoStepComponent,
    EscolherVariacaoStepComponent,
    ServicosStepComponent,
    RevisaoStepComponent,
    ConfigurarPrecoStepComponent
],
})
export class DialogAdicionarProdutoComponent {
    precoReady = false;
    isFinishing = false;

    // ======= Forms
    readonly selectForm: FormGroup = this.fb.group({
        produtoId: [null as number | null, Validators.required],
    });

    readonly variacaoForm: FormGroup = this.fb.group({
        variacaoId: [null as number | null, Validators.required],
        acabamentoIds: this.fb.control<number[]>([]),
    });

    readonly configForm: FormGroup = this.fb.group({});
    readonly servicosForm: FormGroup = this.fb.group({
        servicoIds: this.fb.control<number[]>([]),
    });

    // ======= Estado
    produtoIdSelecionado: number | null = null;
    produtoBase: { id: number; nome: string; descricao: string | null } | null = null;

    loadingVariacoes = false;
    variacoes: Variacao[] = [];

    selectedVariacao: Variacao | null = null;

    // preço
    produtoAtual: ProdutoListagem | null = null;
    resumoPreco: any = null;

    // disponíveis por variação
    servicosDisponiveis: ServicoResponse[] = [];
    acabamentosDisponiveis: AcabamentoVariacaoResponse[] = [];

    @ViewChild(MatStepper) stepper!: MatStepper;

    constructor(
        private readonly dialogRef: MatDialogRef<DialogAdicionarProdutoComponent>,
        private readonly fb: FormBuilder,
        private readonly produtoService: ProdutoService,
        private readonly cdr: ChangeDetectorRef,
    ) { }

    // ======= Navegação (footer fixo)
    // ======= Navegação (footer fixo)
    get isFirstStep(): boolean {
        return (this.stepper?.selectedIndex ?? 0) === 0;
    }
    get isLastStep(): boolean {
        return (this.stepper?.selectedIndex ?? 0) === 4; // 0..4
    }
    get currentStepLabel(): string {
        const labels = ['Selecionar Produto', 'Escolher Variação', 'Configurar Preço', 'Serviços', 'Revisão'];
        const i = this.stepper?.selectedIndex ?? 0;
        return labels[i] || '';
    }
    get nextLabel(): 'Próximo' | 'Concluir' {
        return this.isLastStep ? 'Concluir' : 'Próximo';
    }
    get nextDisabled(): boolean {
        const i = this.stepper?.selectedIndex ?? 0;
        switch (i) {
            case 0: return this.selectForm.invalid || this.loadingVariacoes;
            case 1: return !this.selectedVariacao;
            case 2:
                return !this.precoReady;
            default: return false;
        }
    }
    goPrev(): void {
        if (!this.isFirstStep) this.stepper.previous();
    }
    goNext(): void {
        if (this.isLastStep) {
            this.finish();
            return;
        }
        const i = this.stepper?.selectedIndex ?? 0;
        if (i === 0) {                           // sair do passo 1 -> carregar variações
            if (!this.nextDisabled) this.irParaVariacao(this.stepper);
            return;
        }
        if (i === 1) {                           // sair do passo 2 -> preparar produto para preço
            if (!this.nextDisabled) this.irParaConfig(this.stepper);
            return;
        }
        if (!this.nextDisabled) {
            // garante que serviços/acabamentos acompanhem a variação ao avançar
            if (this.selectedVariacao) {
                this.servicosDisponiveis = Array.isArray(this.selectedVariacao.servicos) ? this.selectedVariacao.servicos : [];
                this.acabamentosDisponiveis = Array.isArray(this.selectedVariacao.acabamentos) ? this.selectedVariacao.acabamentos : [];
            }
            this.stepper.next();
        }
    }
    finish(): void {
        if (this.isFinishing || this.nextDisabled) return;
        this.isFinishing = true;
        try {
            this.finalizar();
        } finally {
            this.isFinishing = false;
        }
    }

    // ======= STEP 1
    onSelecionarProduto(produto: ProdutoListagem) {
        this.produtoIdSelecionado = produto?.id ?? null;
        this.selectForm.get('produtoId')?.setValue(this.produtoIdSelecionado);
        this.produtoBase = { id: produto.id, nome: produto.nome ?? '', descricao: produto.descricao ?? null };
    }

    irParaVariacao(stepper: MatStepper) {
        if (!this.produtoIdSelecionado) return;
        this.loadingVariacoes = true;

        this.produtoService.buscarPorId(this.produtoIdSelecionado).subscribe({
            next: (res: any) => {
                this.loadingVariacoes = false;

                this.produtoBase = { id: res.id, nome: res.nome, descricao: res.descricao ?? null };
                this.variacoes = Array.isArray(res.variacoes) ? (res.variacoes as Variacao[]) : [];
                this.debug('Variacoes carregadas', this.variacoes?.length ?? 0);

                // reset seleção
                this.selectedVariacao = null;
                this.servicosDisponiveis = [];
                this.acabamentosDisponiveis = [];
                this.variacaoForm.reset({ variacaoId: null, acabamentoIds: [] });
                this.servicosForm.reset({ servicoIds: [] });

                stepper.next();
            },
            error: () => (this.loadingVariacoes = false),
        });
    }

    onVariacaoSelecionada(evt: { variacao: Variacao | null; servicos: ServicoResponse[]; acabamentos: AcabamentoVariacaoResponse[] }) {
        this.selectedVariacao = evt?.variacao ?? null;
        this.servicosDisponiveis = evt?.servicos ?? [];
        this.acabamentosDisponiveis = evt?.acabamentos ?? [];
        this.variacaoForm.get('variacaoId')?.setValue(this.selectedVariacao?.id ?? null);

        // Sempre reseta seleções dependentes ao trocar variação
        this.servicosForm.patchValue({ servicoIds: [] }, { emitEvent: false });
        this.variacaoForm.patchValue({ acabamentoIds: [] }, { emitEvent: false });
        this.debug('Variacao selecionada', {
            variacaoId: this.selectedVariacao?.id ?? null,
            servicos: this.servicosDisponiveis.length,
            acabamentos: this.acabamentosDisponiveis.length
        });
        this.cdr.detectChanges();
    }

    // ======= STEP 2 handled in app-escolher-variacao-step

    resumoVariacao(v: Variacao): string {
        const cor = v?.corNome ?? '—';
        return `${v?.materialNome ?? '—'} - ${v?.formatoNome ?? '—'} - ${cor}`;
    }

    get resumoVariacaoComAcab(): string {
        if (!this.selectedVariacao) return '—';
        const base = this.resumoVariacao(this.selectedVariacao); // já existente
        const acabs = this.acabamentosSelecionadosDetalhe
            .map(a => a?.nome)
            .filter(Boolean) as string[];

        return acabs.length ? `${base} - ${acabs.join(' + ')}` : base;
    }

    // ======= STEP 3 (preço)
    irParaConfig(stepper: MatStepper) {
        if (!this.selectedVariacao || !this.produtoBase) return;

        this.precoReady = false;
        this.resumoPreco = null;
        this.servicosDisponiveis = Array.isArray(this.selectedVariacao.servicos) ? this.selectedVariacao.servicos : [];
        this.acabamentosDisponiveis = Array.isArray(this.selectedVariacao.acabamentos) ? this.selectedVariacao.acabamentos : [];

        this.produtoAtual = {
            id: this.produtoBase.id,
            nome: this.produtoBase.nome,
            descricao: this.produtoBase.descricao ?? '',
            preco: this.selectedVariacao.preco,
            ativo: true,
            categoria: '',
            grupo: '',
            variacaoId: this.selectedVariacao.id,
            produtoVariacaoId: this.selectedVariacao.id,
        } as unknown as ProdutoListagem;
        this.debug('Ir para config', {
            variacaoId: this.selectedVariacao.id,
            servicos: this.servicosDisponiveis.length,
            acabamentos: this.acabamentosDisponiveis.length
        });

        stepper.next();
    }

    onConfigConcluida(payload: any) {
        this.resumoPreco = { ...payload, produtoVariacaoId: this.selectedVariacao?.id };
        this.precoReady = true;
    }

    onPrecoReady(ready: boolean) {
        this.precoReady = ready;
    }

    // ======= STEP 4 (serviços) + helpers de seleção
    get servicoIdsCtrl(): FormControl<number[]> { return this.servicosForm.get('servicoIds') as FormControl<number[]>; }
    get acabamentoIdsCtrl(): FormControl<number[]> { return this.variacaoForm.get('acabamentoIds') as FormControl<number[]>; }
    get isSelectedWrapper(): (id: number) => boolean {
        return (id: number) => this.isSelected(this.acabamentoIdsCtrl, id);
    }
    onAcabamentoToggle(evt: { id: number; checked: boolean }): void {
        this.toggle(this.acabamentoIdsCtrl, evt.id, evt.checked);
    }

    isSelected(ctrl: FormControl<number[]>, id: number): boolean {
        return (ctrl.value ?? []).includes(id);
    }
    toggle(ctrl: FormControl<number[]>, id: number, checked: boolean): void {
        let arr = [...(ctrl.value ?? [])];
        arr = checked ? (arr.includes(id) ? arr : [...arr, id]) : arr.filter(x => x !== id);
        ctrl.setValue(arr);
    }

    get servicosSelecionadosDetalhe(): ServicoResponse[] {
        const ids = this.servicoIdsCtrl.value ?? [];
        return this.servicosDisponiveis.filter(s => ids.includes(s.id));
    }

    get acabamentosSelecionadosDetalhe(): AcabamentoVariacaoResponse[] {
        const ids = this.acabamentoIdsCtrl.value ?? [];
        return this.acabamentosDisponiveis.filter(a => ids.includes(a.id));
    }

    // ======= Revisão / Totais
    precoResumo(p: Preco | null | undefined): string {
        if (!p) return '—';
        switch (p.tipo) {
            case 'FIXO': return `Fixo: R$ ${this.num((p as any).valor)}`;
            case 'HORA': return `Hora: R$ ${this.num((p as any).valorHora)}${(p as any).tempoEstimado ? ` / ${(p as any).tempoEstimado} min` : ''}`;
            case 'QUANTIDADE': return `Qtd: ${(p as any).faixas?.length ?? 0} faixa(s)`;
            case 'DEMANDA': return `Demanda: ${(p as any).faixas?.length ?? 0} faixa(s)`;
            case 'METRO': return `Metro: R$ ${this.num((p as any).precoMetro)}`;
        }
        return '—';
    }
    private num(v: number | null | undefined): string {
        const n = Number(v ?? 0);
        return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    get baseResumoTexto(): string | null {
        const tipo = this.selectedVariacao?.preco?.tipo;
        if (!tipo || !this.resumoPreco) return null;

        if (tipo === 'METRO') {
            // 1) Tenta usar o que o filho já mandou
            let areaM2 = Number(this.resumoPreco?.areaM2);

            // 2) Fallback: converte cm → m² se vier apenas altura/largura
            if (!areaM2) {
                const aCm = Number(this.resumoPreco?.altura ?? this.resumoPreco?.alturaCm ?? 0);
                const lCm = Number(this.resumoPreco?.largura ?? this.resumoPreco?.larguraCm ?? 0);
                if (aCm && lCm) areaM2 = (aCm * lCm) / 10000;
            }

            return areaM2
                ? `Área: ${areaM2.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`
                : null;
        }

        if (tipo === 'FIXO') {
            const qtd = Number(this.resumoPreco?.quantidade ?? 1);
            return `Qtd: ${qtd}`;
        }
        if (tipo === 'QUANTIDADE' || tipo === 'DEMANDA') {
            const det = this.resumoPreco?.detalhe || this.resumoPreco?.faixa || this.resumoPreco?.quantidade;
            return det ? String(det) : null;
        }
        return null;
    }

    get baseSubtotal(): number | null {
        const preco = this.selectedVariacao?.preco;
        if (!preco) return null;

        // Prioriza o que veio do filho
        const totalDireto = Number(
            this.resumoPreco?.total ??
            this.resumoPreco?.subTotal ??
            this.resumoPreco?.subtotal ??
            this.resumoPreco?.valorTotal
        );
        if (!Number.isNaN(totalDireto)) return totalDireto;

        switch (preco.tipo) {
            case 'FIXO': {
                const unit = Number((preco as any).valor ?? 0);
                const qtd = this.baseQtd || 1;
                return unit * qtd;
            }
            case 'METRO': {
                const pM = Number((preco as any).precoMetro ?? 0);
                const pMin = Number((preco as any).precoMinimo ?? 0);
                let areaM2 = Number(this.resumoPreco?.areaM2);
                if (!areaM2) {
                    const aCm = Number(this.resumoPreco?.altura ?? this.resumoPreco?.alturaCm ?? 0);
                    const lCm = Number(this.resumoPreco?.largura ?? this.resumoPreco?.larguraCm ?? 0);
                    if (aCm && lCm) areaM2 = (aCm * lCm) / 10000;
                }
                const qtd = this.baseQtd || 1;
                if (!pM || !areaM2 || !qtd) return null;
                const unit = Math.max(areaM2 * pM, pMin);
                return unit * qtd;
            }
            case 'QUANTIDADE':
            case 'DEMANDA': {
                const tot = Number(this.resumoPreco?.subtotal ?? this.resumoPreco?.total ?? NaN);
                return Number.isNaN(tot) ? null : tot;
            }
            default:
                return null;
        }
    }


    get adicionaisFixosSubtotal(): number {
        const soma = (arr: any[]) =>
            (arr || [])
                .map(x => this.precoFixo(x.preco))
                .filter((v): v is number => typeof v === 'number')
                .reduce((a, b) => a + b, 0);

        return soma(this.acabamentosSelecionadosDetalhe) + soma(this.servicosSelecionadosDetalhe);
    }

    get qtdeVariaveis(): number {
        const countVar = (arr: any[]) => (arr || []).filter(x => !this.precoFixo(x.preco)).length;
        return countVar(this.acabamentosSelecionadosDetalhe) + countVar(this.servicosSelecionadosDetalhe);
    }

    get totalConhecido(): number | null {
        return this.baseSubtotal === null ? null : this.baseSubtotal + this.adicionaisFixosSubtotal;
    }

    /** Quantidade do item base (padrão 1) */
    get baseQtd(): number {
        return Number(this.resumoPreco?.quantidade ?? 1);
    }

    /** Valor unitário do item base (com fallback p/ QUANTIDADE/DEMANDA) */
    get baseUnit(): number | null {
        const tipo = this.selectedVariacao?.preco?.tipo;
        if (!tipo) return null;

        const fromChild = Number(this.resumoPreco?.valorUnitario);
        if (!Number.isNaN(fromChild) && fromChild > 0) return fromChild;

        if (tipo === 'FIXO') {
            const v = Number((this.selectedVariacao?.preco as any)?.valor ?? NaN);
            return Number.isNaN(v) ? null : v;
        }

        if (tipo === 'QUANTIDADE' || tipo === 'DEMANDA') {
            const total = Number(this.resumoPreco?.subTotal ?? this.resumoPreco?.total ?? NaN);
            const q = this.baseQtd || 1;
            if (!Number.isNaN(total) && q > 0) return total / q;
        }

        return null;
    }

    precoFixo(p?: Preco | null): number | null {
        if (!p || p.tipo !== 'FIXO') return null;
        const v = Number((p as any).valor ?? NaN);
        return Number.isNaN(v) ? null : v;
    }

    money(v?: number | null): string {
        const n = Number(v ?? 0);
        return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    unitFromPreco(p?: Preco | null): number | null {
        if (!p || p.tipo !== 'FIXO') return null;
        const v = Number((p as any).valor ?? NaN);
        return Number.isNaN(v) ? null : v;
    }


    // ======= Finalização
    finalizar(): void {
        const itens = this.buildPedidoItens();
        this.dialogRef.close(itens);
    }

    // ===== Helpers numéricos (coloque dentro da classe)
    private toNumber(v: any): number {
        if (v === null || v === undefined) return NaN;
        if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
        const s = String(v).trim().replace(',', '.');
        const n = Number(s);
        return Number.isFinite(n) ? n : NaN;
    }

    private pickNumber(obj: any, keys: string[]): number | null {
        for (const k of keys) {
            const n = this.toNumber(obj?.[k]);
            if (!Number.isNaN(n)) return n;
        }
        return null;
    }

    private buildPedidoItens(): any[] {
        const itens: any[] = [];
        if (!this.selectedVariacao) return itens;

        const v = this.selectedVariacao;
        const p = this.resumoPreco ?? {};
        const tipo = v.preco?.tipo;

        const baseNome = this.produtoBase?.nome ?? 'Produto';
        const variacaoTxt = [v.materialNome, v.formatoNome, v.corNome].filter(Boolean).join(' / ');
        const nomeComposto = `${baseNome} / ${variacaoTxt}`;

        const qtd = Number(p?.quantidade ?? 1) || 1;

        const pickNum = (...keys: string[]) => {
            for (const k of keys) {
                const raw = (p as any)?.[k];
                const n = typeof raw === 'string'
                    ? Number(String(raw).replace(',', '.'))
                    : Number(raw);
                if (Number.isFinite(n)) return n;
            }
            return NaN;
        };

        let unit = NaN;
        let subtotal = NaN;

        if (tipo === 'FIXO') {
            unit = Number((v.preco as any)?.valor ?? 0);
            subtotal = unit * qtd;
        } else if (tipo === 'METRO') {
            unit = pickNum('valorUnitario', 'unit', 'unitario');
            subtotal = pickNum('subTotal', 'subtotal', 'total', 'valorTotal');
        } else if (tipo === 'QUANTIDADE' || tipo === 'DEMANDA') {
            unit = pickNum('valorUnitario', 'unit', 'unitario', 'valor', 'precoUnitario');
            subtotal = pickNum('subTotal', 'subtotal', 'total', 'valorTotal', 'precoTotal');
        }

        if (!Number.isFinite(subtotal)) subtotal = Number.isFinite(unit) ? unit * qtd : 0;
        if (!Number.isFinite(unit) && qtd > 0) unit = subtotal / qtd;
        if (!Number.isFinite(unit)) unit = 0;

        const largura = Number((p as any)?.largura ?? (p as any)?.larguraCm ?? NaN);
        const altura = Number((p as any)?.altura ?? (p as any)?.alturaCm ?? NaN);

        itens.push({
            produtoVariacaoId: v.id,
            produtoId: this.produtoBase?.id ?? v.id,
            nome: nomeComposto,
            quantidade: qtd,
            valor: unit,
            subTotal: subtotal,
            largura: Number.isFinite(largura) ? largura : undefined,
            altura: Number.isFinite(altura) ? altura : undefined,
            servicosIds: this.servicoIdsCtrl.value ?? [],
            acabamentosIds: this.acabamentoIdsCtrl.value ?? [],
        });

        return itens;
    }

    trackById(_: number, item: { id: number | null }) { return item.id ?? 'null'; }

    private debug(label: string, payload?: any): void {
        // eslint-disable-next-line no-console
        console.log(`[DialogAdicionarProduto] ${label}`, payload ?? '');
    }
}
