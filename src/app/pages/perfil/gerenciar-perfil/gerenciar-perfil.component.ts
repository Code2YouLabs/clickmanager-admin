import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'src/app/services/toastr.service';

import { MatCardModule } from '@angular/material/card';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { Usuario } from 'src/app/models/usuario/usuario.model';
import { PerfilDialogComponent } from '../modal-perfil/perfil-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ImagemUtil } from 'src/app/utils/imagem-util';
import { TrocarPerfilDialogComponent } from '../modal-trocar-perfil/trocar-perfil-dialog.component';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";
import { Perfil } from 'src/app/models/perfil.model';
import { PerfilService } from '../../usuarios/services/perfil.service';
import { PerfilRequest } from 'src/app/models/perfil/perfil-request.model';

@Component({
  selector: 'app-gerenciar-perfil',
  templateUrl: './gerenciar-perfil.component.html',
  styleUrls: ['./gerenciar-perfil.component.scss'],
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatSidenavModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    DesignSystemIconsModule,
    MatTableModule,
    CardHeaderComponent
]
})
export class GerenciarPerfilComponent implements OnInit {
  form!: FormGroup;
  perfis: Perfil[] = [];
  usuarios: Usuario[] = [];
  perfilSelecionado?: Perfil;
  editando = false;
  sidebarCollapsed = false;
  sidebarWidth = 300;
  displayedColumns1: string[] = ['usuario', 'perfil', 'acoes'];
  dataSource = new MatTableDataSource<Usuario>([]);
  imagemUtil = ImagemUtil;
  private permissoesMap: Record<string, number> = {};

  constructor(private fb: FormBuilder, private perfilService: PerfilService, private dialog: MatDialog, private toastrService: ToastrService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      descricao: ['']
    });

    this.carregarPerfis();
  }

  carregarPerfis(): void {
    this.perfilService.listar().subscribe(perfis => {
      this.perfis = perfis;
    });
  }

  private carregarPermissoes(onLoaded: () => void): void {
    if (Object.keys(this.permissoesMap).length) {
      onLoaded();
      return;
    }

    this.perfilService.listarPermissoes().subscribe(permissoes => {
      this.permissoesMap = permissoes.reduce((acc: Record<string, number>, perm) => {
        if (perm.chave && typeof perm.id === 'number' && acc[perm.chave] === undefined) {
          acc[perm.chave] = perm.id;
        }
        return acc;
      }, {});
      onLoaded();
    });
  }

  listarUsuariosDoPerfil(perfil: Perfil): void {
    this.perfilSelecionado = perfil;
    this.editando = true;

    this.form.patchValue({
      nome: perfil.nome,
      descricao: perfil.descricao
    });

    this.perfilService.listarUsuariosDoPerfil(perfil.id!).subscribe(usuarios => {
      this.usuarios = usuarios;
    });
  }

  cancelar(): void {
    this.editando = false;
    this.form.reset();
    this.usuarios = [];
    this.perfilSelecionado = undefined;
  }

  editar(perfil: Perfil): void {
    this.openDialogPerfil('Edit', perfil);
  }

  excluir(id: number): void {
    this.perfilService.listarUsuariosDoPerfil(id).subscribe(usuarios => {
      if (usuarios.length > 0) {
        this.toastrService.warning('Não é possível excluir este perfil. Há usuários vinculados.');
        return;
      }
  
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Excluir Perfil',
          message: 'Deseja realmente excluir este perfil?',
          confirmText: 'Excluir',
          confirmColor: 'warn'
        },
        width: '400px'
      });
  
      dialogRef.afterClosed().subscribe(confirmado => {
        if (confirmado) {
          this.perfilService.excluir(id).subscribe({
            next: () => {
              this.toastrService.success('Perfil excluído com sucesso.');
              this.carregarPerfis();
            },
            error: (err) => this.exibirErro(err, 'Erro ao excluir o perfil.')
          });
        }
      });
    });
  }
  

  openDialogPerfil(action: 'Add' | 'Edit', perfil: any = {}): void {
    const prepararAbertura = (perfilDados: any) => {
      this.carregarPermissoes(() => this.abrirDialog(action, perfilDados));
    };

    if (action === 'Edit' && perfil?.id) {
      this.perfilService.obter(perfil.id).subscribe(perfilCompleto => {
        prepararAbertura(perfilCompleto);
      });
    } else {
      prepararAbertura(perfil);
    }
  }

  private abrirDialog(action: 'Add' | 'Edit', perfil: any): void {
    const dialogRef = this.dialog.open(PerfilDialogComponent, {
      data: { action, perfil },
      autoFocus: false,
      width: '600px'
    });
  
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.event === 'Save') {
        const payload = this.montarPayloadPerfil(result.data);
        const algumaSelecionada = payload.permissoes.some(p => p.selecionada);
        if (!algumaSelecionada) {
          this.toastrService.error('Selecione ao menos uma permissão.');
          return;
        }
        if (action === 'Add') {
          this.salvarPerfil(payload);
        } else if (perfil?.id) {
          this.atualizarPerfil(perfil.id, payload);
        }
      }
    });
  }

  openDialogTrocarPerfil(usuario: Usuario): void {
    const dialogRef = this.dialog.open(TrocarPerfilDialogComponent, {
      data: {
        usuario,
        perfis: this.perfis
      },
      autoFocus: false,
      width: '600px'
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.novoPerfilId) {
        this.perfilService.trocarPerfil(usuario.id!, result.novoPerfilId).subscribe({
          next: (usuarioAtualizado) => {
            this.toastrService.success(`Perfil do usuário ${usuarioAtualizado.nome} alterado com sucesso.`);
            this.carregarPerfis();
          },
          error: (err) => this.exibirErro(err, `Erro ao alterar o perfil do usuário ${usuario.nome}.`)
        });
      }
    });
  }
  

  salvarPerfil(dados: PerfilRequest): void {
    this.perfilService.salvar(dados).subscribe({
      next: () => {
        this.carregarPerfis();
      },
      error: (err) => this.exibirErro(err, 'Erro ao salvar perfil')
    });
  }
  
  atualizarPerfil(id: number, dados: PerfilRequest): void {
    this.perfilService.atualizar(id, dados).subscribe({
      next: () => {
        this.toastrService.success('Perfil atualizado com sucesso');
        this.carregarPerfis();
      },
      error: (err) => this.exibirErro(err, 'Erro ao atualizar perfil')
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

  private exibirErro(err: any, fallback: string): void {
    const mensagem = err?.userMessage || err?.error?.message || err?.message || fallback;
    this.toastrService.error(mensagem);
  }

  private montarPayloadPerfil(data: any): PerfilRequest {
    const permissoes = Object.entries(data.permissoes || {})
      .map(([chave, selecionada]) => ({
        id: this.permissoesMap[chave],
        selecionada: !!selecionada
      }))
      .filter((p): p is { id: number; selecionada: boolean } => typeof p.id === 'number');

    return {
      nome: data.nome,
      descricao: data.descricao,
      permissoes
    };
  }
}
