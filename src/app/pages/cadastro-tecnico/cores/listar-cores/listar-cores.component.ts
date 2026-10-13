import { Component, OnInit, ViewChild } from '@angular/core';
import { Cor } from 'src/app/models/cor.model';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { ToastrService } from 'src/app/services/toastr.service';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { InputPesquisaComponent } from 'src/app/components/inputs/input-pesquisa/input-pesquisa.component';
import { MatButtonModule } from '@angular/material/button';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { CorService } from '../../services/cor.service';
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";

@Component({
  selector: 'app-listar-cores',
  standalone: true,
  imports: [
    RouterModule,
    MatCardModule,
    MatPaginatorModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    DesignSystemIconsModule,
    RouterModule,
    TemPermissaoDirective,
    InputPesquisaComponent,
    CardHeaderComponent
],
  templateUrl: './listar-cores.component.html',
  styleUrl: './listar-cores.component.scss'
})
export class ListarCoresComponent implements OnInit{
  cores: Cor[] = [];
  totalCores = 0;
  carregando = false;
  pagina = 0;
  tamanhoPagina = 10;
  termoPesquisa = '';
  colunasExibidas = ['nome', 'descricao', 'acoes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private coresService: CorService, private router: Router, private dialog: MatDialog, private toastrService: ToastrService) {}

  ngOnInit(): void {
    this.carregarCores();
  }

  carregarCores(): void {
    this.carregando = true;
    this.coresService.listar(this.pagina, this.tamanhoPagina, undefined, this.termoPesquisa).subscribe({
      next: (res) => {
        this.cores = res.content || [];
        this.totalCores = res.totalElements;
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
    this.carregarCores();
  }

  onPesquisar(valor: string): void {
    this.termoPesquisa = valor;
    this.pagina = 0;
    this.carregarCores();
  }

  editar(cor: Cor): void {
    this.router.navigate(['page/cadastro-tecnico/cores/editar', cor.id]);
  }

  excluir(cor: Cor): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir cor',
        message: `Tem certeza que deseja excluir a cor "${cor.descricao}"?`,
        confirmText: 'Excluir',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.coresService.excluir(cor.id!).subscribe({
          next: () => {
            this.toastrService.success('Cor excluída com sucesso!');
            this.carregarCores();
          },
          error: () => {
            this.toastrService.error('Erro ao excluir a cor.');
          }
        });
      }
    });
  }
}
