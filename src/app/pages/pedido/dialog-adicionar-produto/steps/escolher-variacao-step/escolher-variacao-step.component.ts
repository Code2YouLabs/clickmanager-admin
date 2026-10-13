
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Preco } from 'src/app/models/preco/preco-response.model';
import { AcabamentoVariacaoResponse } from 'src/app/models/acabamento/acabamento-variacao-response.model';
import { ServicoResponse } from 'src/app/models/servico/servico-response.model';

type IdNome = { id: number | null; nome: string };
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
    selector: 'app-escolher-variacao-step',
    templateUrl: './escolher-variacao-step.component.html',
    styleUrls: ['./escolher-variacao-step.component.scss'],
    imports: [
    ReactiveFormsModule,
    MatRadioModule,
    MatDividerModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatIconModule,
    MatProgressSpinnerModule
],
})
export class EscolherVariacaoStepComponent implements OnChanges {
    @Input() form!: FormGroup;
    @Input() variacoes: Variacao[] = [];
    @Input() loadingVariacoes = false;
    @Input() resumoVariacaoComAcab: string | null = null;

    @Input() precoResumoFn!: (p: Preco | null | undefined) => string;
    @Input() isSelectedFn!: (id: number) => boolean;

    @Output() acabamentoToggle = new EventEmitter<{ id: number; checked: boolean }>();
    @Output() selectionChange = new EventEmitter<{
        variacao: Variacao | null;
        servicos: ServicoResponse[];
        acabamentos: AcabamentoVariacaoResponse[];
    }>();

    materiais: IdNome[] = [];
    formatos: IdNome[] = [];
    cores: IdNome[] = [];

    selMaterialId: number | null = null;
    selFormatoId: number | null = null;
    selCorId: number | null = null;
    materialChosen = false;
    formatoChosen = false;
    corChosen = false;

