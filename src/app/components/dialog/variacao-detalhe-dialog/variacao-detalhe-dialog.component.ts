
import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';

// modelos (request/response)
import {
    PrecoRequest,
    PrecoFixoRequest,
    PrecoPorQuantidadeRequest,
    PrecoPorDemandaRequest,
    PrecoPorMetroRequest,
} from 'src/app/models/preco/preco.model';

import {
    Preco as PrecoResponse,
    PrecoFixoResponse,
    PrecoPorQuantidadeResponse,
    PrecoPorDemandaResponse,
    PrecoPorMetroResponse,
    PrecoPorHoraResponse,
} from 'src/app/models/preco/preco-response.model';

import { PoliticaRevenda } from 'src/app/models/politica-revenda.model';
import { Acabamento } from 'src/app/models/acabamento/acabamento.model';
import { VariacaoProduto } from 'src/app/models/produto/variacao.model';
import { ServicoResponse } from 'src/app/models/servico/servico-response.model';
import { MatTableModule } from '@angular/material/table';


type PrecoAny =
    | PrecoRequest
    | PrecoResponse;

export interface IdNome { id: number; nome?: string; descricao?: string; label?: string }

export interface VariacaoDetalheDialogData {
    variacao: VariacaoProduto;
    lookups: {
        materiais: IdNome[];
        formatos: IdNome[];
        cores: IdNome[];
        acabamentos: IdNome[];
        servicos: IdNome[];
    };
    politicaProduto?: PoliticaRevenda | null;
}

