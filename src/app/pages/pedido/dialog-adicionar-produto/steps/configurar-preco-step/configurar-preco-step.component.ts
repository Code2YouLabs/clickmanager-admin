import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { ProdutoListagem } from 'src/app/models/produto/produto-listagem.model';
import { PrecoFixoConfigComponent } from '../../preco-fixo-component/preco-fixo-config.component';
import { PrecoQuantidadeConfigComponent } from '../../preco-quantidade-component/preco-quantidade-config.component';
import { PrecoDemandaConfigComponent } from '../../preco-demanda-component/preco-demanda-config.component';
import { PrecoMetroConfigComponent } from '../../preco-metro-component/preco-metro-config.component';

@Component({
    standalone: true,
    selector: 'app-configurar-preco-step',
    templateUrl: './configurar-preco-step.component.html',
    styleUrls: ['./configurar-preco-step.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        PrecoFixoConfigComponent,
        PrecoQuantidadeConfigComponent,
        PrecoDemandaConfigComponent,
        PrecoMetroConfigComponent,
    ],
})
export class ConfigurarPrecoStepComponent {
    @Input() produto: ProdutoListagem | null = null;
    @Input() resumoPreco: any = null;
    @Input() baseResumoTexto: string | null = null;
    @Input() baseSubtotal: number | null = null;

    @Output() configConcluida = new EventEmitter<any>();
    @Output() precoReadyChange = new EventEmitter<boolean>();
}
