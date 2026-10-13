import { Component, OnInit, inject } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PedidoResponse } from 'src/app/models/pedido/pedido-response.model';
import { PedidoService } from '../pedido.service';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { TelefonePipe } from "../../../pipe/telefone.pipe";
import { FormaPagamento } from 'src/app/utils/forma-pagamento.enum';
import { InputMoedaComponent } from "../../../components/inputs/input-moeda/input-moeda.component";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputOptionsComponent } from "../../../components/inputs/input-options/input-options.component";
import { ToastrService } from 'src/app/services/toastr.service';
import { PagamentoRequest } from 'src/app/models/pagamento/pagamento-request.model';
import { MatDialog } from '@angular/material/dialog';
import { DialogAdicionarProdutoComponent } from '../dialog-adicionar-produto/dialog-adicionar-produto.component';
import { PedidoItemRequest } from 'src/app/models/pedido/pedido-item-request.model';
import { ItemTipo } from 'src/app/models/pedido/item-tipo.enum';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SharedComponentsModule } from "src/app/components/shared-components.module";
import { Observable, of, Subscription } from 'rxjs';
import { catchError, map as rxMap, tap, debounceTime, distinctUntilChanged, switchMap, filter, map } from 'rxjs/operators';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { DialogDescreverItemComponent } from '../dialog-descrever-item/dialog-descrever-item.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { PedidoFluxoControlesComponent } from 'src/app/components/pedido-fluxo-controles/pedido-fluxo-controles.component';
import { ResumoFinanceiroCardComponent } from 'src/app/components/resumo-financeiro-card/resumo-financeiro-card.component';
import { PedidoInfoCardComponent } from 'src/app/components/pedido-info-card/pedido-info-card.component';
import { ClienteSelectorCardComponent } from 'src/app/components/cliente-selector-card/cliente-selector-card.component';
import { ItensPedidoSectionComponent } from 'src/app/components/itens-pedido-section/itens-pedido-section.component';
import { ObservacoesCardComponent } from 'src/app/components/observacoes-card/observacoes-card.component';
import { PagamentosSectionComponent } from 'src/app/components/pagamentos-section/pagamentos-section.component';
import { ConfirmDialogComponent } from 'src/app/components/dialog/confirm-dialog/confirm-dialog.component';
import { PedidoFlowConfigService } from 'src/app/core/flow/pedido-flow-config.service';
import { PedidoFlowGuardService } from 'src/app/core/flow/pedido-flow-guard.service';
import { FlowConfig, FlowPermissoes } from 'src/app/core/flow/pedido-flow.types';
import { mapPedidoToFlowContext } from 'src/app/core/flow/pedido-flow.context';

@Component({
    selector: 'app-detalhes-pedido',
    standalone: true,
    imports: [
    MatCardModule,
    ReactiveFormsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    RouterModule,
    TelefonePipe,
    InputMoedaComponent,
    InputOptionsComponent,
    SharedComponentsModule,
    DialogDescreverItemComponent,
    HttpClientModule,
    SectionCardComponent,
    PageCardComponent,
    PedidoFluxoControlesComponent,
    ResumoFinanceiroCardComponent,
    PedidoInfoCardComponent,
    ClienteSelectorCardComponent,
    ItensPedidoSectionComponent,
    ObservacoesCardComponent,
    PagamentosSectionComponent,
    ConfirmDialogComponent
],
    templateUrl: './detalhes-pedido.component.html',
    styleUrls: ['./detalhes-pedido.component.scss']
})
export class DetalhesPedidoComponent implements OnInit {

    form!: FormGroup;

    private readonly route = inject(ActivatedRoute);
    private readonly pedidoService = inject(PedidoService);
    private readonly router = inject(Router);
    private readonly flowConfigService = inject(PedidoFlowConfigService);
    private readonly flowGuard = inject(PedidoFlowGuardService);

    trocandoCliente = false;

