import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ToastrService } from 'src/app/services/toastr.service';

import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';


type ProdutoOption = { id: number; nome: string };

import { CalculadoraConfigService } from '../calculadora-config.service';
import { CalculadoraConfigResponse } from 'src/app/models/calculadora/calculadora-config-response.model';
import { CalculadoraConfigRequest } from 'src/app/models/calculadora/calculadora-config-request.model';
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";
import { MatDivider } from "@angular/material/divider";
import { extrairMensagemErro } from 'src/app/utils/mensagem.util';

@Component({
    selector: 'app-calculadora-config',
    standalone: true,
    imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    RouterModule,
    CardHeaderComponent,
    MatDivider
],
    templateUrl: './smart-calc-config.component.html',
    styleUrls: ['./smart-calc-config.component.scss']
})
export class CalculadoraConfigComponent implements OnInit {
    private fb = inject(FormBuilder);
    private destroyRef = inject(DestroyRef);
    private calculadoraService = inject(CalculadoraConfigService);
    private toastr = inject(ToastrService);

    carregando = signal<boolean>(true);
    salvando = signal<boolean>(false);

    produtoOptions: ProdutoOption[] = [];
    configAtual?: CalculadoraConfigResponse;

    form = this.fb.nonNullable.group({
        ativo: this.fb.nonNullable.control<boolean>(true),
        produtoIds: this.fb.nonNullable.control<number[]>([]),
    });

    ngOnInit(): void {
        this.carregando.set(true);
        this.loadConfig();
    }

    private loadConfig(): void {
        const t0 = performance.now();

        this.calculadoraService.getConfigCompleta()
            .pipe(
                takeUntilDestroyed(this.destroyRef),
                finalize(() => this.carregando.set(false))
            )
            .subscribe({
                next: (res) => {
                    this.configAtual = res?.config ?? undefined;
                    this.produtoOptions = res?.produtosDisponiveis ?? [];
                    const produtos = res?.config?.produtos ?? [];

                    const produtoIds = produtos
                        .map(p => p?.id)
                        .filter((id): id is number => typeof id === 'number');

                    this.form.patchValue({
                        ativo: res?.config?.ativo ?? false,
                        produtoIds,
                    });

                },
                error: (err) => {
                    const msg = extrairMensagemErro(err, 'Não foi possível carregar as configurações.');
                    this.toastr.error(msg, 'SmartCalc');
                    this.produtoOptions = [];
                },
                complete: () => {
                    const t1 = performance.now();
                }
            });
    }


    private mapNomesToIds(nomes?: string[]): number[] {
        if (!nomes?.length) return [];
        const byName = new Map(this.produtoOptions.map(p => [p.nome, p.id]));
        return nomes.map(n => byName.get(n)).filter((v): v is number => typeof v === 'number');
    }

    onSubmit(): void {
        const formValue = this.form.getRawValue();
        if (formValue.ativo && (!formValue.produtoIds || formValue.produtoIds.length === 0)) {
            this.toastr.warning('Para habilitar o SmartCalc, selecione ao menos um produto.');
            this.form.markAllAsTouched();
            return;
        }

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const req: CalculadoraConfigRequest = formValue;
        this.salvando.set(true);

        this.calculadoraService.salvar(req)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (res) => {
                    this.configAtual = res ?? undefined;
                    this.toastr.success('Configurações salvas com sucesso!', 'SmartCalc');
                },
                error: (err) => {
                    const msg = extrairMensagemErro(err, 'Não foi possível salvar as configurações.');
                    this.toastr.error(msg, 'SmartCalc');
                },
                complete: () => this.salvando.set(false)
            });
    }

    trackById = (_: number, item: ProdutoOption) => item.id;
}
