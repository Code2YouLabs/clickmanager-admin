import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr.service';
import { finalize } from 'rxjs/operators';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { MaterialModule } from 'src/app/material.module';
import { AdminEmpresaResumo } from '../empresas/models/admin-empresa.model';
import { AdminEmpresasService } from '../empresas/services/admin-empresas.service';
import { AdminPlanoResponse } from '../planos/models/admin-plano.model';
import { AdminPlanosService } from '../planos/services/admin-planos.service';
import {
  AdminAplicacaoBeneficioCobrancaResponse,
  AdminAplicarBeneficioCobrancaEmpresaRequest,
  AdminBeneficioCobrancaResponse,
  AdminSalvarBeneficioCobrancaRequest,
  TipoBeneficioCobranca
} from './models/admin-cobranca-beneficio.model';
import { AdminCobrancaBeneficiosService } from './services/admin-cobranca-beneficios.service';

interface BeneficioFormModel {
  codigo: string;
  nome: string;
  descricao: string;
  planoId: number | null;
  tipo: TipoBeneficioCobranca;
  valorDescontoCentavos: number | null;
  percentualDesconto: number | null;
  ativo: boolean;
  validadeInicio: string;
  validadeFim: string;
}

@Component({
  selector: 'app-cobranca-beneficios-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DesignSystemIconsModule, MaterialModule],
  templateUrl: './cobranca-beneficios-admin.component.html',
  styleUrl: './cobranca-beneficios-admin.component.scss'
})
export class CobrancaBeneficiosAdminComponent implements OnInit {
  readonly tipoOptions: TipoBeneficioCobranca[] = ['DESCONTO_PERCENTUAL', 'DESCONTO_VALOR_FIXO', 'ISENCAO'];

  carregandoBeneficios = false;
  carregandoDetalhe = false;
  salvandoBeneficio = false;
  atualizandoAtivo = false;
  buscandoEmpresas = false;
  aplicandoBeneficio = false;
  carregandoAplicacoes = false;
  carregandoPlanos = false;
  removendoAplicacaoId: number | null = null;

  beneficios: AdminBeneficioCobrancaResponse[] = [];
  beneficioSelecionado: AdminBeneficioCobrancaResponse | null = null;
  modoCriacao = false;
  planos: AdminPlanoResponse[] = [];

  form: BeneficioFormModel = this.criarFormPadrao();

  buscaEmpresa = '';
  empresasEncontradas: AdminEmpresaResumo[] = [];
  empresaSelecionada: AdminEmpresaResumo | null = null;
  aplicadoPorNome = '';
  observacaoAplicacao = '';
  aplicacoesEmpresa: AdminAplicacaoBeneficioCobrancaResponse[] = [];

  constructor(
    private readonly cobrancaBeneficiosService: AdminCobrancaBeneficiosService,
    private readonly empresasService: AdminEmpresasService,
    private readonly planosService: AdminPlanosService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.carregarPlanos();
    this.carregarBeneficios(true);
  }

  novoBeneficio(): void {
    this.modoCriacao = true;
    this.beneficioSelecionado = null;
    this.form = this.criarFormPadrao();
  }

  selecionarBeneficio(beneficio: AdminBeneficioCobrancaResponse): void {
    this.modoCriacao = false;
    this.carregarDetalhe(beneficio.id);
  }

  selecionarBeneficioPorId(beneficioId: number | null): void {
    if (!beneficioId) {
      this.beneficioSelecionado = null;
      return;
    }

    const beneficio = this.beneficios.find((item) => item.id === beneficioId);
    if (beneficio) {
      this.selecionarBeneficio(beneficio);
    }
  }

  recarregarBeneficios(): void {
    this.carregarBeneficios(true, this.beneficioSelecionado?.id ?? null);
  }

  salvarBeneficio(): void {
    if (this.salvandoBeneficio) {
      return;
    }

    const payload = this.montarPayload();
    if (!payload) {
      return;
    }

    this.salvandoBeneficio = true;

    const request$ = this.modoCriacao
      ? this.cobrancaBeneficiosService.criar$(payload)
      : this.cobrancaBeneficiosService.atualizar$(this.beneficioSelecionado!.id, payload);

    request$
      .pipe(finalize(() => (this.salvandoBeneficio = false)))
      .subscribe({
        next: (beneficio) => {
          const id = beneficio?.id ?? this.beneficioSelecionado?.id ?? null;
          this.toastr.success(this.modoCriacao ? 'Benefício criado com sucesso.' : 'Benefício atualizado com sucesso.');
          this.modoCriacao = false;
          this.carregarBeneficios(true, id);
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível salvar o benefício.');
        }
      });
  }