@Component({
    selector: 'app-variacao-detalhe-dialog',
    standalone: true,
    imports: [
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatChipsModule,
    MatListModule,
    MatTableModule
],
    templateUrl: './variacao-detalhe-dialog.component.html',
    styleUrls: ['./variacao-detalhe-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VariacaoDetalheDialogComponent {

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: VariacaoDetalheDialogData,
        private readonly dialogRef: MatDialogRef<VariacaoDetalheDialogComponent>
    ) { }

    close(): void { this.dialogRef.close(); }

    acabDisplayed = ['nome', 'descricao', 'preco'];
    srvDisplayed = ['nome', 'descricao', 'preco'];

    // ===================== helpers ID/label =====================
    private extractId(val: any): number | null {
        if (val == null) return null;
        if (typeof val === 'number') return val;
        if (typeof val === 'string' && /^\d+$/.test(val)) return Number(val);
        if (typeof val === 'object' && 'id' in val && val.id != null) return Number((val as any).id);
        return null;
    }

    resolveLabel(idOrObj: any, arr: IdNome[] = []): string | null {
        const id = this.extractId(idOrObj);
        if (id == null) return null;
        const found = arr.find(x => Number(x.id) === Number(id));
        return (found?.label ?? found?.nome ?? found?.descricao ?? null) || null;
    }

    resolveCorLabel(): string {
        const v: any = this.data?.variacao ?? null;
        if (!v) return '—';

        
        if (v.cor && typeof v.cor === 'object') {
            const direto = v.cor.nome ?? v.cor.label ?? null;
            if (direto) return direto;
        }

        
        if (typeof v.corNome === 'string' && v.corNome.trim()) {
            return v.corNome;
        }

        
        const id = v.corId ?? (v.cor && typeof v.cor === 'object' ? v.cor.id : v.cor);
        return this.resolveLabel(id, this.data?.lookups?.cores ?? []) || '—';
    }

    private dedupeById<T extends { id?: number }>(list: T[] = []): T[] {
        const seen = new Set<number>();
        return list.filter(x => {
            const id = Number(x?.id ?? NaN);
            if (!Number.isFinite(id)) return true;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        });
    }

    // normaliza listas (se vier ID, tenta resolver pelo lookup; se vier objeto, usa objeto)
    toAcabList(list: Array<number | Acabamento>, lookup: IdNome[] = []): Acabamento[] {
        const norm = (list || []).map(item => {
            if (item && typeof item === 'object') return item as Acabamento;
            const id = Number(item);
            const l = lookup.find(o => Number(o.id) === id);
            return { id, nome: l?.nome ?? l?.label ?? String(id), descricao: l?.descricao ?? '', preco: null as any, ativo: true };
        });
        return this.dedupeById(norm);
    }
    toSrvList(list: Array<number | ServicoResponse>, lookup: IdNome[] = []): ServicoResponse[] {
        const norm = (list || []).map(item => {
            if (item && typeof item === 'object') return item as ServicoResponse;
            const id = Number(item);
            const l = lookup.find(o => Number(o.id) === id);
            return { id, nome: l?.nome ?? l?.label ?? String(id), descricao: l?.descricao ?? null, preco: null, ativo: true };
        });
        return this.dedupeById(norm);
    }

    // ===================== type guards (request/response) =====================
    private isTipo(p: PrecoAny | null | undefined, t: string): boolean {
        return !!p && (p as any).tipo === t;
    }
    asFixo(p: PrecoAny | null | undefined): (PrecoFixoRequest | PrecoFixoResponse) | null {
        return this.isTipo(p, 'FIXO') ? (p as any) : null;
    }
    asMetro(p: PrecoAny | null | undefined): (PrecoPorMetroRequest | PrecoPorMetroResponse) | null {
        return this.isTipo(p, 'METRO') ? (p as any) : null;
    }
    asQtd(p: PrecoAny | null | undefined): (PrecoPorQuantidadeRequest | PrecoPorQuantidadeResponse) | null {
        return this.isTipo(p, 'QUANTIDADE') ? (p as any) : null;
    }
    asDemanda(p: PrecoAny | null | undefined): (PrecoPorDemandaRequest | PrecoPorDemandaResponse) | null {
        return this.isTipo(p, 'DEMANDA') ? (p as any) : null;
    }
    asHora(p: PrecoAny | null | undefined): PrecoPorHoraResponse | null {
        // só no response; se não usar no sistema, pode remover
        return this.isTipo(p, 'HORA') ? (p as PrecoPorHoraResponse) : null;
    }

    // ===================== resumos =====================
    precoResumo(p: PrecoAny | null): string {
        if (!p) return '—';
        switch ((p as any).tipo) {
            case 'FIXO': return `Fixo: R$ ${this.num((p as any).valor)}`;
            case 'METRO': return `Metro (${(p as any).modoCobranca ?? 'QUADRADO'}): R$ ${this.num((p as any).precoMetro)}`;
            case 'QUANTIDADE': return `Quantidade: ${(p as any).faixas?.length ?? 0} faixa(s)`;
            case 'DEMANDA': return `Demanda: ${(p as any).faixas?.length ?? 0} faixa(s)`;
            case 'HORA': return `Hora: R$ ${this.num((p as any).valorHora)}${(p as any).tempoEstimado ? ` / ${(p as any).tempoEstimado} min` : ''}`;
            default: return String((p as any).tipo ?? '—');
        }
    }

    precoShort(p: any): string {
        if (!p) return '—';
        const t = p.tipo;
        switch (t) {
            case 'FIXO': return `Fixo • R$ ${this.num(p.valor)}`;
            case 'METRO': return `Metro • R$ ${this.num(p.precoMetro)}`;
            case 'QUANTIDADE': return `Qtd • ${p.faixas?.length ?? 0} faixa(s)`;
            case 'DEMANDA': return `Demanda • ${p.faixas?.length ?? 0} faixa(s)`;
            case 'HORA': return `Hora • R$ ${this.num(p.valorHora)}`;
            default: return String(t ?? '—');
        }
    }

    get precoPairs(): Array<[string, string]> {
        const p = this.data?.variacao?.preco as any;
        if (!p) return [];

        const out: [string, string][] = [];
        const add = (k: string, v: any) => {
            if (v === undefined || v === null || v === '') return;
            out.push([k, String(v)]);
        };

        switch (p.tipo) {
            case 'FIXO':
                add('Tipo', 'Fixo');
                add('Valor', `R$ ${this.num(p.valor)}`);
                return out;

            case 'METRO':
                add('Tipo', 'Metro');
                add('Modo', p.modoCobranca);
                add('Preço por metro', `R$ ${this.num(p.precoMetro)}`);
                if (p.precoMinimo != null) add('Preço mínimo', `R$ ${this.num(p.precoMinimo)}`);
                if (p.alturaMaxima != null) add('Altura máx', p.alturaMaxima);
                if (p.larguraMaxima != null) add('Largura máx', p.larguraMaxima);
                if (p.largurasLinearesPermitidas) add('Larguras lineares', p.largurasLinearesPermitidas);
                return out;

            case 'QUANTIDADE':
                add('Tipo', 'Quantidade');
                add('Faixas', `${p.faixas?.length ?? 0}`);
                (p.faixas ?? []).forEach((f: any, i: number) =>
                    add(`Faixa ${i + 1}`, `Qtd: ${f.quantidade} • R$ ${this.num(f.valor)}`)
                );
                return out;

            case 'DEMANDA':
                add('Tipo', 'Demanda');
                add('Faixas', `${p.faixas?.length ?? 0}`);
                (p.faixas ?? []).forEach((f: any, i: number) =>
                    add(`Faixa ${i + 1}`, `De ${f.de} a ${f.ate} • R$ ${this.num(f.valorUnitario)}`)
                );
                return out;

            case 'HORA':
                add('Tipo', 'Hora');
                add('Valor hora', `R$ ${this.num(p.valorHora)}`);
                if (p.tempoEstimado != null) add('Tempo estimado', `${p.tempoEstimado} min`);
                return out;

            default:
                add('Tipo', String(p.tipo ?? '—'));
                return out;
        }
    }

    srvPrecoResumo(p: PrecoAny | null | undefined): string {
        if (p == null) return '—';
        return this.precoResumo(p);
    }

    get acabData() {
        return this.toAcabList(this.data.variacao.acabamentos as any, this.data.lookups.acabamentos);
    }

    get srvData() {
        return this.toSrvList(this.data.variacao.servicos as any, this.data.lookups.servicos);
    }

    politicaEfetiva(): PoliticaRevenda | null {
        const v = this.data.variacao;
        return v.politicaRevenda ?? (this.data.politicaProduto ?? null);
    }
    politicaResumo(pol: PoliticaRevenda | null): string {
        if (!pol) return '—';
        return pol.percentual
            ? `Percentual: ${this.num(pol.percentualDesconto)} %`
            : `Preço fixo: R$ ${this.num(pol.precoFixo)}`;
    }

    num(v: any): string {
        if (v == null || v === '') return '—';
        const n = Number(v);
        return Number.isFinite(n)
            ? n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : String(v);
    }
}
