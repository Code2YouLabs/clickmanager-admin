import { Component, Inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardTitle, MatCard } from '@angular/material/card';

import { InputMultiSelectComponent } from 'src/app/components/inputs/input-multi-select/input-multi-select-component';
import { InputNumericoComponent } from 'src/app/components/inputs/input-numerico/input-numerico.component';
import { InputOptionsComponent } from 'src/app/components/inputs/input-options/input-options.component';

import { SmartCalcInitDataService } from './smart-calc-init-data.service';
import { SmartCalcDataService } from './smart-calc-data.service'; // (por enquanto mantém cálculo + pedido aqui)
import { SmartCalcRequest } from 'src/app/models/smart-calc/smart-calc-request.model';
import { SmartCalcItem } from 'src/app/models/smart-calc/smart-calc-item.model';
import { SmartCalcResultado } from 'src/app/models/smart-calc/smart-calc-resultado.model';

import { SmartCalcInitResponse, ProdutoSmartCalcInitResponse, ProdutoVariacaoSmartCalcInitResponse } from 'src/app/models/smart-calc/init/smartcalc-init.model';
import { ProdutoListagem } from 'src/app/models/produto/produto-listagem.model';

import { ToastrService } from 'src/app/services/toastr.service';
import { of, switchMap, map, finalize, Observable } from 'rxjs';

import { PedidoItemRequest } from 'src/app/models/pedido/pedido-item-request.model';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';
import { PedidoService } from '../../pedido/pedido.service';
import { ItemTipo } from 'src/app/models/pedido/item-tipo.enum';
import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';

import { CalculadoraConfigService } from 'src/app/pages/smart-calc-config/calculadora-config.service';
import { CalculadoraConfigResponse } from 'src/app/models/calculadora/calculadora-config-response.model';
import { extrairMensagemErro } from 'src/app/utils/mensagem.util';

type Material = { id: number; nome: string; descricao?: string };
type Servico = { id: number; nome: string };
type Acabamento = { id: number; nome: string };

@Component({
  selector: 'app-smart-calc',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatExpansionModule,
    InputMultiSelectComponent,
    InputNumericoComponent,
    InputOptionsComponent,
    MatCardTitle,
    MatCard,
  ],
  templateUrl: './smart-calc.component.html',
  styleUrls: ['./smart-calc.component.scss'],
})
export class SmartCalcComponent implements OnInit {
  // =========================
  // INIT (tela)
  // =========================
  init: SmartCalcInitResponse | null = null;

  // produtos exibidos no select (mantém ProdutoListagem só pra não mexer no HTML)
  produtos: ProdutoListagem[] = [];

  // produto do init selecionado
  produtoInitSelecionado: ProdutoSmartCalcInitResponse | null = null;

  // mapa: materialId -> variacoes do init
  private variacoesPorMaterialInit = new Map<number, ProdutoVariacaoSmartCalcInitResponse[]>();

  // (para pedido) variação escolhida para o material atual
  private variacaoSelecionadaId: number | null = null;

  materiais: Material[] = [];
  servicos: Servico[] = [];
  acabamentos: Acabamento[] = [];

  carregandoProdutos = false;
  erroProdutos: string | null = null;
  carregandoCalculo = false;
  erroCalculo: string | null = null;
  carregandoAdd = false;
  needsRecalcular = signal(false);

  // =========================
  // FORM
  // =========================
  form!: FormGroup<{
    largura: FormControl<number | null>;
    altura: FormControl<number | null>;
    quantidade: FormControl<number | null>;
    produtoId: FormControl<number | null>;
    materialId: FormControl<number | null>;
    servicosIds: FormControl<number[]>;
    acabamentosIds: FormControl<number[]>;
    permiteRotacao: FormControl<boolean>;
  }>;

  // =========================
  // RESULTADO (core)
  // =========================
  resultado = signal<SmartCalcResultado | null>(null);
  itens = computed<SmartCalcItem[]>(() => this.resultado()?.itens ?? []);
  observacao = computed<string | undefined>(() => this.resultado()?.observacao);
  total = computed<number>(() => this.resultado()?.total ?? 0);
  melhor = computed<SmartCalcItem | null>(() => this.itens()[0] ?? null);
  temResultado = computed<boolean>(() => !!this.resultado() && this.itens().length > 0);