  alternarAtivo(): void {
    if (!this.beneficioSelecionado?.id || this.atualizandoAtivo) {
      return;
    }

    const proximoAtivo = !this.beneficioSelecionado.ativo;
    this.atualizandoAtivo = true;

    this.cobrancaBeneficiosService.atualizarAtivo$(this.beneficioSelecionado.id, proximoAtivo)
      .pipe(finalize(() => (this.atualizandoAtivo = false)))
      .subscribe({
        next: (beneficio) => {
          if (beneficio) {
            this.aplicarBeneficioLocal(beneficio);
          } else {
            this.carregarBeneficios(true, this.beneficioSelecionado!.id);
          }
          this.toastr.success(proximoAtivo ? 'Benefício ativado.' : 'Benefício desativado.');
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível atualizar o status do benefício.');
        }
      });
  }

  cancelarEdicao(): void {
    if (this.beneficioSelecionado) {
      this.modoCriacao = false;
      this.sincronizarForm(this.beneficioSelecionado);
      return;
    }

    this.novoBeneficio();
  }

  onTipoChange(): void {
    if (this.form.tipo === 'ISENCAO') {
      this.form.valorDescontoCentavos = null;
      this.form.percentualDesconto = null;
    }

    if (this.form.tipo === 'DESCONTO_PERCENTUAL') {
      this.form.valorDescontoCentavos = null;
    }

    if (this.form.tipo === 'DESCONTO_VALOR_FIXO') {
      this.form.percentualDesconto = null;
    }
  }

  buscarEmpresas(): void {
    this.buscandoEmpresas = true;

    this.empresasService.listar$({
      busca: this.buscaEmpresa || null,
      pagina: 0,
      tamanho: 8
    })
      .pipe(finalize(() => (this.buscandoEmpresas = false)))
      .subscribe({
        next: (res) => {
          this.empresasEncontradas = res.itens || [];
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível buscar empresas.');
        }
      });
  }

  selecionarEmpresa(empresa: AdminEmpresaResumo): void {
    this.empresaSelecionada = empresa;
    this.buscaEmpresa = empresa.nome;
    this.carregarAplicacoesEmpresa(empresa.id);
  }

  aplicarBeneficio(): void {
    if (!this.beneficioSelecionado?.id || !this.empresaSelecionada?.id || this.aplicandoBeneficio) {
      return;
    }

    if (!this.beneficioSelecionado.ativo) {
      this.toastr.error('Ative o benefício antes de aplicá-lo em uma empresa.');
      return;
    }

    const payload: AdminAplicarBeneficioCobrancaEmpresaRequest = {
      empresaId: this.empresaSelecionada.id,
      aplicadoPorNome: this.aplicadoPorNome.trim() || null,
      observacao: this.observacaoAplicacao.trim() || null
    };

    this.aplicandoBeneficio = true;
    this.cobrancaBeneficiosService.aplicarEmEmpresa$(this.beneficioSelecionado.id, payload)
      .pipe(finalize(() => (this.aplicandoBeneficio = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Benefício aplicado na empresa.');
          this.observacaoAplicacao = '';
          this.carregarAplicacoesEmpresa(this.empresaSelecionada!.id);
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível aplicar o benefício.');
        }
      });
  }

  get totalBeneficios(): number {
    return this.beneficios.length;
  }

  get beneficiosAtivos(): number {
    return this.beneficios.filter((item) => item.ativo).length;
  }

  get descontosPercentuais(): number {
    return this.beneficios.filter((item) => item.tipo === 'DESCONTO_PERCENTUAL').length;
  }

  get isencoes(): number {
    return this.beneficios.filter((item) => item.tipo === 'ISENCAO').length;
  }

  get planoSelecionadoLabel(): string {
    if (this.form.planoId == null) {
      return 'Todos os planos';
    }

    return this.nomePlano(this.form.planoId, this.beneficioSelecionado?.planoNome || null);
  }

  get resumoCupomSelecionado(): string {
    if (!this.beneficioSelecionado) {
      return 'Escolha um cupom disponível para aplicar na empresa.';
    }

    return `${this.resumoValor(this.beneficioSelecionado)} · ${this.nomePlano(
      this.beneficioSelecionado.planoId,
      this.beneficioSelecionado.planoNome
    )}`;
  }

  get descricaoCupomSelecionado(): string {
    if (!this.beneficioSelecionado) {
      return 'Nenhum cupom selecionado';
    }

    return this.beneficioSelecionado.descricao?.trim() || 'Sem descrição resumida';
  }

  get resumoEmpresaSelecionada(): string {
    if (!this.empresaSelecionada) {
      return 'Nenhuma empresa selecionada';
    }

    return `${this.empresaSelecionada.plano} · ${this.empresaSelecionada.cidade}`;
  }

