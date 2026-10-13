
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr.service';
import { finalize } from 'rxjs/operators';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { MaterialModule } from 'src/app/material.module';
import { extrairMensagemErro } from 'src/app/utils/mensagem.util';
import {
  AdminOnboardingCatalogoAcabamentoResponse,
  AdminOnboardingCatalogoProdutoResponse,
  AdminOnboardingCatalogoServicoResponse,
  AdminSalvarProdutoOnboardingRequest
} from './models/admin-onboarding-catalogo.model';
import { AdminOnboardingCatalogoService } from './services/admin-onboarding-catalogo.service';

interface ProdutoFormModel {
  codigo: string;
  nome: string;
  descricao: string;
  categoria: string;
  destaque: string;
  preSelecionado: boolean;
  ativo: boolean;
  ordemExibicao: number | null;
  servicoIds: number[];
  acabamentoIds: number[];
}

@Component({
  selector: 'app-onboarding-catalogo-produto-form',
  standalone: true,
  imports: [FormsModule, RouterModule, DesignSystemIconsModule, MaterialModule],
  templateUrl: './onboarding-catalogo-produto-form.component.html',
  styleUrl: './onboarding-catalogo-produto-form.component.scss'
})
export class OnboardingCatalogoProdutoFormComponent implements OnInit {
  carregando = false;
  salvando = false;
  isEditMode = false;
  produtoId: number | null = null;

  servicos: AdminOnboardingCatalogoServicoResponse[] = [];
  acabamentos: AdminOnboardingCatalogoAcabamentoResponse[] = [];

  form: ProdutoFormModel = this.criarFormPadrao();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly catalogoService: AdminOnboardingCatalogoService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.produtoId = Number(idParam);
      if (!Number.isFinite(this.produtoId)) {
        this.toastr.error('Identificador inválido.');
        this.voltar();
        return;
      }
    }

    this.carregarContexto();
  }

  get tituloPagina(): string {
    return this.isEditMode ? 'Editar produto do onboarding' : 'Novo produto do onboarding';
  }

  get servicosSelecionadosResumo(): string[] {
    const ids = new Set(this.form.servicoIds);
    return this.servicos.filter((item) => ids.has(item.id)).map((item) => item.nome);
  }

  get acabamentosSelecionadosResumo(): string[] {
    const ids = new Set(this.form.acabamentoIds);
    return this.acabamentos.filter((item) => ids.has(item.id)).map((item) => item.nome);
  }

  salvar(): void {
    if (!this.form.codigo.trim()) {
      this.toastr.warning('Informe o código do produto.');
      return;
    }

    if (!this.form.nome.trim()) {
      this.toastr.warning('Informe o nome do produto.');
      return;
    }

    const payload: AdminSalvarProdutoOnboardingRequest = {
      codigo: this.form.codigo.trim().toUpperCase(),
      nome: this.form.nome.trim(),
      descricao: this.normalizarTexto(this.form.descricao),
      categoria: this.normalizarTexto(this.form.categoria),
      destaque: this.normalizarTexto(this.form.destaque),
      preSelecionado: this.form.preSelecionado,
      ativo: this.form.ativo,
      ordemExibicao: this.normalizarNumero(this.form.ordemExibicao),
      servicoIds: [...this.form.servicoIds],
      acabamentoIds: [...this.form.acabamentoIds]
    };

    this.salvando = true;
    const request$ = this.isEditMode
      ? this.catalogoService.atualizarProduto$(this.produtoId!, payload)
      : this.catalogoService.criarProduto$(payload);

    request$
      .pipe(finalize(() => (this.salvando = false)))
      .subscribe({
        next: () => {
          this.toastr.success(this.isEditMode ? 'Produto salvo com sucesso.' : 'Produto criado com sucesso.');
          this.voltar();
        },
        error: (err) => {
          this.toastr.error(extrairMensagemErro(err, 'Não foi possível salvar o produto.'));
        }
      });
  }

  voltar(): void {
    this.router.navigate(['/onboarding/catalogo'], { queryParams: { tab: 'produtos' } });
  }

  private carregarContexto(): void {
    this.carregando = true;
    this.catalogoService.buscarCatalogo$()
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (catalogo) => {
          this.servicos = [...catalogo.servicos].sort((a, b) => a.nome.localeCompare(b.nome));
          this.acabamentos = [...catalogo.acabamentos].sort((a, b) => a.nome.localeCompare(b.nome));

          if (this.isEditMode && this.produtoId) {
            this.carregarProduto(this.produtoId);
          }
        },
        error: (err) => {
          this.toastr.error(extrairMensagemErro(err, 'Não foi possível carregar os relacionamentos do produto.'));
        }
      });
  }

  private carregarProduto(id: number): void {
    this.carregando = true;
    this.catalogoService.buscarProdutoPorId$(id)
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (produto) => {
          this.aplicarProduto(produto);
        },
        error: (err) => {
          this.toastr.error(extrairMensagemErro(err, 'Não foi possível carregar o produto.'));
          this.voltar();
        }
      });
  }

  private aplicarProduto(produto: AdminOnboardingCatalogoProdutoResponse): void {
    this.form = {
      codigo: produto.codigo,
      nome: produto.nome,
      descricao: produto.descricao ?? '',
      categoria: produto.categoria ?? '',
      destaque: produto.destaque ?? '',
      preSelecionado: produto.preSelecionado,
      ativo: produto.ativo,
      ordemExibicao: produto.ordemExibicao,
      servicoIds: [...produto.servicoIds],
      acabamentoIds: [...produto.acabamentoIds]
    };
  }

  private criarFormPadrao(): ProdutoFormModel {
    return {
      codigo: '',
      nome: '',
      descricao: '',
      categoria: '',
      destaque: '',
      preSelecionado: false,
      ativo: true,
      ordemExibicao: null,
      servicoIds: [],
      acabamentoIds: []
    };
  }

  private normalizarTexto(texto: string): string | null {
    const valor = texto.trim();
    return valor ? valor : null;
  }

  private normalizarNumero(valor: number | null | undefined): number | null {
    return valor == null || Number.isNaN(Number(valor)) ? null : Number(valor);
  }
}
