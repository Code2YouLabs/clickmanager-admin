
import { Component, Input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import { ServicoResponse } from 'src/app/models/servico/servico-response.model';
import { AcabamentoVariacaoResponse } from 'src/app/models/acabamento/acabamento-variacao-response.model';

@Component({
    standalone: true,
    selector: 'app-revisao-step',
    templateUrl: './revisao-step.component.html',
    styleUrls: ['./revisao-step.component.scss'],
    imports: [MatDividerModule, MatIconModule],
})
export class RevisaoStepComponent {
    @Input() produtoBase: { id: number; nome: string; descricao: string | null } | null = null;
    @Input() selectedVariacao: any = null;
    @Input() baseResumoTexto: string | null = null;
    @Input() baseQtd: number = 1;
    @Input() baseUnit: number | null = null;
    @Input() baseSubtotal: number | null = null;
    @Input() acabamentosSelecionadosDetalhe: AcabamentoVariacaoResponse[] = [];
    @Input() servicosSelecionadosDetalhe: ServicoResponse[] = [];
    @Input() adicionaisFixosSubtotal: number = 0;
    @Input() totalConhecido: number | null = null;
    @Input() qtdeVariaveis: number = 0;
    @Input() moneyFn!: (v?: number | null) => string;
    @Input() unitFromPrecoFn!: (p?: any) => number | null;

    trackById(_: number, item: { id: number | null }): number | null {
        return item?.id ?? null;
    }

    get variacaoChips(): string[] {
        if (!this.selectedVariacao) return [];
        const chips = [
            this.selectedVariacao?.formatoNome,
            this.selectedVariacao?.materialNome,
            this.selectedVariacao?.corNome,
        ].filter((v) => !!v && String(v).trim().length > 0);
        return chips;
    }
}