    trocandoStatus = false;
    carregandoStatus = false;
    statusOptions: string[] = [];
    flowConfig: FlowConfig | null = null;
    permissoes: FlowPermissoes = { cliente: true, itens: true, observacoes: true, pagamentos: true, status: true };
    transicoesUI: { status: string; label: string; bloqueado: boolean; motivo?: string }[] = [];
    flowHints: string[] = [];

    pedido: PedidoResponse | null = null;
    pedidoItens: PedidoItemRequest[] = [];
    carregando = true;
    salvandoCliente = false;
    adicionandoPagamento = false;
    adicionandoItens = false;
    expandirPagamentos = false;

    aprovando = false;

    // controle do autocomplete de cliente
    clienteControl = new FormControl<any | null>(null);

    observacoesControl = new FormControl<string>('', { nonNullable: true });
    salvandoObs = false;
    obsOk = false;

    formasPagamento = Object.values(FormaPagamento);

    obsSub?: Subscription;

    displayedColumnsItens = ['descricao', 'quantidade', 'valor', 'subTotal'];
    displayedColumnsPagamentos = ['forma', 'valor', 'confirmado', 'data'];

    constructor(
        private fb: FormBuilder,
        private toastr: ToastrService,
        private dialog: MatDialog,
    ) { }

    ngOnInit(): void {
        this.form = this.criarFormulario();

        this.flowConfigService.getConfig().subscribe(cfg => {
            this.flowConfig = cfg;
            if (this.pedido) {
                this.atualizarPermissoesETransicoes();
            }
        });

        // Reage a mudanças do :id
        this.route.paramMap.pipe(
            rxMap(pm => Number(pm.get('id'))),
            filter(id => !!id && !Number.isNaN(id)),
            switchMap(id => {
                // limpa estado visual enquanto carrega o novo
                this.carregando = true;
                this.pedido = null;
                this.trocandoCliente = false;
                this.trocandoStatus = false;
                this.clienteControl.reset(null, { emitEvent: false });
                this.form.reset({ clienteId: null, status: null });

                return this.pedidoService.buscarPorId(id);
            })
        ).subscribe({
            next: (res) => {
                this.sincronizarPedido(res);
                this.carregando = false;
            },
            error: (err) => {
                console.error('Erro ao carregar pedido:', err);
                this.toastr.error('Não foi possível carregar o pedido.');
                this.carregando = false;
            }
        });
    }

    ngOnDestroy(): void {
        this.obsSub?.unsubscribe();
    }


    private criarFormulario(): FormGroup {
        // cliente pode ser null no rascunho
        return this.fb.group({
            clienteId: [null],
            status: [null],
            pagamento: this.fb.group({
                valor: [null, Validators.required],
                forma: [null, Validators.required]
            })
        });
    }

    /** Busca para o <app-auto-complete> (retorna {content: []}) */
    buscarClientes = (termo: string): Observable<any[]> =>
        this.pedidoService.buscarClientesPorNome(termo).pipe(map(res => res.content ?? []));

    /** Display do item no autocomplete */
    mostrarCliente = (cliente: any): string =>
        cliente ? `${cliente.nome}${cliente.telefone ? ' - ' + cliente.telefone : ''}` : '';

    /** Salva/atualiza o cliente do pedido a partir do autocomplete */
    salvarClienteDoControle(): void {
        const id = this.pedido?.id;
        if (!id) return;

        const selecionado = this.clienteControl.value;
        const clienteId = selecionado?.id ?? null;

        if (!clienteId) {
            this.toastr.warning('Selecione um cliente antes de salvar.');
            return;
        }

        this.salvandoCliente = true;
        this.pedidoService.atualizar(id, { clienteId } as any).subscribe({
            next: () => {
                this.toastr.success('Cliente atualizado no pedido.');
                this.trocandoCliente = false;
                this.pedidoService.buscarPorId(id).subscribe(p => this.sincronizarPedido(p));
            },
            error: (err) => {
                console.error(err);
                this.toastr.error('Erro ao atualizar o cliente do pedido.');
            }
        }).add(() => this.salvandoCliente = false);
    }

