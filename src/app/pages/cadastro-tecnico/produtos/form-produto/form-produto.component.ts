
import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import {
  ReactiveFormsModule, FormsModule, FormGroup, FormBuilder, Validators, FormControl
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { ToastrService } from 'src/app/services/toastr.service';

import { SharedComponentsModule } from 'src/app/components/shared-components.module';
import { ProdutoService } from '../../services/produto.service';

import { ProdutoRequest } from 'src/app/models/produto/produto-request.model';
import { VariacoesProdutoComponent } from './variacoes-produto/variacoes-produto.component';
import { VariacaoProduto } from './variacoes-produto/models/variacao.model';
import { PrecoRequest } from 'src/app/models/preco/preco.model';
import { VariacaoProdutoRequest } from 'src/app/models/produto/variacao-produto-request.model';
import { PoliticaRevenda } from 'src/app/models/politica-revenda.model';
import { PoliticaRevendaComponent } from './politica-revenda/politica-revenda.component';
import { ProdutoResponse } from 'src/app/models/produto/produto-response.model';
import { CardHeaderComponent } from "src/app/components/card-header/card-header.component";
import { AuthService } from 'src/app/services/auth.service';
import { BillingService } from 'src/app/pages/billing/services/billing.service';
import { CalculadoraMateriaisComponent } from './calculadora-materiais/calculadora-materiais.component';

type ProdutoTabId = 'geral' | 'politica-revenda' | 'variacoes' | 'calculadora-materiais';

interface ProdutoTab {
  id: ProdutoTabId;
  label: string;
}

const CALCULADORA_MATERIAIS_MODULO = 'CALCULADORA_MATERIAIS';
const CALCULADORA_MATERIAIS_PERMISSAO = 'CONFIG_CALCULADORAS';

@Component({
  selector: 'app-form-produto',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTabsModule,
    MatIconModule,
    MatDividerModule,
    DesignSystemIconsModule,
    SharedComponentsModule,
    VariacoesProdutoComponent,
    PoliticaRevendaComponent,
    CalculadoraMateriaisComponent,
    CardHeaderComponent
],
  templateUrl: './form-produto.component.html',
  styleUrls: ['./form-produto.component.scss'],
})
export class FormProdutoComponent implements OnInit, OnDestroy {

  form!: FormGroup;
  isEditMode = false;
  produtoId!: number;
  politicaDoProduto: PoliticaRevenda | null = null;

  /** estado local das variações (o filho emite alterações) */
  variacoes: VariacaoProduto[] = [];

  /** seed para o filho preencher a tabela quando for edição */
  variacoesIniciais: VariacaoProduto[] = [];

  /** loading simples para feedback */
  loading = false;

