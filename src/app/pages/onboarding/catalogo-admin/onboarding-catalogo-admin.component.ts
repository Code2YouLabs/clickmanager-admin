import { CommonModule } from '@angular/common';
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
  AdminOnboardingCatalogoServicoResponse
} from './models/admin-onboarding-catalogo.model';
import { AdminOnboardingCatalogoService } from './services/admin-onboarding-catalogo.service';

type CatalogoTab = 'resumo' | 'servicos' | 'acabamentos' | 'produtos';

@Component({
  selector: 'app-onboarding-catalogo-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DesignSystemIconsModule, MaterialModule],
  templateUrl: './onboarding-catalogo-admin.component.html',
  styleUrl: './onboarding-catalogo-admin.component.scss'
})
export class OnboardingCatalogoAdminComponent implements OnInit {
  abaSelecionada = 0;
  carregandoCatalogo = false;

  buscaServico = '';
  buscaAcabamento = '';
  buscaProduto = '';

  atualizandoAtivoServicoId: number | null = null;
  atualizandoAtivoAcabamentoId: number | null = null;
  atualizandoAtivoProdutoId: number | null = null;

  servicos: AdminOnboardingCatalogoServicoResponse[] = [];
  acabamentos: AdminOnboardingCatalogoAcabamentoResponse[] = [];
  produtos: AdminOnboardingCatalogoProdutoResponse[] = [];

  readonly colunasServico = ['codigo', 'nome', 'descricao', 'valor', 'ordem', 'status', 'acoes'];
  readonly colunasAcabamento = ['codigo', 'nome', 'descricao', 'valor', 'ordem', 'status', 'acoes'];
  readonly colunasProduto = ['codigo', 'nome', 'categoria', 'descricao', 'vinculos', 'status', 'acoes'];