  // =========================
  // CONFIG (tela config antiga)
  // =========================
  config?: CalculadoraConfigResponse | null;
  private allowedProductIds = new Set<number>();
  configAtiva = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SmartCalcComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private initSvc: SmartCalcInitDataService, // ✅ NOVO: só init
    private dataSvc: SmartCalcDataService, // ✅ por enquanto mantém cálculo + pedido aqui
    private pedidoService: PedidoService,
    private dialog: MatDialog,
    private toastr: ToastrService,
    private router: Router,
    private calcCfgSvc: CalculadoraConfigService
  ) { }

  ngOnInit(): void {
    // 1) cria o form
    this.form = this.fb.group({
      largura: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
      altura: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
      quantidade: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
      produtoId: this.fb.control<number | null>(null, [Validators.required]),
      materialId: this.fb.control<number | null>(null),
      servicosIds: this.fb.nonNullable.control<number[]>([]),
      acabamentosIds: this.fb.nonNullable.control<number[]>([]),
      permiteRotacao: this.fb.nonNullable.control(true),
    });

    // 2) listeners
    this.form.controls.produtoId.valueChanges.subscribe((id) => {
      if (id) {
        this.carregarProdutoInit(id);
      } else {
        this.resetProdutoDependencias();
      }
    });

    this.form.controls.materialId.valueChanges.subscribe((mid) => {
      this.atualizarListasPorMaterial(mid ?? undefined);
      // ⚠️ regra METRO/LINEAR depende de preço; no INIT atual não vem preço
      // deixe por enquanto sem travar largura, ou ajuste quando o init passar preço.
      this.aplicarModoCobrancaRegraLargura();
    });

    this.form.valueChanges.subscribe(() => {
      if (!this.resultado()) return;
      this.needsRecalcular.set(true);
    });

    // 3) carrega configuração (whitelist)
    this.calcCfgSvc.getConfig().subscribe({
      next: (cfg) => {
        this.config = cfg;
        this.configAtiva = !!cfg?.ativo;

        this.allowedProductIds.clear();
        for (const p of (cfg?.produtos ?? [])) {
          if (p?.id != null) this.allowedProductIds.add(p.id);
        }

        if (!this.configAtiva) {
          this.toastr.warning('O SmartCalc está desabilitado nas configurações.', 'SmartCalc');
        }

        // 4) carrega INIT (produtos + variações + materiais/acabamentos/serviços)
        this.carregarInit();
      },
      error: (err) => {
        console.error('[SmartCalc] erro ao obter config', err);
        // sem config -> não trava a tela
        this.configAtiva = true;
        this.carregarInit();
      },
    });
  }

  // ==========================================================
  // INIT: Carregamento da tela
  // ==========================================================
  private carregarInit(): void {
    this.carregandoProdutos = true;
    this.erroProdutos = null;

    this.initSvc.carregarInit$().subscribe({
      next: (init) => {
        this.init = init;
        // se o init vier desativado, respeita também
        // (mantém compatibilidade com sua configAtiva)
        this.configAtiva = this.configAtiva && !!init?.ativo;

        let arr = (init?.produtos ?? []).map(
          (p) => ({ id: p.id, nome: p.nome } as unknown as ProdutoListagem)
        );

        if (this.allowedProductIds.size > 0) {
          arr = arr.filter((p) => this.allowedProductIds.has(p.id));
        }

        this.produtos = arr;

        if (!this.form.controls.produtoId.value) {
          this.form.controls.produtoId.setValue(null, { emitEvent: false });
        }

        if (!this.configAtiva) {
          this.form.disable({ emitEvent: false });
        } else {
          this.form.enable({ emitEvent: false });
        }

        this.carregandoProdutos = false;
      },
      error: (err) => {
        console.error('Erro ao carregar init', err);
        this.erroProdutos = 'Não foi possível carregar a SmartCalc (init).';
        this.carregandoProdutos = false;
      },
    });
  }

  private resetProdutoDependencias(): void {
    this.produtoInitSelecionado = null;
    this.resultado.set(null);
    this.needsRecalcular.set(false);

    this.servicos = [];
    this.acabamentos = [];
    this.materiais = [];

    this.variacoesPorMaterialInit.clear();

    this.form.controls.materialId.setValue(null, { emitEvent: false });
    this.form.controls.servicosIds.setValue([], { emitEvent: false });
    this.form.controls.acabamentosIds.setValue([], { emitEvent: false });

    this.form.controls.largura.setValue(null, { emitEvent: false });
    this.form.controls.altura.setValue(null, { emitEvent: false });
    this.form.controls.quantidade.setValue(null, { emitEvent: false });

    this.aplicarModoCobrancaRegraLargura();
  }


  private carregarProdutoInit(produtoId: number): void {
    // limpa estado dependente
    this.resultado.set(null);
    this.needsRecalcular.set(false);
    this.servicos = [];
    this.acabamentos = [];
    this.materiais = [];
    this.variacoesPorMaterialInit.clear();
    this.variacaoSelecionadaId = null;
    this.form.controls.materialId.setValue(null, { emitEvent: false });

    const prod = (this.init?.produtos ?? []).find((p) => p.id === produtoId) ?? null;
    this.produtoInitSelecionado = prod;

    if (!prod) {
      this.atualizarListasPorMaterial(undefined);
      return;
    }

    // monta map material -> variacoes
    this.variacoesPorMaterialInit = this.initSvc.mapVariacoesPorMaterial(prod);

    // materiais
    this.materiais = this.initSvc.extrairMateriaisBasicos(this.variacoesPorMaterialInit);

    if (this.materiais.length) {
      const firstId = this.materiais[0].id;
      this.form.controls.materialId.setValue(firstId, { emitEvent: false });
      this.atualizarListasPorMaterial(firstId);
    } else {
      this.atualizarListasPorMaterial(undefined);
    }

    this.aplicarModoCobrancaRegraLargura();
    this.form.controls.largura.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }

  private atualizarListasPorMaterial(materialId?: number): void {
    // acabamentos/serviços do INIT filtrados por material
    const novosAcab = this.initSvc
      .extrairAcabamentosPorMaterial(this.variacoesPorMaterialInit, materialId)
      .map((a) => ({ id: a.id, nome: a.nome }));

    const novosServs = this.initSvc
      .extrairServicosPorMaterial(this.variacoesPorMaterialInit, materialId)
      .map((s) => ({ id: s.id, nome: s.nome }));

    this.acabamentos = novosAcab;
    this.servicos = novosServs;

    // guarda variacaoId (para PedidoItemRequest)
    this.variacaoSelecionadaId = this.initSvc.obterVariacaoIdSelecionada(this.variacoesPorMaterialInit, materialId);

    // remove seleções inválidas
    const selAcab = (this.form.controls.acabamentosIds.value ?? []).filter((id) =>
      this.acabamentos.some((a) => a.id === id)
    );
    const selServ = (this.form.controls.servicosIds.value ?? []).filter((id) =>
      this.servicos.some((s) => s.id === id)
    );

    if (selAcab.length !== (this.form.controls.acabamentosIds.value ?? []).length) {
      this.form.controls.acabamentosIds.setValue(selAcab);
    }
    if (selServ.length !== (this.form.controls.servicosIds.value ?? []).length) {
      this.form.controls.servicosIds.setValue(selServ);
    }
  }

  // ==========================================================
  // CORE: cálculo (por enquanto fica no dataSvc antigo)
  // ==========================================================
  calcular(): void {
    if (!this.configAtiva) {
      this.toastr.warning('O SmartCalc está desabilitado nas configurações.', 'SmartCalc');
      return;
    }
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    if (v.largura == null || v.altura == null || v.quantidade == null || v.produtoId == null) return;

    const payload: SmartCalcRequest = {
      produtoId: v.produtoId,
      materialId: v.materialId ?? undefined,
      largura: Number(v.largura),
      altura: Number(v.altura),
      quantidade: Number(v.quantidade),
      servicosIds: v.servicosIds ?? [],
      acabamentosIds: v.acabamentosIds ?? [],
    };

    this.carregandoCalculo = true;
    this.erroCalculo = null;

    this.dataSvc.calcularSmartCalc(payload).subscribe({
      next: (res) => {
        this.resultado.set(res ?? { itens: [], total: 0, observacao: undefined });
        this.needsRecalcular.set(false);
        this.carregandoCalculo = false;
      },
      error: (err) => {
        const msg = extrairMensagemErro(err, 'Não foi possível calcular. Tente novamente.');
        this.toastr.error(msg, 'SmartCalc', { timeOut: 6000, closeButton: true, progressBar: true });
        this.resultado.set(null);
        this.erroCalculo = msg;
        this.needsRecalcular.set(false);
        this.carregandoCalculo = false;
      },
    });
  }

  // ==========================================================
  // PEDIDO: (por enquanto fica no dataSvc antigo)
  // ==========================================================
  adicionarAoPedido(): void {
    if (!this.configAtiva) {
      this.toastr.warning('O SmartCalc está desabilitado nas configurações.', 'SmartCalc');
      return;
    }

    const top = this.melhor();
    if (!top) {
      this.toastr.warning('Nenhum item calculado.', 'SmartCalc');
      return;
    }

    const r = this.resultado();
    const itensCalc: any[] = Array.isArray(r?.itens) && r!.itens.length ? r!.itens : [top];

    const gerarGrupo = () => (globalThis as any).crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
    const baseKeyByVar = new Map<number, string>();

    const normalizar = (v: any) => (v ?? '').toString().toLowerCase().trim();
    const matchOptionId = (nomeItem: string, lista: { id: number; nome: string }[]) => {
      const alvo = normalizar(nomeItem);
      const achado = lista.find((opt) => alvo.includes(normalizar(opt.nome)));
      return achado?.id;
    };

    const itens: PedidoItemRequest[] = [];

    for (const item of itensCalc) {
      const nomeItem = item.nomeComposto ?? item.nome ?? item.descricao ?? 'Item calculado';
      const quantidade = Number(item.quantidade ?? top.quantidade ?? 1);
      const subTotal = Number(item.subTotal ?? 0);
      const unitTop = Number(item.precoUnitario ?? (quantidade > 0 ? subTotal / quantidade : 0));
      const unitario = Number.isFinite(unitTop) && unitTop > 0 ? unitTop : 0;

      const largura = Number(item.largura ?? top.largura ?? 0) || undefined;
      const altura = Number(item.altura ?? top.altura ?? 0) || undefined;

      const variacaoId = Number(item.produtoVariacaoId ?? item.variacaoId ?? this.getSelectedVariacaoId() ?? item.produtoId ?? 0);

      const tipoItem: ItemTipo =
        (item.tipo as ItemTipo | undefined) ??
        (item.servicoId ? ItemTipo.SERVICO : item.acabamentoId ? ItemTipo.ACABAMENTO : ItemTipo.BASE);

      if (tipoItem === ItemTipo.BASE && !variacaoId) {
        this.toastr.error('Variação não identificada para um dos itens.');
        return;
      }

      const grupoKeyDireto: string | undefined = item.grupoKey;
      let grupoKey: string;

      if (grupoKeyDireto) {
        grupoKey = grupoKeyDireto;
      } else if (tipoItem === ItemTipo.BASE && variacaoId) {
        grupoKey = gerarGrupo();
        baseKeyByVar.set(variacaoId, grupoKey);
      } else if (variacaoId && baseKeyByVar.has(variacaoId)) {
        grupoKey = baseKeyByVar.get(variacaoId)!;
      } else {
        grupoKey = gerarGrupo();
      }

      const acabamentoId = item.acabamentoId ?? matchOptionId(nomeItem, this.acabamentos ?? []);
      const servicoId = item.servicoId ?? matchOptionId(nomeItem, this.servicos ?? []);

      itens.push({
        grupoKey,
        tipo: tipoItem,
        descricao: nomeItem,
        quantidade,
        valor: unitario,
        subTotal,
        produtoVariacaoId: tipoItem === ItemTipo.BASE ? variacaoId : undefined,
        largura,
        altura,
        acabamentoId: tipoItem === ItemTipo.ACABAMENTO ? acabamentoId : undefined,
        servicoId: tipoItem === ItemTipo.SERVICO ? servicoId : undefined,
      });
    }

    this.carregandoAdd = true;
    const usuario = this.dataSvc.getUsuarioLogado();

    this.dataSvc
      .getDraftByUser$()
      .pipe(
        switchMap((draft) => {
          if (draft) {
            const ref = this.dialog.open(ConfirmDialogComponent, {
              data: {
                title: 'Rascunho já existente',
                message: `Atendente: ${usuario?.nome}\nPedido: #${draft.numero}\n\nDeseja adicionar ao pedido existente?`,
                confirmText: 'Usar existente',
                confirmColor: 'primary',
                cancelText: 'Criar novo',
              },
            });

            return ref.afterClosed().pipe(
              switchMap((useExisting: boolean) => {
                if (useExisting === true) {
                  return this.saveObsSeTiver$(draft.id).pipe(
                    switchMap(() => this.dataSvc.addItensToPedido$(draft.id, itens)),
                    map(() => draft)
                  );
                }
                if (useExisting === false) {
                  return this.dataSvc.createDraftForUser$().pipe(
                    switchMap((p) =>
                      this.saveObsSeTiver$(p.id).pipe(
                        switchMap(() => this.dataSvc.addItensToPedido$(p.id, itens)),
                        map(() => p)
                      )
                    )
                  );
                }
                return of(null);
              })
            );
          }

          return this.dataSvc.createDraftForUser$().pipe(
            switchMap((p) =>
              this.saveObsSeTiver$(p.id).pipe(
                switchMap(() => this.dataSvc.addItensToPedido$(p.id, itens)),
                map(() => p)
              )
            )
          );
        }),
        finalize(() => (this.carregandoAdd = false))
      )
      .subscribe({
        next: (pedido) => {
          if (!pedido) return;
          const num = pedido?.numero ? ` #${pedido.numero}` : '';
          this.toastr.success(`Itens adicionados ao pedido${num}.`, 'SmartCalc');

          const ref = this.dialog.open(ConfirmDialogComponent, {
            data: {
              title: 'Abrir pedido?',
              message: `Deseja abrir o pedido${num} agora?`,
              confirmText: 'Abrir pedido',
              confirmColor: 'primary',
            },
          });

          ref.afterClosed()
            .pipe(switchMap((go: boolean): Observable<PedidoResponse | null> => (go ? this.pedidoService.buscarPorId(pedido.id) : of(null))))
            .subscribe({
              next: (p) => {
                if (!p) return;
                this.dialog.closeAll();
                this.router.navigate(['/page/pedido/detalhe', p.id]);
              },
              error: (err) =>
                this.toastr.error(err?.error?.message ?? err?.message ?? 'Falha ao abrir o pedido.', 'SmartCalc'),
            });
        },
        error: (err) =>
          this.toastr.error(err?.error?.message ?? err?.message ?? 'Falha ao adicionar itens ao pedido.', 'SmartCalc'),
      });
  }

  private saveObsSeTiver$(pedidoId: number): Observable<void | null> {
    const obs = (this.observacao() ?? '').trim();
    if (!obs) return of(null);
    return this.pedidoService.atualizar(pedidoId, { observacoes: obs } as any) as unknown as Observable<void>;
  }

  // ✅ agora vem do INIT (id da variação do material atual)
  private getSelectedVariacaoId(): number | undefined {
    return this.variacaoSelecionadaId ?? undefined;
  }

  limpar(): void {
  this.form.reset({
    largura: null,
    altura: null,
    quantidade: null,
    produtoId: null,
    materialId: null,
    servicosIds: [],
    acabamentosIds: [],
    permiteRotacao: true,
  });

  this.resetProdutoDependencias();
}

  enviarParaPedido(): void {
    this.adicionarAoPedido();
  }

  fechar(): void {
    this.dialogRef.close(null);
  }

  getMaterialDescricao(id: number): string {
    const m = this.materiais.find((x) => x.id === id);
    return m?.descricao ?? '—';
  }

  // ==========================================================
  // REGRA METRO/LINEAR
  // ==========================================================
  // ⚠️ Seu INIT ainda não tem "preco". Então por enquanto essa regra não trava a largura.
  // Quando você mandar no init: { preco: { tipo, modoCobranca, larguraMaxima } }, a gente ajusta aqui.
  private getSelectedPreco(): any | undefined {
    return undefined;
  }

  isMetroLinear(): boolean {
    const preco: any = this.getSelectedPreco();
    const tipo = (preco?.tipo ?? '').toString().toUpperCase();
    const modo = (preco?.modoCobranca ?? '').toString().toUpperCase();
    return tipo === 'METRO' && modo === 'LINEAR';
  }

  getLinearLarguraMaxima(): number | null {
    const preco: any = this.getSelectedPreco();
    const raw = Number(preco?.larguraMaxima);
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  }

  private aplicarModoCobrancaRegraLargura(): void {
    const larguraCtrl = this.form.controls.largura;

    if (this.isMetroLinear()) {
      const larguraMax = this.getLinearLarguraMaxima();
      if (larguraMax != null) {
        larguraCtrl.setValue(larguraMax, { emitEvent: false });
      }
      larguraCtrl.disable({ emitEvent: false });
    } else {
      if (larguraCtrl.disabled) larguraCtrl.enable({ emitEvent: false });
    }
  }

  podeCalcular(): boolean {
    return this.configAtiva && this.form.valid && !this.carregandoCalculo && !this.carregandoProdutos;
  }
}
