import { Component, OnInit, ViewChild } from '@angular/core';
import { Usuario } from 'src/app/models/usuario/usuario.model';
import { UsuarioService } from '../services/usuario.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { ImagemUtil } from 'src/app/utils/imagem-util';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { ToastrService } from 'src/app/services/toastr.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";

@Component({
  selector: 'app-listar-usuarios',
  standalone: true,
  templateUrl: './listar-usuarios.component.html',
  styleUrls: ['./listar-usuarios.component.scss'],
  imports: [
    CommonModule,
    MatCardModule,
    MatPaginatorModule,
    MatTableModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    DesignSystemIconsModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    RouterModule,
    TemPermissaoDirective,
    CardHeaderComponent
]
})
export class ListarUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  totalUsuarios = 0;
  carregando = false;
  pagina = 0;
  tamanhoPagina = 10;
  imagemUtil = ImagemUtil;
  filtroStatus: boolean | null = true;
  colunasExibidas = ['foto', 'nome', 'username', 'perfil', 'status', 'acoes'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private usuarioService: UsuarioService, private router: Router, private dialog: MatDialog, private toastrService: ToastrService) {}

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  carregarUsuarios(): void {
    this.carregando = true;
    this.usuarioService.listar(this.pagina, this.tamanhoPagina, this.filtroStatus).subscribe({
      next: (res) => {
        this.usuarios = res.content || [];
        this.totalUsuarios = res.totalElements;
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
    this.carregarUsuarios();
  }

  editar(usuario: Usuario): void {
    this.router.navigate(['page/usuarios/editar', usuario.id]);
  }

  excluir(usuario: Usuario): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Excluir usuário',
        message: `Tem certeza que deseja excluir o usuário "${usuario.nome}"?`,
        confirmText: 'Excluir',
        confirmColor: 'warn'
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.usuarioService.excluir(usuario.id!).subscribe({
          next: () => {
            this.toastrService.success('Usuário excluído com sucesso!');
            this.carregarUsuarios();
          },
          error: () => {
            this.toastrService.error('Erro ao excluir o usuário.');
          }
        });
      }
    });
  }
  

  usarImagemPadrao(event: Event): void {
    const imagem = event.target as HTMLImageElement | null;
    if (!imagem || imagem.dataset['fallbackApplied'] === 'true') {
      return;
    }

    imagem.dataset['fallbackApplied'] = 'true';
    imagem.onerror = null;
    imagem.src = 'assets/images/profile/user-1.jpg';
  }

  aplicarFiltro(status: boolean): void {
    this.filtroStatus = status;
    this.carregarUsuarios();
  }
  
  removerFiltro(): void {
    this.filtroStatus = null;
    this.carregarUsuarios();
  }
}