    /** Fluxo antigo (caso ainda use o input simples de ID) */
    salvarCliente(): void {
        const id = this.pedido?.id;
        if (!id) return;

        const clienteId = this.form.get('clienteId')?.value;
        if (!clienteId) {
            this.toastr.warning('Selecione um cliente antes de salvar.');
            return;
        }

        this.salvandoCliente = true;
        this.pedidoService.atualizar(id, { clienteId } as any).subscribe({
            next: () => {
                this.toastr.success('Cliente atualizado no pedido.');
                this.pedidoService.buscarPorId(id).subscribe(p => this.sincronizarPedido(p));
            },
            error: (err) => {
                console.error(err);
                this.toastr.error('Erro ao atualizar o cliente do pedido.');
            }
        }).add(() => this.salvandoCliente = false);
    }

    get orcamentoVencido(): boolean {
        const v = this.pedido?.vencimentoOrcamento;
        if (!v) return false;
        // se vier string ISO, Date entende; se vier Date, ok também
        const hoje = new Date();
        const venc = new Date(v);
        // zera horas p/ comparar só a data
        hoje.setHours(0, 0, 0, 0);
        venc.setHours(0, 0, 0, 0);
        return venc.getTime() < hoje.getTime();
    }

    aprovarOrcamento(): void {
        if (!this.pedido?.id) return;

        if (this.orcamentoVencido) {
            this.toastr.warning('Este orçamento está vencido. Gere um novo.', 'Orçamento vencido');
            return;
        }

        this.aprovando = true;
        this.pedidoService.aprovarOrcamento(this.pedido.id).subscribe({
            next: (resp) => {
                this.pedido = resp;
                this.toastr.success('Orçamento aprovado! Pedido gerado.', 'Sucesso');
            },
            error: (err) => {
                const msg = err?.error?.message || 'Não foi possível aprovar o orçamento.';
                this.toastr.error(msg, 'Erro');
            },
            complete: () => (this.aprovando = false)
        });
    }

    confirmarAprovarOrcamento(): void {
        // Mantém compatibilidade com template: apenas delega para aprovarOrcamento
        this.aprovarOrcamento();
    }

    trocarCliente(): void {
        this.trocandoCliente = true;
        const atual = this.pedido?.cliente ?? null;
        // se quiser, pode popular o autocomplete com o atual:
        this.clienteControl.setValue(atual);
        // e também sincronizar o campo numérico (se ainda existir no template):
        this.form.get('clienteId')?.setValue(atual?.id ?? null);
    }

    abrirDialogSelecionarCliente(): void {
        this.toastr.info('Use o campo acima para buscar o cliente e clique em "Salvar cliente no pedido".');
    }

    private saveObs$(texto: string) {
        const id = this.pedido?.id;
        if (!id) return of(null);

        if ((this.pedido?.observacoes ?? '') === (texto ?? '')) return of(null);

        this.salvandoObs = true;
        this.obsOk = false;

        return this.pedidoService.atualizar(id, { observacoes: texto } as any).pipe(
            tap(() => {
                this.pedido = { ...(this.pedido as any), observacoes: texto };
                this.obsOk = true;
                setTimeout(() => this.obsOk = false, 1500);
            }),
            catchError(err => {
                this.toastr.error(err?.error?.message ?? 'Falha ao salvar observações.');
                return of(null);
            }),
            tap(() => this.salvandoObs = false)
        );
    }


    salvarObservacoes(): void {
        this.saveObs$(this.observacoesControl.value).subscribe();
    }


    onCriarCliente(): void {
        // volta para a própria tela de pedido depois de criar o cliente
        if (!this.pedido?.id) return;
        this.router.navigate(['/page/cliente/criar'], {
            queryParams: { retorno: `/page/pedido/detalhe/${this.pedido.id}` }
        });
    }

    imprimirEtiqueta(): void {
        if (!this.pedido?.id) return;
        if (!this.pedido?.cliente) {
            this.toastr.info('Defina um cliente antes de imprimir.');
        }
        window.open(`/pedido/imprimir-etiquetas/${this.pedido.id}`, '_blank');
    }

