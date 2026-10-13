
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';

import { ProdutoService } from 'src/app/pages/cadastro-tecnico/services/produto.service';
import { ProdutoListagem } from 'src/app/models/produto/produto-listagem.model';

@Component({
    standalone: true,
    selector: 'app-selecionar-produto-step',
    templateUrl: './selecionar-produto-step.component.html',
    styleUrls: ['./selecionar-produto-step.component.scss'],
    imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule
],
})
export class SelecionarProdutoStepComponent implements OnInit, OnDestroy {
    @Input() selectedId: number | null = null;
    @Output() selectedChange = new EventEmitter<ProdutoListagem>();

    @ViewChild(MatPaginator) paginator!: MatPaginator;

    produtos: ProdutoListagem[] = [];
    total = 0;
    pageIndex = 0;
    pageSize = 5;
    filtroStatus: boolean | null = true;
    loading = false;

    readonly searchCtrl = new FormControl<string>('', { nonNullable: true });

    private searchSub?: Subscription;

    constructor(private readonly produtoService: ProdutoService) { }

    ngOnInit(): void {
        this.searchSub = this.searchCtrl.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe(() => {
                this.pageIndex = 0;
                this.carregar();
            });

        this.carregar();
    }

    ngOnDestroy(): void {
        this.searchSub?.unsubscribe();
    }

    carregar(): void {
        this.loading = true;
        const termo = this.searchCtrl.value?.trim() || '';

        this.produtoService.listar(this.pageIndex, this.pageSize, this.filtroStatus, termo).subscribe({
            next: (res: any) => {
                this.produtos = res?.content ?? [];
                this.total = res?.totalElements ?? 0;
                this.loading = false;
            },
            error: () => { this.loading = false; },
        });
    }

    onPage(event: PageEvent): void {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.carregar();
    }

    onSelect(produto: ProdutoListagem): void {
        this.selectedId = produto?.id ?? null;
        this.selectedChange.emit(produto);
    }

    isSelected(produto: ProdutoListagem): boolean {
        return (produto?.id ?? null) === this.selectedId;
    }

    variacoesResumo(produto: ProdutoListagem): string {
        const qtde = produto?.variacoes?.length ?? 0;
        if (!qtde) return 'Sem variações';
        const first = produto?.variacoes?.[0] ?? '';
        return qtde > 1 ? `${first} +${qtde - 1}` : String(first);
    }

    get selectedProduto(): ProdutoListagem | null {
        return this.produtos.find(p => p.id === this.selectedId) || null;
    }

    trackById(_: number, item: ProdutoListagem): number | null | undefined {
        return item?.id;
    }
}
