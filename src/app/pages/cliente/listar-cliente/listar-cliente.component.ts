import { Component, OnInit, ViewChild } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ToastrService } from 'src/app/services/toastr.service';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { ClienteListagem } from 'src/app/models/cliente/cliente-listagem.model';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { InputPesquisaComponent } from 'src/app/components/inputs/input-pesquisa/input-pesquisa.component';
import { ClienteService } from '../cliente.service';
import { TelefonePipe } from "../../../pipe/telefone.pipe";
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";

@Component({
  selector: 'app-listar-clientes',
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
    InputPesquisaComponent,
    TelefonePipe,
    CardHeaderComponent
],
  templateUrl: './listar-cliente.component.html'
})
export class ListarClienteComponent implements OnInit {

  clientes: ClienteListagem[] = [];
  totalClientes = 0;
  carregando = false;
  pagina = 0;
  tamanhoPagina = 10;
  termoPesquisa: string = '';
  colunasExibidas = ['nome', 'email', 'telefone', 'acoes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private clienteService: ClienteService,
    private router: Router,
    private dialog: MatDialog,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.carregarClientes();
  }

  carregarClientes(): void {
    this.carregando = true;
    this.clienteService.listar(this.pagina, this.tamanhoPagina, this.termoPesquisa).subscribe({
      next: (res) => {
        this.clientes = res.content || [];
        this.totalClientes = res.totalElements;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.toastr.error('Erro ao carregar clientes.');
      }
    });
  }

  onPaginaAlterada(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
    this.carregarClientes();
  }

  editar(cliente: ClienteListagem): void {
    this.router.navigate(['/page/cliente/editar', cliente.id]);
  }

  excluir(cliente: ClienteListagem): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir Cliente',
        message: `Tem certeza que deseja excluir o cliente "${cliente.nome}"?`,
        confirmText: 'Excluir',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.clienteService.excluir(cliente.id!).subscribe({
          next: () => {
            this.toastr.success('Cliente excluído com sucesso!');
            this.carregarClientes();
          },
          error: () => {
            this.toastr.error('Erro ao excluir o cliente.');
          }
        });
      }
    });
  }

  onPesquisar(valor: string): void {
    this.termoPesquisa = valor;
    this.pagina = 0;
    this.carregarClientes();
  }

  removerFiltro(): void {
    this.termoPesquisa = '';
    this.carregarClientes();
  }
}
