import { Component, OnInit, ViewChild, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'src/app/services/toastr.service';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component'; 
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { InputPesquisaComponent } from 'src/app/components/inputs/input-pesquisa/input-pesquisa.component';
import { ProdutoListagem } from 'src/app/models/produto/produto-listagem.model';
import { Produto } from 'src/app/models/produto/produto.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatRadioModule } from '@angular/material/radio';
import { ProdutoService } from 'src/app/pages/cadastro-tecnico/services/produto.service';

@Component({
  selector: 'app-listar-produtos',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatPaginatorModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    DesignSystemIconsModule,
    RouterModule,
    TemPermissaoDirective,
    InputPesquisaComponent,
    MatTooltipModule,
    MatRadioModule
  ],
  templateUrl: './listar-produtos.component.html',
  styleUrl: './listar-produtos.component.scss'
})
export class ListarProdutosComponent implements OnInit {

  // ===== Config para reuso (sem alterar colunas) =====
  /** Mostra os botões de editar/excluir na coluna Ações */
  @Input() showActions = true;
  /** Ativa seleção única via radio na coluna Ações */
  @Input() showSelect = false;
  /** Oculta cabeçalho (título + botão Novo) para usos em diálogos */
  @Input() hideHeader = false;
  /** ID atualmente selecionado (quando showSelect = true) */
  @Input() selectedId: number | null = null;
  /** Dispara ao selecionar um item (quando showSelect = true) */
  @Output() selectedChange = new EventEmitter<ProdutoListagem>();

  // ===== Dados =====
  produtos: ProdutoListagem[] = [];
  totalProdutos = 0;
  carregando = false;
  pagina = 0;
  tamanhoPagina = 10;
  filtroStatus: boolean | null = true;
  termoPesquisa = '';

  // as colunas ficam fixas como você pediu
  colunasExibidas = ['nome', 'descricao', 'variacoes', 'selecao'];
  maxChips = 5; // mostra até 5 linhas, o resto vira tooltip

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private produtoService: ProdutoService,
    private router: Router,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.carregarProdutos();
  }

  carregarProdutos(): void {
    this.carregando = true;
    this.produtoService.listar(this.pagina, this.tamanhoPagina, this.filtroStatus, this.termoPesquisa).subscribe({
      next: (res) => {
        this.produtos = res.content || [];
        this.totalProdutos = res.totalElements;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
      }
    });
  }

  onPaginaAlterada(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
    this.carregarProdutos();
  }

  // ===== Ações (edição/exclusão) =====
  editar(produto: Produto): void {
    this.router.navigate(['/page/cadastro-tecnico/produtos/editar', produto.id]);
  }

  excluir(produto: Produto): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir Produto',
        message: `Tem certeza que deseja excluir o produto "${produto.nome}"?`,
        confirmText: 'Excluir',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.produtoService.excluir(produto.id!).subscribe({
          next: () => {
            this.toastr.success('Produto excluído com sucesso!');
            this.carregarProdutos();
          },
          error: () => {
            this.toastr.error('Erro ao excluir o produto.');
          }
        });
      }
    });
  }

  // ===== Filtro/Pesquisa =====
  aplicarFiltro(status: boolean): void {
    this.filtroStatus = status;
    this.carregarProdutos();
  }

  onPesquisar(valor: string): void {
    this.termoPesquisa = valor;
    this.pagina = 0;
    this.carregarProdutos();
  }

  removerFiltro(): void {
    this.filtroStatus = null;
    this.carregarProdutos();
  }

  // ===== Variações (exibição) =====
  variacoesPreview(produto: ProdutoListagem): string[] {
    const arr = produto?.variacoes ?? [];
    return arr.length > this.maxChips ? [...arr.slice(0, this.maxChips), '...'] : arr;
  }

  tooltipVariacoes(produto: ProdutoListagem): string | null {
    const arr = produto?.variacoes ?? [];
    return arr.length > this.maxChips ? arr.join('\n') : null;
  }

  // ===== Seleção única =====
  onSelect(produto: ProdutoListagem): void {
    if (!this.showSelect) return;
    this.selectedId = produto.id ?? null;
    this.selectedChange.emit(produto);
  }
}