    imprimirPedidoCompleto(): void {
        if (!this.pedido?.id) return;
        if (!this.pedido?.cliente) {
            this.toastr.info('Defina um cliente antes de imprimir.');
        }
        window.open(`/pedido/imprimir/${this.pedido.id}`, '_blank');
    }

    imprimirPedidoDuasVias(): void {
        if (!this.pedido?.id) return;
        if (!this.pedido?.cliente) {
            this.toastr.info('Defina um cliente antes de imprimir.');
        }
        window.open(`/pedido/imprimir-duas-vias/${this.pedido.id}`, '_blank');
    }

    abrirWhatsApp(): void {
        if (!this.pedido?.id) return;
        if (!this.pedido?.cliente) {
            this.toastr.info('Defina um cliente antes de gerar mensagem.');
        }
        window.open(`/pedido/whatsapp/${this.pedido.id}`, '_blank');
    }


    adicionarPagamento(): void {
        const id = this.pedido?.id;
        if (!id) return;

        const valor = this.pagamentoValorControl.value;
        const forma = this.pagamentoFormaControl.value;

        if (!valor || !forma) {
            this.toastr.warning('Preencha todos os campos do pagamento.');
            return;
        }

        const novoPagamento: PagamentoRequest = { forma, valor, confirmado: true };

        this.adicionandoPagamento = true;
        this.pedidoService.adicionarPagamento(id, novoPagamento).subscribe({
            next: () => {
                this.toastr.success('Pagamento adicionado com sucesso.');
                this.pedidoService.buscarPorId(id).subscribe((pedidoAtualizado) => this.sincronizarPedido(pedidoAtualizado));
                this.pagamentoValorControl.reset();
                this.pagamentoFormaControl.reset();
            },
            error: () => this.toastr.error('Erro ao adicionar pagamento.')
        }).add(() => this.adicionandoPagamento = false);
    }

    removerPagamento(index: number): void {
        const id = this.pedido?.id;
        if (!id || !(this.pedido?.pagamentos?.length)) return;
        const pagamento = this.pedido.pagamentos[index];
        if (!pagamento?.id) return;

        this.pedidoService.removerPagamento(id, pagamento.id).subscribe({
            next: () => {
                this.toastr.success('Pagamento removido.');
                this.pedidoService.buscarPorId(id).subscribe(pedidoAtualizado => this.sincronizarPedido(pedidoAtualizado));
            },
            error: () => this.toastr.error('Erro ao remover pagamento.')
        });
    }