  get detalheEmpresaSelecionada(): string {
    if (!this.empresaSelecionada) {
      return 'Selecione uma empresa para revisar a aplicação.';
    }

    return this.empresaSelecionada.responsavelNome?.trim()
      ? `Responsável: ${this.empresaSelecionada.responsavelNome}`
      : `Status: ${this.statusEmpresaLabel(this.empresaSelecionada.status)}`;
  }

  get podeAplicarBeneficioSelecionado(): boolean {
    return !!this.beneficioSelecionado && !!this.empresaSelecionada && !this.aplicandoBeneficio;
  }

  get avisoSubstituicao(): string {
    return 'Ao aplicar este benefício, qualquer aplicação pendente ou ativa desta empresa poderá ser substituída.';
  }

  tipoLabel(tipo: TipoBeneficioCobranca): string {
    return {
      DESCONTO_PERCENTUAL: 'Desconto percentual',
      DESCONTO_VALOR_FIXO: 'Desconto fixo',
      ISENCAO: 'Isenção'
    }[tipo];
  }

  tipoClass(tipo: TipoBeneficioCobranca): string {
    return `tipo-${tipo.toLowerCase()}`;
  }

  statusClass(ativo: boolean): string {
    return ativo ? 'status-ativo' : 'status-inativo';
  }

  statusEmpresaLabel(status: AdminEmpresaResumo['status']): string {
    return {
      ATIVA: 'Ativa',
      ONBOARDING: 'Onboarding',
      BAIXA_ATIVIDADE: 'Baixa atividade'
    }[status];
  }

  resumoValor(beneficio: AdminBeneficioCobrancaResponse): string {
    if (beneficio.tipo === 'DESCONTO_PERCENTUAL') {
      return `${beneficio.percentualDesconto || 0}%`;
    }

    if (beneficio.tipo === 'DESCONTO_VALOR_FIXO') {
      return this.formatarMoeda(beneficio.valorDescontoCentavos || 0);
    }

    return '100% do valor';
  }

  nomePlano(planoId?: number | null, fallback?: string | null): string {
    if (planoId == null) {
      return 'Todos os planos';
    }

    return this.planos.find((item) => item.id === planoId)?.nome || fallback || `Plano #${planoId}`;
  }

  formatarMoeda(centavos: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format((centavos || 0) / 100);
  }