  tabs: ProdutoTab[] = [];
  selectedTabIndex = 0;
  private requestedTabId: ProdutoTabId | null = null;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly produtoService: ProdutoService,
    private readonly toastr: ToastrService,
    private readonly cdr: ChangeDetectorRef,
    private readonly authService: AuthService,
    private readonly billingService: BillingService
  ) { }

  // ================= lifecycle =================

  ngOnInit(): void {
    this.buildForm();
    this.buildTabs();
    this.watchQueryParamTab();
    this.loadCalculadoraMateriaisAccess();
    this.detectEditModeAndLoad();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ================= template bindings =================

  onVariacoesChange(lista: VariacaoProduto[]) {
    // Garantir sempre estrutura de objeto; não aceitamos strings
    this.variacoes = (Array.isArray(lista) ? lista : [])
      .filter(v => typeof v === 'object' && v !== null) as VariacaoProduto[];
  }

  onTabIndexChange(index: number): void {
    const tab = this.tabs[index];
    if (!tab) return;

    this.selectedTabIndex = index;
    this.requestedTabId = tab.id;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab.id },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  previousTab(): void {
    if (this.selectedTabIndex <= 0) return;
    this.onTabIndexChange(this.selectedTabIndex - 1);
  }

  nextTab(): void {
    if (this.isLastTab) return;
    this.onTabIndexChange(this.selectedTabIndex + 1);
  }

  get isFirstTab(): boolean {
    return this.selectedTabIndex <= 0;
  }

  get isLastTab(): boolean {
    return this.selectedTabIndex >= this.tabs.length - 1;
  }

  // ================= init/load =================

  private buildForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(120)]],
      descricao: ['', [Validators.required, Validators.maxLength(1000)]],
      // se precisar no futuro:
      // categoriaId: [null],
      // grupoId: [null],
    });
  }

  private watchQueryParamTab(): void {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const requested = this.toProdutoTabId(params.get('tab'));
        this.requestedTabId = requested;
        this.applyRequestedTab();
      });
  }

  private loadCalculadoraMateriaisAccess(): void {
    this.billingService.obterStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.buildTabs(),
        error: () => {
          this.buildTabs();
        }
      });
  }

  private buildTabs(): void {
    const activeTab = this.tabs[this.selectedTabIndex]?.id ?? this.requestedTabId;
    const shouldShowCalculadoraMateriais = this.authService.podeAcessarFuncionalidade(
      CALCULADORA_MATERIAIS_MODULO,
      CALCULADORA_MATERIAIS_PERMISSAO
    );

    this.tabs = [
      { id: 'geral', label: 'Geral' },
      { id: 'politica-revenda', label: 'Política de Revenda' },
      { id: 'variacoes', label: 'Variações' },
      ...(shouldShowCalculadoraMateriais
        ? [{ id: 'calculadora-materiais' as const, label: 'Calculadora de Materiais' }]
        : [])
    ];

    this.selectedTabIndex = this.resolveTabIndex(activeTab);
    this.applyRequestedTab();
    this.cdr.markForCheck();
  }

  private applyRequestedTab(): void {
    this.selectedTabIndex = this.resolveTabIndex(this.requestedTabId ?? this.tabs[this.selectedTabIndex]?.id);
    this.cdr.markForCheck();
  }

  private resolveTabIndex(tabId: ProdutoTabId | null | undefined): number {
    if (!this.tabs.length) return 0;
    const index = tabId ? this.tabs.findIndex(tab => tab.id === tabId) : -1;
    return index >= 0 ? index : 0;
  }

  private toProdutoTabId(value: string | null): ProdutoTabId | null {
    const normalized = (value || '').trim() as ProdutoTabId;
    return ['geral', 'politica-revenda', 'variacoes', 'calculadora-materiais'].includes(normalized)
      ? normalized
      : null;
  }

  private detectEditModeAndLoad(): void {
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const idParam = params.get('id');
        this.isEditMode = !!idParam;
        if (!this.isEditMode) return;

        this.produtoId = Number(idParam);
        if (!Number.isFinite(this.produtoId)) return;

        this.fetchProduto(this.produtoId);
      });
  }

  private fetchProduto(id: number): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.produtoService.buscarPorId(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (produto: ProdutoResponse) => {
          this.patchProduto(produto);
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.toastr.error('Erro ao carregar produto.');
          this.router.navigate(['/page/cadastro-tecnico/produtos']);
          this.cdr.markForCheck();
        }
      });
  }

  private dedupeById<T extends { id: number }>(arr: T[] = []): T[] {
    const seen = new Set<number>();
    return (arr || []).filter(x => !seen.has(x.id) && seen.add(x.id));
  }


  private patchProduto(produto: ProdutoResponse): void {
    this.form.patchValue({
      nome: produto?.nome ?? '',
      descricao: produto?.descricao ?? ''
    });

    this.politicaDoProduto = this.mapPoliticaRevenda(produto.politicaRevenda);

    this.variacoesIniciais = (produto?.variacoes ?? []).map(v => ({
      id: v.id,
      materialId: v.materialId,
      formatoId: v.formatoId,
      cor: v.corId ? { id: v.corId, nome: v.corNome ?? undefined } : null,

      // ✅ objetos completos vindos do back (com dedupe se necessário)
      acabamentos: this.dedupeById(
        (v.acabamentos ?? []).map(a => ({
          id: a.id,
          nome: a.nome,
          descricao: a.descricao,
          ativo: a.ativo,
        }))
      ),
      servicos: this.dedupeById(
        (v.servicos ?? []).map(s => ({
          id: s.id,
          nome: s.nome,
          descricao: s.descricao,
          ativo: s.ativo,
        }))
      ),

      // preço da variação (já vem pronto para o PrecoSelector)
      preco: v.preco ?? null,

      politicaRevenda: this.politicaDoProduto ?? null,
    }));

    this.cdr.markForCheck();
  }

  // ================= submit =================
  onSubmit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => c.markAsTouched());
      this.toastr.error('Preencha os campos obrigatórios.');
      return;
    }

    if (!Array.isArray(this.variacoes) || !this.variacoes.length) {
      this.toastr.error('Adicione pelo menos uma variação antes de salvar.');
      return;
    }

    // Bloqueia casos em que o filho emite strings ou linhas sem ids/preço
    const invalidRow = this.variacoes.find(v => this.isInvalidVariacao(v as any));
    if (invalidRow) {
      this.toastr.error('Há variações com dados inválidos. Verifique material, formato e preço.');
      return;
    }

    const payload = this.toProdutoRequest(this.form.getRawValue());

    this.loading = true;
    this.cdr.markForCheck();

    const req$ = this.isEditMode
      ? this.produtoService.atualizar(this.produtoId, payload)
      : this.produtoService.salvar(payload);

    req$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          this.toastr.success(this.isEditMode ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
          this.router.navigate(['/page/cadastro-tecnico/produtos']);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.toastr.error(this.isEditMode ? 'Erro ao atualizar produto.' : 'Erro ao criar produto.');
          this.cdr.markForCheck();
        }
      });
  }

  // ================= utils =================

  private isInvalidVariacao(v: any): boolean {
    if (typeof v !== 'object' || v == null) return true;
    const toId = (x: any) => x == null ? null : (typeof x === 'object' ? Number(x.id) : Number(x));
    const materialId = toId(v.materialId);
    const precoTipo = v?.preco?.tipo;
    return !materialId || !precoTipo;
  }

  private num(v: any): number {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error('Valor numérico inválido.');
    return n;
  }

  private numOrNull(v: any): number | null {
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  onPoliticaChange(val: PoliticaRevenda | null) {
    this.politicaDoProduto = val;
    this.cdr.markForCheck();
  }

  // ================= mapping helpers =================

  private toProdutoRequest(formValue: any): ProdutoRequest {
    return {
      nome: String(formValue?.nome ?? '').trim(),
      descricao: String(formValue?.descricao ?? '').trim(),
      variacoes: this.toVariacoesRequest(this.variacoes),
      politicaRevenda: this.buildPoliticaRevendaPayload() ?? undefined, // envia só se existir
    };
  }

  private buildPoliticaRevendaPayload(): ProdutoRequest['politicaRevenda'] | null {
    const src = this.politicaDoProduto ?? this.extractPoliticaFromVariacoes(this.variacoes);
    if (!src) return null;

    const percentual = !!src.percentual;
    const percentualDesconto = percentual ? this.numOrNull(src.percentualDesconto) : undefined;
    const precoFixo = !percentual ? this.numOrNull(src.precoFixo) : undefined;

    // (opcional) validação simples: não permitir ambos/nenhum
    if (percentual && (percentualDesconto == null)) {
      this.toastr.error('Defina o percentual de desconto da política.');
      throw new Error('PoliticaRevenda inválida: percentual sem valor.');
    }
    if (!percentual && (precoFixo == null)) {
      this.toastr.error('Defina o preço fixo da política.');
      throw new Error('PoliticaRevenda inválida: preço fixo ausente.');
    }

    return { percentual, percentualDesconto, precoFixo };
  }

  private extractPoliticaFromVariacoes(lista: VariacaoProduto[]): PoliticaRevenda | null {
    const p = (lista ?? []).find(v => !!v.politicaRevenda)?.politicaRevenda;
    return p ? this.normalizePolitica(p) : null;
  }

  private normalizePolitica(src: any): PoliticaRevenda {
    if (!src) return null as any;

    const percentual = !!src.percentual;

    return {
      id: src.id ?? undefined,
      percentual,
      // quando for percentual, usa percentualDesconto; quando for preço fixo, usa precoFixo
      percentualDesconto: percentual
        ? this.numOrNull(src.percentualDesconto)
        : undefined,
      precoFixo: !percentual
        ? this.numOrNull(src.precoFixo)
        : undefined,
    };
  }

  private extractId(val: any): number | null {
    if (val == null) return null;
    if (typeof val === 'number') return Number(val);
    if (typeof val === 'string' && /^\d+$/.test(val)) return Number(val);
    if (typeof val === 'object') {
      if ('id' in val && val.id != null) return Number(val.id);
      if ('value' in val && val.value != null) return Number(val.value);
    }
    return null;
  }

  private toVariacoesRequest(lista: VariacaoProduto[]): VariacaoProdutoRequest[] {
    return (lista ?? []).map((v: any) => {
      const materialId = this.extractId(v.materialId);
      const formatoId = this.extractId(v.formatoId);
      // aceita v.cor (objeto/numero) ou v.corId (fallback)
      const corId = this.extractId(v.cor ?? v.corId);

      if (!materialId || !v?.preco?.tipo) {
        throw new Error('Variação inválida (material ou preço ausente).');
      }

      return {
        ...(v?.id ? { id: Number(v.id) } : {}),
        ...(this.isEditMode ? {} : {}), // não enviar produtoId (mantém o mesmo shape do criar)
        materialId: Number(materialId),
        ...(formatoId != null ? { formatoId: Number(formatoId) } : { formatoId: null }),
        corId: corId != null ? Number(corId) : null,
        acabamentoIds: Array.isArray(v.acabamentos) ? v.acabamentos.map((x: any) => Number(this.extractId(x))) : [],
        servicoIds: Array.isArray(v.servicos) ? v.servicos.map((x: any) => Number(this.extractId(x))) : [],
        preco: this.toPrecoRequest(v.preco),
      } as VariacaoProdutoRequest;
    });
  }

  private toPrecoRequest(preco: any): PrecoRequest {
    if (!preco?.tipo) throw new Error('Preço inválido na variação.');
    const p = preco ?? {};

    switch (preco.tipo) {
      case 'FIXO':
        return { tipo: 'FIXO', valor: this.num(p.valor) };

      case 'QUANTIDADE':
        return {
          tipo: 'QUANTIDADE',
          faixas: (p.faixas ?? []).map((f: any) => ({
            quantidade: this.num(f.quantidade),
            valor: this.num(f.valor),
          })),
        };

      case 'DEMANDA':
        return {
          tipo: 'DEMANDA',
          faixas: (p.faixas ?? []).map((f: any) => ({
            de: this.num(f.de),
            ate: this.num(f.ate),
            valorUnitario: this.num(f.valorUnitario),
          })),
        };

      case 'METRO':
        return {
          tipo: 'METRO',
          precoMetro: this.num(p.precoMetro),
          modoCobranca: p.modoCobranca ?? 'QUADRADO',
          ...(p.precoMinimo != null ? { precoMinimo: this.num(p.precoMinimo) } : {}),
          ...(p.alturaMaxima != null ? { alturaMaxima: this.num(p.alturaMaxima) } : {}),
          ...(p.larguraMaxima != null ? { larguraMaxima: this.num(p.larguraMaxima) } : {}),
          ...(p.largurasLinearesPermitidas
            ? { largurasLinearesPermitidas: String(p.largurasLinearesPermitidas) }
            : {}),
        } as PrecoRequest;

      default:
        throw new Error(`Tipo de preço desconhecido: ${preco?.tipo}`);
    }
  }

  private mapPoliticaRevenda(src: PoliticaRevenda | null | undefined): PoliticaRevenda | null {
    if (!src) return null;
    return {
      id: src.id,
      percentual: !!src.percentual,
      percentualDesconto: src.percentual ? (src.percentualDesconto ?? undefined) : undefined,
      precoFixo: !src.percentual ? (src.precoFixo ?? undefined) : undefined,
    };
  }

  // ================= getters de conveniência =================

  get nomeControl(): FormControl {
    return this.form.get('nome') as FormControl;
  }
  get descricaoControl(): FormControl {
    return this.form.get('descricao') as FormControl;
  }
}
