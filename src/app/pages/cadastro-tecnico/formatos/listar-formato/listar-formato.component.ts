import { Component, OnInit, ViewChild } from '@angular/core';
import { Formato } from 'src/app/models/formato.model';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { ToastrService } from 'src/app/services/toastr.service';
import { MatButtonModule } from '@angular/material/button';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { FormatoService } from '../../services/formato.service';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";
import { InputPesquisaComponent } from 'src/app/components/inputs/input-pesquisa/input-pesquisa.component';

@Component({
  selector: 'app-listar-formato',
  standalone: true,
  imports: [
    MatCardModule,
    MatPaginatorModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    DesignSystemIconsModule,
    RouterModule,
    TemPermissaoDirective,
    CardHeaderComponent,
    InputPesquisaComponent
],
  templateUrl: './listar-formato.component.html',
  styleUrl: './listar-formato.component.scss'
})
export class ListarFormatoComponent implements OnInit {
  formatos: Formato[] = [];
  totalFormatos = 0;
  carregando = false;
  pagina = 0;
  tamanhoPagina = 10;
  termoPesquisa = '';
  colunasExibidas = ['nome', 'tamanho', 'areaUtil', 'acoes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private formatoService: FormatoService,
    private router: Router,
    private dialog: MatDialog,
    private toastrService: ToastrService
  ) {}

  ngOnInit(): void {
    this.carregarFormatos();
  }

  carregarFormatos(): void {
    this.carregando = true;
    this.formatoService.listar(this.pagina, this.tamanhoPagina, undefined, this.termoPesquisa).subscribe({
      next: (res) => {
        this.formatos = res.content || [];
        this.totalFormatos = res.totalElements;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.toastrService.error('Erro ao carregar formatos.');
      }
    });
  }

  onPaginaAlterada(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
    this.carregarFormatos();
  }

  onPesquisar(valor: string): void {
    this.termoPesquisa = valor;
    this.pagina = 0;
    this.carregarFormatos();
  }

  editar(formato: Formato): void {
    this.router.navigate(['page/cadastro-tecnico/formatos/editar', formato.id]);
  }

  excluir(formato: Formato): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir Formato',
        message: `Tem certeza que deseja excluir o formato "${formato.nome}"?`,
        confirmText: 'Excluir',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.formatoService.excluir(formato.id!).subscribe({
          next: () => {
            this.toastrService.success('Formato excluído com sucesso!');
            this.carregarFormatos();
          },
          error: () => {
            this.toastrService.error('Erro ao excluir o formato.');
          }
        });
      }
    });
  }
}