  constructor(
    private readonly catalogoService: AdminOnboardingCatalogoService,
    private readonly toastr: ToastrService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.aplicarTabDaUrl((params.get('tab') as CatalogoTab | null) ?? null);
    });

    this.carregarCatalogo();
  }

  get totalServicos(): number {
    return this.servicos.length;
  }

  get totalAcabamentos(): number {
    return this.acabamentos.length;
  }

  get totalProdutos(): number {
    return this.produtos.length;
  }

  get servicosAtivos(): number {
    return this.servicos.filter((item) => item.ativo).length;
  }

  get acabamentosAtivos(): number {
    return this.acabamentos.filter((item) => item.ativo).length;
  }

  get produtosAtivos(): number {
    return this.produtos.filter((item) => item.ativo).length;
  }

  get produtosPreSelecionados(): number {
    return this.produtos.filter((item) => item.preSelecionado).length;
  }

  get servicosFiltrados(): AdminOnboardingCatalogoServicoResponse[] {
    return this.filtrarLista(this.servicos, this.buscaServico);
  }

  get acabamentosFiltrados(): AdminOnboardingCatalogoAcabamentoResponse[] {
    return this.filtrarLista(this.acabamentos, this.buscaAcabamento);
  }

  get produtosFiltrados(): AdminOnboardingCatalogoProdutoResponse[] {
    return this.filtrarLista(this.produtos, this.buscaProduto);
  }

  carregarCatalogo(): void {
    this.carregandoCatalogo = true;
    this.catalogoService.buscarCatalogo$()
      .pipe(finalize(() => (this.carregandoCatalogo = false)))
      .subscribe({
        next: (catalogo) => {
          this.servicos = this.ordenarLista(catalogo.servicos);
          this.acabamentos = this.ordenarLista(catalogo.acabamentos);
          this.produtos = this.ordenarLista(catalogo.produtos);
        },
        error: (err) => {
          this.toastr.error(extrairMensagemErro(err, 'Não foi possível carregar o catálogo do onboarding.'));
        }
      });
  }

  onTabChange(index: number): void {
    this.abaSelecionada = index;
    const tab = this.tabPorIndice(index);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: tab === 'resumo' ? {} : { tab },
      queryParamsHandling: tab === 'resumo' ? '' : 'merge'
    });
  }

  navegarNovoServico(): void {
    this.router.navigate(['/onboarding/catalogo/servicos/novo']);
  }

  navegarNovoAcabamento(): void {
    this.router.navigate(['/onboarding/catalogo/acabamentos/novo']);
  }

  navegarNovoProduto(): void {
    this.router.navigate(['/onboarding/catalogo/produtos/novo']);
  }

  editarServico(item: AdminOnboardingCatalogoServicoResponse): void {
    this.router.navigate(['/onboarding/catalogo/servicos', item.id, 'editar']);
  }

  editarAcabamento(item: AdminOnboardingCatalogoAcabamentoResponse): void {
    this.router.navigate(['/onboarding/catalogo/acabamentos', item.id, 'editar']);
  }

  editarProduto(item: AdminOnboardingCatalogoProdutoResponse): void {
    this.router.navigate(['/onboarding/catalogo/produtos', item.id, 'editar']);
  }

  alternarAtivoServico(item: AdminOnboardingCatalogoServicoResponse): void {
    if (!item?.id || this.atualizandoAtivoServicoId === item.id) {
      return;
    }

    this.atualizandoAtivoServicoId = item.id;
    this.catalogoService.atualizarAtivoServico$(item.id, !item.ativo)
      .pipe(finalize(() => (this.atualizandoAtivoServicoId = null)))
      .subscribe({
        next: () => {
          this.toastr.success(item.ativo ? 'Serviço desativado.' : 'Serviço ativado.');
          this.carregarCatalogo();
        },
        error: (err) => {
          this.toastr.error(extrairMensagemErro(err, 'Não foi possível atualizar o status do serviço.'));
        }
      });
  }

  alternarAtivoAcabamento(item: AdminOnboardingCatalogoAcabamentoResponse): void {
    if (!item?.id || this.atualizandoAtivoAcabamentoId === item.id) {
      return;
    }

    this.atualizandoAtivoAcabamentoId = item.id;
    this.catalogoService.atualizarAtivoAcabamento$(item.id, !item.ativo)
      .pipe(finalize(() => (this.atualizandoAtivoAcabamentoId = null)))
      .subscribe({
        next: () => {
          this.toastr.success(item.ativo ? 'Acabamento desativado.' : 'Acabamento ativado.');
          this.carregarCatalogo();
        },
        error: (err) => {
          this.toastr.error(extrairMensagemErro(err, 'Não foi possível atualizar o status do acabamento.'));
        }
      });
  }

  alternarAtivoProduto(item: AdminOnboardingCatalogoProdutoResponse): void {
    if (!item?.id || this.atualizandoAtivoProdutoId === item.id) {
      return;
    }

    this.atualizandoAtivoProdutoId = item.id;
    this.catalogoService.atualizarAtivoProduto$(item.id, !item.ativo)
      .pipe(finalize(() => (this.atualizandoAtivoProdutoId = null)))
      .subscribe({
        next: () => {
          this.toastr.success(item.ativo ? 'Produto desativado.' : 'Produto ativado.');
          this.carregarCatalogo();
        },
        error: (err) => {
          this.toastr.error(extrairMensagemErro(err, 'Não foi possível atualizar o status do produto.'));
        }
      });
  }

  formatarMoedaCentavos(valorCentavos: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format((valorCentavos || 0) / 100);
  }

  formatarOrdem(valor: number | null | undefined): string {
    return valor != null ? String(valor) : 'Auto';
  }

  statusClass(ativo: boolean): string {
    return ativo ? 'status-ativo' : 'status-inativo';
  }

  resumoVinculosProduto(item: AdminOnboardingCatalogoProdutoResponse): string {
    const servicos = item.servicos?.slice(0, 2).map((servico) => servico.nome) ?? [];
    const acabamentos = item.acabamentos?.slice(0, 2).map((acabamento) => acabamento.nome) ?? [];
    const partes = [
      servicos.length ? `Serviços: ${servicos.join(', ')}` : '',
      acabamentos.length ? `Acabamentos: ${acabamentos.join(', ')}` : ''
    ].filter(Boolean);

    if (!partes.length) {
      return 'Sem vínculos';
    }

    const totalRelacionamentos = item.servicoIds.length + item.acabamentoIds.length;
    const preview = partes.join(' • ');
    return totalRelacionamentos > 4 ? `${preview} • ...` : preview;
  }

  trackById = (_: number, item: { id: number }) => item.id;

  private aplicarTabDaUrl(tab: CatalogoTab | null): void {
    const map: Record<CatalogoTab, number> = {
      resumo: 0,
      servicos: 1,
      acabamentos: 2,
      produtos: 3
    };

    this.abaSelecionada = map[tab ?? 'resumo'] ?? 0;
  }

  private tabPorIndice(index: number): CatalogoTab {
    return (['resumo', 'servicos', 'acabamentos', 'produtos'][index] as CatalogoTab) ?? 'resumo';
  }

  private ordenarLista<T extends { ordemExibicao: number | null; nome: string }>(lista: T[]): T[] {
    return [...lista].sort((a, b) => {
      const ordemA = a.ordemExibicao ?? Number.MAX_SAFE_INTEGER;
      const ordemB = b.ordemExibicao ?? Number.MAX_SAFE_INTEGER;
      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }
      return (a.nome || '').localeCompare(b.nome || '');
    });
  }

  private filtrarLista<T extends { codigo: string; nome: string; descricao?: string | null; categoria?: string | null }>(
    lista: T[],
    busca: string
  ): T[] {
    const termo = (busca || '').trim().toLowerCase();
    if (!termo) {
      return lista;
    }

    return lista.filter((item) =>
      item.nome.toLowerCase().includes(termo) ||
      item.codigo.toLowerCase().includes(termo) ||
      (item.descricao || '').toLowerCase().includes(termo) ||
      (item.categoria || '').toLowerCase().includes(termo)
    );
  }
}
