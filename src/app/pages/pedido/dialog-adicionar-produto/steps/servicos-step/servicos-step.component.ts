
import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

import { ServicoResponse } from 'src/app/models/servico/servico-response.model';
import { Preco } from 'src/app/models/preco/preco-response.model';

@Component({
    standalone: true,
    selector: 'app-servicos-step',
    templateUrl: './servicos-step.component.html',
    styleUrls: ['./servicos-step.component.scss'],
    imports: [
    MatCheckboxModule,
    MatTooltipModule,
    MatIconModule
],
})
export class ServicosStepComponent {
    @Input() servicosDisponiveis: ServicoResponse[] = [];
    @Input() control!: FormControl<number[]>;
    @Input() precoResumoFn!: (p: Preco | null | undefined) => string;

    isSelected(id: number): boolean {
        return (this.control?.value ?? []).includes(id);
    }

    toggle(id: number, checked: boolean): void {
        if (!this.control) return;
        let arr = [...(this.control.value ?? [])];
        arr = checked ? (arr.includes(id) ? arr : [...arr, id]) : arr.filter(x => x !== id);
        this.control.setValue(arr);
    }

    trackById(_: number, item: { id: number | null }): number | null {
        return item?.id ?? null;
    }
}