  dataRelativa(iso?: string | null): string {
    if (!iso) {
      return 'Sem data';
    }

    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'Agora';
    if (min < 60) return `${min} min atrás`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h atrás`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} dia(s) atrás`;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  aplicacaoStatus(aplicacao: AdminAplicacaoBeneficioCobrancaResponse): string {
    if (aplicacao.utilizadoEm) {
      return 'Utilizado';
    }

    return aplicacao.ativo ? 'Ativo' : 'Encerrado';
  }

  aplicacaoStatusClass(aplicacao: AdminAplicacaoBeneficioCobrancaResponse): string {
    if (aplicacao.utilizadoEm) {
      return 'status-utilizado';
    }

    return aplicacao.ativo ? 'status-ativo' : 'status-inativo';
  }

  aplicacaoPlanoLabel(aplicacao: AdminAplicacaoBeneficioCobrancaResponse): string {
    if (aplicacao.todosOsPlanos || aplicacao.planoId == null) {
      return 'Todos os planos';
    }

    return this.nomePlano(aplicacao.planoId, aplicacao.planoNome);
  }

  podeRemoverAplicacao(aplicacao: AdminAplicacaoBeneficioCobrancaResponse): boolean {
    return aplicacao.ativo && !aplicacao.utilizadoEm;
  }

  removerAplicacao(aplicacao: AdminAplicacaoBeneficioCobrancaResponse): void {
    if (!this.podeRemoverAplicacao(aplicacao) || this.removendoAplicacaoId === aplicacao.id) {
      return;
    }

    this.removendoAplicacaoId = aplicacao.id;
    this.cobrancaBeneficiosService.removerAplicacao$(aplicacao.id)
      .pipe(finalize(() => (this.removendoAplicacaoId = null)))
      .subscribe({
        next: () => {
          this.aplicacoesEmpresa = this.aplicacoesEmpresa.map((item) =>
            item.id === aplicacao.id ? { ...item, ativo: false } : item
          );
          this.toastr.success('Cupom removido da empresa.');
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível remover o cupom da empresa.');
        }
      });
  }

  private carregarBeneficios(resolverSelecao = false, beneficioId: number | null = null): void {
    this.carregandoBeneficios = true;

    this.cobrancaBeneficiosService.listar$()
      .pipe(finalize(() => (this.carregandoBeneficios = false)))
      .subscribe({
        next: (beneficios) => {
          this.beneficios = [...(beneficios || [])].sort((a, b) => a.nome.localeCompare(b.nome));
          if (resolverSelecao) {
            this.resolverSelecao(beneficioId);
          }
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar os benefícios.');
        }
      });
  }

  private carregarPlanos(): void {
    this.carregandoPlanos = true;

    this.planosService.listar$()
      .pipe(finalize(() => (this.carregandoPlanos = false)))
      .subscribe({
        next: (planos) => {
          this.planos = [...(planos || [])].sort((a, b) => a.nome.localeCompare(b.nome));
        },
        error: (err) => {
          this.toastr.warning(err?.userMessage || 'Não foi possível carregar os planos para vincular o cupom.');
        }
      });
  }

  private resolverSelecao(beneficioId: number | null): void {
    if (this.modoCriacao) {
      return;
    }

    const idSelecionado = beneficioId && this.beneficios.some((item) => item.id === beneficioId)
      ? beneficioId
      : this.beneficios[0]?.id;

    if (idSelecionado) {
      this.carregarDetalhe(idSelecionado);
    } else {
      this.beneficioSelecionado = null;
      this.form = this.criarFormPadrao();
    }
  }

  private carregarDetalhe(id: number): void {
    this.carregandoDetalhe = true;

    this.cobrancaBeneficiosService.buscarPorId$(id)
      .pipe(finalize(() => (this.carregandoDetalhe = false)))
      .subscribe({
        next: (beneficio) => {
          this.aplicarBeneficioLocal(beneficio);
          this.modoCriacao = false;
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar o detalhe do benefício.');
        }
      });
  }

  private carregarAplicacoesEmpresa(empresaId: number): void {
    this.carregandoAplicacoes = true;

    this.cobrancaBeneficiosService.listarAplicacoesEmpresa$(empresaId)
      .pipe(finalize(() => (this.carregandoAplicacoes = false)))
      .subscribe({
        next: (aplicacoes) => {
          this.aplicacoesEmpresa = aplicacoes || [];
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar o histórico da empresa.');
        }
      });
  }

  private aplicarBeneficioLocal(beneficio: AdminBeneficioCobrancaResponse): void {
    this.beneficioSelecionado = beneficio;
    this.sincronizarForm(beneficio);
    this.beneficios = this.beneficios.map((item) => item.id === beneficio.id ? beneficio : item);
  }

  private sincronizarForm(beneficio: AdminBeneficioCobrancaResponse): void {
    this.form = {
      codigo: beneficio.codigo,
      nome: beneficio.nome,
      descricao: beneficio.descricao || '',
      planoId: beneficio.planoId ?? null,
      tipo: beneficio.tipo,
      valorDescontoCentavos: beneficio.valorDescontoCentavos,
      percentualDesconto: beneficio.percentualDesconto,
      ativo: beneficio.ativo,
      validadeInicio: beneficio.validadeInicio || '',
      validadeFim: beneficio.validadeFim || ''
    };
  }

  private montarPayload(): AdminSalvarBeneficioCobrancaRequest | null {
    const codigo = this.form.codigo.trim();
    const nome = this.form.nome.trim();

    if (!codigo || !nome) {
      this.toastr.error('Código e nome são obrigatórios.');
      return null;
    }

    if (this.form.tipo === 'DESCONTO_PERCENTUAL' && (!this.form.percentualDesconto || this.form.percentualDesconto <= 0)) {
      this.toastr.error('Informe um percentual de desconto válido.');
      return null;
    }

    if (this.form.tipo === 'DESCONTO_VALOR_FIXO' && (!this.form.valorDescontoCentavos || this.form.valorDescontoCentavos <= 0)) {
      this.toastr.error('Informe um valor fixo de desconto válido em centavos.');
      return null;
    }

    return {
      codigo,
      nome,
      descricao: this.form.descricao.trim() || null,
      planoId: this.form.planoId ?? null,
      tipo: this.form.tipo,
      valorDescontoCentavos: this.form.tipo === 'DESCONTO_VALOR_FIXO'
        ? Number(this.form.valorDescontoCentavos || 0)
        : null,
      percentualDesconto: this.form.tipo === 'DESCONTO_PERCENTUAL'
        ? Number(this.form.percentualDesconto || 0)
        : null,
      ativo: this.form.ativo,
      validadeInicio: this.form.validadeInicio || null,
      validadeFim: this.form.validadeFim || null
    };
  }

  private criarFormPadrao(): BeneficioFormModel {
    return {
      codigo: '',
      nome: '',
      descricao: '',
      planoId: null,
      tipo: 'DESCONTO_PERCENTUAL',
      valorDescontoCentavos: null,
      percentualDesconto: 10,
      ativo: true,
      validadeInicio: '',
      validadeFim: ''
    };
  }
}
