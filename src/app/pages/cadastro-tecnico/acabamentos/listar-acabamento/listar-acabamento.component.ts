import { Component, OnInit, ViewChild } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { ToastrService } from 'src/app/services/toastr.service';

import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { InputPesquisaComponent } from 'src/app/components/inputs/input-pesquisa/input-pesquisa.component';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';

import { AcabamentoService } from '../acabamento.service';
import { AcabamentoResponse } from 'src/app/models/acabamento/acabamento-response.model';
import { AcabamentoListResponse } from 'src/app/models/acabamento/acabamento-listagem.response.model';
import { AcabamentoVariacaoResponse } from 'src/app/models/acabamento/acabamento-variacao-response.model';

@Component({
  selector: 'app-listar-acabamento',
  standalone: true,
  imports: [
    RouterModule,
    MatCardModule,
    MatPaginatorModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    DesignSystemIconsModule,
    TemPermissaoDirective,
    InputPesquisaComponent,
    CardHeaderComponent
],
  templateUrl: './listar-acabamento.component.html',
  styleUrl: './listar-acabamento.component.scss'
})
export class ListarAcabamentoComponent implements OnInit {

  acabamentos: AcabamentoListResponse[] = [];
  totalAcabamentos = 0;
  carregando = false;

  pagina = 0;
  tamanhoPagina = 10;
  termoPesquisa = '';

  colunasExibidas = ['nome', 'descricao', 'variacoes', 'acoes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private readonly acabamentoService: AcabamentoService,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly toastr: ToastrService
  ) { }

  ngOnInit(): void {
    this.carregarAcabamentos();
  }

  carregarAcabamentos(): void {
    this.carregando = true;

    this.acabamentoService
      .listar(this.pagina, this.tamanhoPagina, undefined, this.termoPesquisa)
      .subscribe({
        next: (res) => {
          const content = res.content || [];
          this.acabamentos = content;
          this.totalAcabamentos = res.totalElements;
          this.carregando = false;
        },
        error: () => {
          this.carregando = false;
          this.toastr.error('Erro ao carregar acabamentos.');
        }
      });
  }

  onPaginaAlterada(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
    this.carregarAcabamentos();
  }

  onPesquisar(valor: string): void {
    this.termoPesquisa = valor;
    this.pagina = 0;
    this.carregarAcabamentos();
  }

  editar(acabamento: AcabamentoListResponse): void {
    this.router.navigate(['page/cadastro-tecnico/acabamentos/editar', acabamento.id]);
  }

  excluir(acabamento: AcabamentoListResponse): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir acabamento',
        message: `Tem certeza que deseja excluir o acabamento "${acabamento.nome}"?`,
        confirmText: 'Excluir',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.acabamentoService.excluir(acabamento.id!).subscribe({
          next: () => {
            this.toastr.success('Acabamento excluído com sucesso!');
            this.carregarAcabamentos();
          },
          error: () => {
            this.toastr.error('Erro ao excluir o acabamento.');
          }
        });
      }
    });
  }

  // ========= Helpers de exibição das variações =========

  variacoesPreview(acabamento: AcabamentoListResponse): string[] {
    const arr = acabamento?.variacoes ?? [];
    return arr.length > 5 ? [...arr.slice(0, 5), '...'] : arr;
  }

  tooltipVariacoes(acabamento: AcabamentoListResponse): string | null {
    const arr = acabamento?.variacoes ?? [];
    return arr.length > 5 ? arr.join('\n') : null;
  }
}