    onBuscarProdutos(): void {
        const id = this.pedido?.id;
        if (!id) return;

        const dialogRef = this.dialog.open(DialogAdicionarProdutoComponent, {
            panelClass: 'dialog-grande'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && Array.isArray(result)) {
                const itens: PedidoItemRequest[] = [];

                for (const p of result) {
                    const grupoKey =
                        (globalThis as any).crypto?.randomUUID?.() ?? String(Date.now() + Math.random());

                    const base: PedidoItemRequest = {
                        grupoKey,
                        tipo: ItemTipo.BASE,
                        descricao: p.nome,
                        quantidade: Number(p.quantidade ?? 1),
                        valor: Number(p.valor ?? 0),
                        subTotal: Number(p.subTotal ?? 0),
                        produtoId: p.produtoId,
                        produtoVariacaoId: p.produtoVariacaoId,
                        largura: p.largura ?? undefined,
                        altura: p.altura ?? undefined,
                    };
                    itens.push(base);

                    const servicosIds: number[] = p.servicosIds ?? [];
                    for (const sid of servicosIds) {
                        itens.push({
                            grupoKey,
                            tipo: ItemTipo.SERVICO,
                            servicoId: sid,
                            descricao: `Serviço #${sid}`,
                            quantidade: base.quantidade,
                            valor: 0,
                            subTotal: 0,
                            largura: base.largura,
                            altura: base.altura,
                        });
                    }

                    const acabamentosIds: number[] = p.acabamentosIds ?? [];
                    for (const aid of acabamentosIds) {
                        itens.push({
                            grupoKey,
                            tipo: ItemTipo.ACABAMENTO,
                            acabamentoId: aid,
                            descricao: `Acabamento #${aid}`,
                            quantidade: base.quantidade,
                            valor: 0,
                            subTotal: 0,
                            largura: base.largura,
                            altura: base.altura,
                        });
                    }
                }

                this.adicionandoItens = true;
                this.pedidoService.adicionarItens(id, itens).subscribe({
                    next: () => {
                        this.toastr.success('Itens adicionados com sucesso.');
                        this.pedidoService.buscarPorId(id).subscribe(pedidoAtualizado => {
                            this.pedido = pedidoAtualizado;
                        });
                    },
                    error: () => {
                        this.toastr.error('Erro ao adicionar itens ao pedido.');
                    }
                }).add(() => this.adicionandoItens = false);
            }
        });
    }

    iniciarTrocaStatus(): void {
        this.trocandoStatus = true;
        this.statusControl.setValue(this.pedido?.status ?? null);

        // (opcional) carregar on-demand:
        if (!this.statusOptions.length) {
            this.carregandoStatus = true;
            this.pedidoService.listarStatus().subscribe({
                next: (lista) => this.statusOptions = lista ?? [],
                error: () => this.toastr.error('Não foi possível carregar os status do pedido.')
            }).add(() => this.carregandoStatus = false);
        }
    }

    cancelarTrocaStatus(): void {
        this.trocandoStatus = false;
        this.statusControl.reset(this.pedido?.status ?? null);
    }

    salvarStatus(): void {
        const id = this.pedido?.id;
        if (!id) return;
        if (!this.flowConfig) {
            this.toastr.warning('Configuração de fluxo não carregada. Tente novamente.');
            return;
        }

        const novoStatus = this.statusControl.value;
        if (!novoStatus) {
            this.toastr.warning('Selecione um status.');
            return;
        }

        const from = this.pedido?.status || '';
        const ctx = mapPedidoToFlowContext(this.pedido);
        const validar = this.flowGuard.validateTransicao(this.flowConfig, from, novoStatus, ctx);
        if (!validar.ok) {
            this.mostrarBloqueio(validar.message || 'Transição não permitida.');
            return;
        }

        if (validar.warn) {
            const ref = this.dialog.open(ConfirmDialogComponent, {
                data: {
                    title: 'Confirmar avanço?',
                    message: validar.message || 'Deseja seguir mesmo sem atingir os critérios recomendados?'
                }
            });
            ref.afterClosed().subscribe(confirmado => {
                if (confirmado) {
                    this.persistirStatusInterno(id, novoStatus);
                }
            });
            return;
        }

        this.persistirStatusInterno(id, novoStatus);
    }


    onDescreverItens(): void {
        const pedidoId = this.pedido?.id;
        if (!pedidoId) return;

        const dialogRef = this.dialog.open(DialogDescreverItemComponent, {
            width: '520px'
        });

        dialogRef.afterClosed().subscribe((item: any) => {
            if (item?.descricao && item.quantidade && item.valorUnitario != null) {
                const quantidade = Number(item.quantidade) || 1;
                const valor = Number(item.valorUnitario) || 0;

                const grupoKey = (globalThis as any).crypto?.randomUUID?.() ?? String(Date.now());

                const novoItem: PedidoItemRequest = {
                    grupoKey,
                    tipo: ItemTipo.MANUAL,
                    descricao: item.descricao,
                    quantidade,
                    valor,
                    subTotal: valor * quantidade
                };

                this.adicionandoItens = true;
                this.pedidoService.adicionarItens(pedidoId, [novoItem]).subscribe({
                    next: () => {
                        this.toastr.success('Item adicionado ao pedido.');
                        this.pedidoService.buscarPorId(pedidoId).subscribe(pedidoAtualizado => {
                            this.pedido = pedidoAtualizado;
                        });
                    },
                    error: () => {
                        this.toastr.error('Erro ao adicionar item descrito.');
                    }
                }).add(() => this.adicionandoItens = false);
            }
        });
    }

    // getters de conveniência
    get pagamentoFormaControl(): FormControl {
        return this.form.get(['pagamento', 'forma']) as FormControl;
    }
    get pagamentoValorControl(): FormControl {
        return this.form.get(['pagamento', 'valor']) as FormControl;
    }
    get isRascunho(): boolean {
        return (this.pedido?.status ?? '') === 'RASCUNHO';
    }
    get clienteIdControl(): FormControl {
        return this.form.get('clienteId') as FormControl;
    }
    get statusControl(): FormControl {
        return this.form.get('status') as FormControl;
    }

    statusClass(status?: string): string {
        const s = (status || '').toUpperCase();
        if (s === 'ORCAMENTO') return 'status-orcamento';
        if (s === 'RASCUNHO') return 'status-rascunho';
        if (s === 'CONCLUIDO' || s === 'APROVADO' || s === 'APROVADO_PELO_CLIENTE') return 'status-aprovado';
        if (s === 'CANCELADO') return 'status-cancelado';
        return 'status-default';
    }

    get inativoCliente(): boolean {
        return !this.permissoes.cliente;
    }
    get inativoItens(): boolean {
        return !this.permissoes.itens;
    }
    get inativoObservacoes(): boolean {
        return !this.permissoes.observacoes;
    }
    get inativoStatus(): boolean {
        return !this.permissoes.status;
    }
    get inativoPagamentos(): boolean {
        const statusAtual = (this.pedido?.status || '').toUpperCase();
        const entregaQuitada = statusAtual === 'ENTREGUE' && this.restaPagar <= 0;
        return !this.permissoes.pagamentos || entregaQuitada;
    }
    get inativoResumo(): boolean {
        return this.inativoCliente && this.inativoItens && this.inativoObservacoes && this.inativoStatus;
    }

    get totalPago(): number {
        return this.pedido?.valorTotalPago ?? 0;
    }

    get restaPagar(): number {
        return this.pedido?.restaPagar ?? 0;
    }

    get pagamentoForm(): FormGroup {
        return this.form.get('pagamento') as FormGroup;
    }

    scrollParaPagamentosEExpandir(): void {
        this.expandirPagamentos = true;
        setTimeout(() => {
            const el = document.getElementById('pagamentos-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }

    confirmarProducaoSemPagamento(): void {
        const id = this.pedido?.id;
        if (!id) return;
        const ref = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Enviar para produção sem pagamento?',
                message: 'Nenhum pagamento foi registrado. Deseja iniciar a produção assim mesmo?'
            }
        });
        ref.afterClosed().subscribe(confirmado => {
            if (confirmado) {
                this.persistirStatus(id, 'EM_PRODUCAO');
            } else {
                // direciona para área de pagamentos caso o usuário prefira registrar antes
                this.scrollParaPagamentosEExpandir();
            }
        });
    }

    confirmarCancelarPedido(): void {
        const id = this.pedido?.id;
        if (!id) return;
        const cfgCancel = this.flowConfig?.status.find(s => s.key.toUpperCase() === 'CANCELADO');
        const haPagamentos = (this.pedido?.pagamentos?.length || 0) > 0;
        const deveLimpar = cfgCancel?.limparPagamentosAoCancelar === true;

        const ref = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Cancelar pedido?',
                message: deveLimpar && haPagamentos
                    ? 'Ao cancelar, os pagamentos serão removidos. Deseja continuar?'
                    : 'Após cancelar, o pedido fica apenas para leitura. Deseja continuar?'
            }
        });
        ref.afterClosed().subscribe(confirmado => {
            if (confirmado) {
                if (deveLimpar && haPagamentos) {
                    this.removerTodosPagamentosAntesDeCancelar(id);
                } else {
                    this.persistirStatus(id, 'CANCELADO');
                }
            }
        });
    }

    confirmarFinalizarPedido(): void {
        const id = this.pedido?.id;
        if (!id) return;
        const precisaConfirmarPagamento = (this.restaPagar ?? 0) > 0;
        const ref = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Marcar como pronto?',
                message: precisaConfirmarPagamento
                    ? 'Ainda existe pagamento pendente. Deseja marcar como pronto assim mesmo?'
                    : 'Marcar como pronto finalizará a produção.'
            }
        });
        ref.afterClosed().subscribe(confirmado => {
            if (confirmado) {
                this.persistirStatus(id, 'PRONTO');
            }
        });
    }

    confirmarPedido(): void {
        const id = this.pedido?.id;
        if (!id) return;
        this.persistirStatus(id, 'PENDENTE');
    }

    onSolicitarMudancaStatus(novoStatus: string): void {
        const from = this.pedido?.status;
        if (!from || !novoStatus) return;
        const ctx = mapPedidoToFlowContext(this.pedido);
        const validar = this.flowGuard.validateTransicao(this.flowConfig, from, novoStatus, ctx);
        if (!validar.ok) {
            this.mostrarBloqueio(validar.message || 'Transição não permitida.');
            return;
        }
        if (validar.warn && validar.message) {
            const ref = this.dialog.open(ConfirmDialogComponent, {
                data: {
                    title: 'Confirmar avanço?',
                    message: validar.message
                }
            });
            ref.afterClosed().subscribe(confirmado => {
                if (confirmado) {
                    this.persistirStatus(this.pedido!.id, novoStatus);
                }
            });
            return;
        }
        // confirmações específicas
        if (novoStatus === 'CANCELADO') {
            this.confirmarCancelarPedido();
            return;
        }
        if (novoStatus === 'PRONTO') {
            this.confirmarFinalizarPedido();
            return;
        }
        const id = this.pedido?.id;
        if (!id) return;
        this.persistirStatus(id, novoStatus);
    }

    private atualizarPermissoesETransicoes(): void {
        if (!this.pedido || !this.flowConfig) return;
        this.permissoes = this.flowGuard.getPermissoes(this.flowConfig, this.pedido.status);
        const ctx = mapPedidoToFlowContext(this.pedido);
        const internoBloqueado = (this.pedido.status || '').toUpperCase() === 'ORCAMENTO'
          && ['VENCIDO', 'CANCELADO'].includes((ctx.orcamentoStatus || '').toUpperCase());
        if (internoBloqueado) {
            this.permissoes = { cliente: false, itens: false, observacoes: false, pagamentos: false, status: false };
        }
        this.transicoesUI = this.flowGuard.getTransicoes(this.flowConfig, this.pedido.status, ctx);
        this.statusOptions = this.transicoesUI.filter(t => !t.bloqueado).map(t => t.status);
        const hints: string[] = [];
        if (!ctx.clienteId) hints.push('Defina o cliente');
        if ((ctx.itensCount || 0) === 0) hints.push('Adicione itens');
        if ((ctx.restaPagar || 0) > 0) hints.push('Pagamento pendente');
        this.flowHints = hints;
    }

    mudarStatusDireto(status: string): void {
        const id = this.pedido?.id;
        if (!id) return;
        if (!this.flowConfig) {
            this.toastr.warning('Configuração de fluxo não carregada. Tente novamente.');
            return;
        }
        this.persistirStatus(id, status);
    }

    removerItemPedido(index: number): void {
        const status = (this.pedido?.status || '').toUpperCase();
        if (!['RASCUNHO', 'PENDENTE', 'ORCAMENTO'].includes(status)) return;
        const id = this.pedido?.id;
        if (!id || !this.pedido?.itens?.length) return;
        const itensAtualizados = [...this.pedido.itens];
        if (index < 0 || index >= itensAtualizados.length) return;
        itensAtualizados.splice(index, 1);

        const payload: any = {
            clienteId: this.pedido.cliente?.id ?? null,
            responsavelId: this.pedido.responsavel?.id ?? null,
            itens: itensAtualizados,
            acrescimo: this.pedido.acrescimo ?? 0,
            frete: this.pedido.frete ?? 0,
            desconto: this.pedido.desconto ?? 0,
            observacoes: this.pedido.observacoes ?? ''
        };

        this.adicionandoItens = true;
        this.pedidoService.atualizar(id, payload).subscribe({
            next: () => {
                this.toastr.success('Item removido do rascunho.');
                this.pedidoService.buscarPorId(id).subscribe(p => this.pedido = p);
            },
            error: (err) => {
                console.error(err);
                this.toastr.error('Não foi possível remover o item.');
            }
        }).add(() => this.adicionandoItens = false);
    }

    private persistirStatus(id: number, novoStatus: string) {
        if (!this.flowConfig) {
            this.toastr.warning('Configuração de fluxo não carregada. Tente novamente.');
            return;
        }
        const from = this.pedido?.status || '';
        const ctx = mapPedidoToFlowContext(this.pedido);
        const validar = this.flowGuard.validateTransicao(this.flowConfig, from, novoStatus, ctx);
        if (!validar.ok) {
            this.mostrarBloqueio(validar.message || 'Transição não permitida.');
            return;
        }
        if (validar.warn) {
            const ref = this.dialog.open(ConfirmDialogComponent, {
                data: {
                    title: 'Confirmar avanço?',
                    message: validar.message || 'Deseja seguir mesmo sem atingir os critérios recomendados?'
                }
            });
            ref.afterClosed().subscribe(confirmado => {
                if (confirmado) {
                    this.persistirStatusInterno(id, novoStatus);
                }
            });
            return;
        }
        this.persistirStatusInterno(id, novoStatus);
    }

    private persistirStatusInterno(id: number, novoStatus: string) {
        this.carregandoStatus = true;
        this.pedidoService.atualizarStatus(id, novoStatus).subscribe({
            next: (pedidoAtualizado) => {
                this.toastr.success('Status atualizado.');
                this.sincronizarPedido(pedidoAtualizado);
                this.trocandoStatus = false;
            },
            error: (err) => {
                console.error(err);
                this.toastr.error(err?.error?.message ?? 'Erro ao atualizar o status.');
            }
        }).add(() => this.carregandoStatus = false);
    }

    private removerTodosPagamentosAntesDeCancelar(id: number): void {
        const pagamentos = this.pedido?.pagamentos || [];
        if (!pagamentos.length) {
            this.persistirStatus(id, 'CANCELADO');
            return;
        }
        this.carregandoStatus = true;
        // remove em sequência simples
        const removerSequencial = (idx: number) => {
            if (idx >= pagamentos.length) {
                this.persistirStatus(id, 'CANCELADO');
                return;
            }
            const pg = pagamentos[idx];
            if (!pg?.id) {
                removerSequencial(idx + 1);
                return;
            }
            this.pedidoService.removerPagamento(id, pg.id).subscribe({
                next: () => removerSequencial(idx + 1),
                error: () => {
                    this.toastr.error('Erro ao remover pagamentos antes de cancelar.');
                    this.carregandoStatus = false;
                }
            });
        };
        removerSequencial(0);
    }

    private mostrarBloqueio(message: string): void {
        this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Ação não permitida',
                message
            }
        });
    }

    /**
     * Sincroniza o estado interno após buscar ou atualizar o pedido.
     */
    private sincronizarPedido(pedidoAtualizado: PedidoResponse): void {
        this.pedido = pedidoAtualizado;

        this.form.get('clienteId')?.setValue(this.pedido?.cliente?.id ?? null, { emitEvent: false });
        this.form.get('status')?.setValue(this.pedido?.status ?? null, { emitEvent: false });

        this.observacoesControl.setValue(this.pedido?.observacoes ?? '', { emitEvent: false });

        this.obsSub?.unsubscribe();
        this.obsSub = this.observacoesControl.valueChanges.pipe(
            debounceTime(800),
            distinctUntilChanged(),
            switchMap(texto => this.saveObs$(texto ?? ''))
        ).subscribe();

        this.atualizarPermissoesETransicoes();
    }
}