    selectedVariacao: Variacao | null = null;
    acabamentosDisponiveis: AcabamentoVariacaoResponse[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['variacoes']) {
            this.resetSelections();
            this.rebuildMateriais();
        }
    }

    private resetSelections(): void {
        this.selMaterialId = null;
        this.selFormatoId = null;
        this.selCorId = null;
        this.materialChosen = false;
        this.formatoChosen = false;
        this.corChosen = false;
        this.selectedVariacao = null;
        this.acabamentosDisponiveis = [];
        this.form?.patchValue({ variacaoId: null, acabamentoIds: [] }, { emitEvent: false });
    }

    private uniq<T extends IdNome>(arr: T[]): T[] {
        const seen = new Set<string>();
        return arr.filter(x => {
            const key = String(x?.id ?? 'null');
            if (!x || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    private rebuildMateriais(): void {
        const raw = this.variacoes
            .filter(v => v.materialId != null)
            .map(v => ({ id: v.materialId, nome: v.materialNome ?? String(v.materialId) }));

        this.materiais = this.uniq(raw);
        if (this.materiais.length === 1) {
            this.selMaterialId = this.materiais[0].id;
            this.materialChosen = true;
        }
        this.rebuildFormatos();
    }

    private rebuildFormatos(): void {
        if (this.selMaterialId == null) {
            this.formatos = [];
            this.selFormatoId = null;
            this.formatoChosen = false;
            this.rebuildCores();
            return;
        }

        const base = this.variacoes.filter(v => this.materialMatches(v));
        const raw = base.map(v => ({
            id: v.formatoId ?? null,
            nome: v.formatoId == null ? 'Sem formato' : (v.formatoNome ?? String(v.formatoId))
        }));

        this.formatos = this.uniq(raw);

        const temSemFormatoGlobal = this.variacoes.some(v => v.formatoId == null);
        const jaTemSemFormato = this.formatos.some(f => f.id == null);
        if (temSemFormatoGlobal && !jaTemSemFormato) {
            this.formatos = [{ id: null, nome: 'Sem formato' }, ...this.formatos];
        }

        if (this.formatos.length === 1) {
            this.selFormatoId = this.formatos[0].id;
            this.formatoChosen = true;
        }
        this.rebuildCores();
    }

    private rebuildCores(): void {
        if (this.selMaterialId == null) {
            this.cores = [];
            this.selCorId = null;
            this.corChosen = false;
            this.updateSelectedVariacao();
            return;
        }

        let base = this.variacoes.filter(v => this.materialMatches(v) && this.formatoMatches(v));

        if (!base.length && this.formatoChosen && this.selFormatoId === null) {
            base = this.variacoes.filter(v => this.materialMatches(v));
        }

        const raw = base
            .map(v => v.corId != null
                ? { id: v.corId!, nome: v.corNome ?? String(v.corId) }
                : { id: null, nome: 'Sem cor' });

        this.cores = this.uniq(raw);
        if (this.cores.length === 1) {
            this.selCorId = this.cores[0].id;
            this.corChosen = true;
        }

        this.updateSelectedVariacao();
    }

    onSelectMaterial(id: number | string | null) {
        this.selMaterialId = this.coerceSelection(id);
        this.materialChosen = true;
        this.selFormatoId = null;
        this.formatoChosen = false;
        this.selCorId = null;
        this.corChosen = false;
        this.rebuildFormatos();
    }

    onSelectFormato(id: number | string | null) {
        this.selFormatoId = this.coerceSelection(id);
        this.formatoChosen = true;
        this.selCorId = null;
        this.corChosen = false;
        this.rebuildCores();
    }

    onSelectCor(id: number | string | null) {
        this.selCorId = this.coerceSelection(id);
        this.corChosen = true;
        this.updateSelectedVariacao();
    }

    private coerceSelection(val: any): number | null {
        if (val === null || val === undefined || val === '' || val === 'null') return null;
        const n = Number(val);
        return Number.isFinite(n) ? n : null;
    }

    private materialMatches(v: Variacao): boolean {
        if (!this.materialChosen) return true;
        if (this.selMaterialId === null) return v.materialId == null;
        return Number(v.materialId) === this.selMaterialId;
    }

    private formatoMatches(v: Variacao): boolean {
        if (!this.formatoChosen) return true;
        if (this.selFormatoId === null) return v.formatoId == null;
        return Number(v.formatoId) === this.selFormatoId;
    }

    private corMatches(v: Variacao): boolean {
        if (!this.corChosen) return true;
        if (this.selCorId === null) return v.corId == null;
        return String(v.corId ?? '') === String(this.selCorId);
    }

    private updateSelectedVariacao(): void {
        const matches = this.variacoes.filter(v =>
            this.materialMatches(v) &&
            this.formatoMatches(v) &&
            this.corMatches(v)
        );

        // mantém seleção atual se ainda válida
        if (this.selectedVariacao && matches.some(v => v.id === this.selectedVariacao!.id)) {
            this.setSelected(this.selectedVariacao);
            return;
        }

        if (matches.length === 0) {
            this.clearSelection();
            return;
        }

        // escolhe a melhor variação: mais serviços, depois mais acabamentos, depois primeira
        const best = [...matches].sort((a, b) => {
            const srvA = (a.servicos || []).length;
            const srvB = (b.servicos || []).length;
            if (srvA !== srvB) return srvB - srvA;
            const acbA = (a.acabamentos || []).length;
            const acbB = (b.acabamentos || []).length;
            if (acbA !== acbB) return acbB - acbA;
            return 0;
        })[0];

        const narrowed = this.autoNarrow(matches);
        this.setSelected(narrowed || best);
    }

    private autoNarrow(matches: Variacao[]): Variacao | null {
        // tenta reduzir formato
        const formatosRestantes = this.uniq(matches.map(v => ({
            id: v.formatoId ?? null,
            nome: v.formatoId == null ? 'Sem formato' : (v.formatoNome ?? String(v.formatoId))
        })));
        if (!this.formatoChosen && formatosRestantes.length === 1) {
            this.selFormatoId = formatosRestantes[0].id;
            this.formatoChosen = true;
        }

        // tenta reduzir cor
        const coresRestantes = this.uniq(matches.map(v => v.corId != null
            ? { id: v.corId!, nome: v.corNome ?? String(v.corId) }
            : { id: null, nome: 'Sem cor' }));
        if (!this.corChosen && coresRestantes.length === 1) {
            this.selCorId = coresRestantes[0].id;
            this.corChosen = true;
        }

        const narrowed = this.variacoes.filter(v =>
            this.materialMatches(v) &&
            this.formatoMatches(v) &&
            this.corMatches(v)
        );
        return narrowed.length === 1 ? narrowed[0] : null;
    }

    private setSelected(v: Variacao): void {
        this.selectedVariacao = v;
        this.form?.get('variacaoId')?.setValue(v.id);
        this.acabamentosDisponiveis = Array.isArray(v.acabamentos) ? v.acabamentos : [];

        // reset acabamentos quando troca variação
        this.form?.patchValue({ acabamentoIds: [] }, { emitEvent: false });
        const auto = this.acabamentosDisponiveis.length === 1 ? [this.acabamentosDisponiveis[0].id] : [];
        if (auto.length) this.form?.patchValue({ acabamentoIds: auto }, { emitEvent: false });

        this.selectionChange.emit({
            variacao: v,
            servicos: Array.isArray(v.servicos) ? v.servicos : [],
            acabamentos: this.acabamentosDisponiveis,
        });
    }

    private clearSelection(): void {
        this.selectedVariacao = null;
        this.acabamentosDisponiveis = [];
        this.form?.patchValue({ variacaoId: null, acabamentoIds: [] }, { emitEvent: false });
        this.selectionChange.emit({
            variacao: null,
            servicos: [],
            acabamentos: [],
        });
    }

    trackById(_: number, item: { id: number | null }): number | null {
        return item?.id ?? null;
    }
}
