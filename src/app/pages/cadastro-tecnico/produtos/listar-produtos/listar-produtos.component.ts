import { Component, OnInit, ViewChild } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'src/app/services/toastr.service';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { ProdutoService } from '../../services/produto.service';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { InputPesquisaComponent } from 'src/app/components/inputs/input-pesquisa/input-pesquisa.component';
import { ProdutoListagem } from 'src/app/models/produto/produto-listagem.model';
import { Produto } from 'src/app/models/produto/produto.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";

@Component({
  selector: 'app-listar-produtos',
  standalone: true,
  imports: [
    MatCardModule,
    MatPaginatorModule,
    MatTableModule,
    MatProgressSpinnerModule,
    DesignSystemIconsModule,
    RouterModule,
    TemPermissaoDirective,
    InputPesquisaComponent,
    MatTooltipModule,
    CardHeaderComponent
],
  templateUrl: './listar-produtos.component.html',
  styleUrl: './listar-produtos.component.scss'
})
export class ListarProdutosComponent implements OnInit {

  produtos: ProdutoListagem[] = [];
  produtosSelecionados: ProdutoListagem[] = [];
  totalProdutos = 0;
  carregando = false;
  pagina = 0;
  tamanhoPagina = 10;
  termoPesquisa: string = '';

  // ✅ agora só nome, descricao, variacoes, acoes
  colunasExibidas = ['nome', 'descricao', 'variacoes', 'acoes'];
  maxChips = 4; // mostra até 4 variações; o resto vira “+N”

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
    this.produtoService.listar(this.pagina, this.tamanhoPagina, undefined, this.termoPesquisa).subscribe({
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

  onPesquisar(valor: string): void {
    this.termoPesquisa = valor;
    this.pagina = 0;
    this.carregarProdutos();
  }

  // ========= Helpers de exibição das variações =========

  /**
   * Mostra até 5 variações; se houver mais, a 6ª é "..."
   */
  variacoesPreview(produto: ProdutoListagem): string[] {
    const arr = produto?.variacoes ?? [];
    return arr.length > 5 ? [...arr.slice(0, 5), '...'] : arr;
  }

  tooltipVariacoes(produto: ProdutoListagem): string | null {
    const arr = produto?.variacoes ?? [];
    return arr.length > 5 ? arr.join('\n') : null;
  }
}
