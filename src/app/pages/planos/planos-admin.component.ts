import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr.service';
import { finalize } from 'rxjs/operators';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { MaterialModule } from 'src/app/material.module';
import {
  AdminPlanoPeriodicidade,
  AdminPlanoResponse,
  AdminSalvarPlanoRequest
} from './models/admin-plano.model';
import { AdminPlanosService } from './services/admin-planos.service';

interface PlanoFormModel {
  codigo: string;
  nome: string;
  descricao: string;
  periodicidade: AdminPlanoPeriodicidade;
  precoCentavos: number;
  moeda: string;
  ativo: boolean;
  ordemExibicao: number | null;
  limitesJson: string;
  beneficiosJson: string;
  vantagem: string;
  destaque: string;
  mercadoPagoPlanId: string;
}

@Component({
  selector: 'app-planos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DesignSystemIconsModule, MaterialModule],
  templateUrl: './planos-admin.component.html',
  styleUrl: './planos-admin.component.scss'
})
export class PlanosAdminComponent implements OnInit {
  readonly periodicidadeOptions: AdminPlanoPeriodicidade[] = ['MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL'];

  carregandoLista = false;
  carregandoDetalhe = false;
  salvandoPlano = false;
  atualizandoAtivo = false;

  planos: AdminPlanoResponse[] = [];
  planoSelecionado: AdminPlanoResponse | null = null;
  modoCriacao = false;

  form: PlanoFormModel = this.criarFormPadrao();

  constructor(
    private readonly planosService: AdminPlanosService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.carregarPlanos(true);
  }

  novoPlano(): void {
    this.modoCriacao = true;
    this.planoSelecionado = null;
    this.form = this.criarFormPadrao();
  }

  selecionarPlano(plano: AdminPlanoResponse): void {
    this.modoCriacao = false;
    this.carregarDetalhe(plano.id);
  }

  recarregar(): void {
    this.carregarPlanos(true, this.planoSelecionado?.id ?? null);
  }

  salvar(): void {
    if (this.salvandoPlano) {
      return;
    }

    const payload = this.montarPayload();
    if (!payload) {
      return;
    }

    this.salvandoPlano = true;

    const request$ = this.modoCriacao
      ? this.planosService.criar$(payload)
      : this.planosService.atualizar$(this.planoSelecionado!.id, payload);

    request$
      .pipe(finalize(() => (this.salvandoPlano = false)))
      .subscribe({
        next: (plano) => {
          const id = plano?.id ?? this.planoSelecionado?.id ?? null;
          this.toastr.success(this.modoCriacao ? 'Plano criado com sucesso.' : 'Plano atualizado com sucesso.');
          this.modoCriacao = false;
          this.carregarPlanos(true, id);
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível salvar o plano.');
        }
      });
  }

  alternarAtivo(): void {
    if (!this.planoSelecionado?.id || this.atualizandoAtivo) {
      return;
    }

    const proximoAtivo = !this.planoSelecionado.ativo;
    this.atualizandoAtivo = true;

    this.planosService.atualizarAtivo$(this.planoSelecionado.id, proximoAtivo)
      .pipe(finalize(() => (this.atualizandoAtivo = false)))
      .subscribe({
        next: (plano) => {
          if (plano) {
            this.aplicarPlano(plano);
          } else {
            this.carregarPlanos(true, this.planoSelecionado!.id);
          }
          this.toastr.success(proximoAtivo ? 'Plano ativado.' : 'Plano desativado.');
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível atualizar o status do plano.');
        }
      });
  }

  cancelarEdicao(): void {
    if (this.planoSelecionado?.id) {
      this.modoCriacao = false;
      this.sincronizarForm(this.planoSelecionado);
      return;
    }

    this.novoPlano();
  }

  get totalPlanos(): number {
    return this.planos.length;
  }

  get planosAtivos(): number {
    return this.planos.filter((item) => item.ativo).length;
  }

  get planosInativos(): number {
    return this.planos.filter((item) => !item.ativo).length;
  }

  get planosIntegrados(): number {
    return this.planos.filter((item) => !!item.mercadoPagoPlanId).length;
  }

  get beneficiosPreview(): string[] {
    const raw = this.form.beneficiosJson.trim();
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch {
      return [];
    }
  }

  get limitesPreview(): string {
    const raw = this.form.limitesJson.trim();
    if (!raw) {
      return '';
    }

    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }

  periodicidadeLabel(periodicidade: AdminPlanoPeriodicidade): string {
    return {
      MENSAL: 'Mensal',
      TRIMESTRAL: 'Trimestral',
      SEMESTRAL: 'Semestral',
      ANUAL: 'Anual'
    }[periodicidade];
  }

  formatarMoeda(centavos: number, moeda = 'BRL'): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: moeda || 'BRL'
    }).format((centavos || 0) / 100);
  }

  statusClass(ativo: boolean): string {
    return ativo ? 'status-ativo' : 'status-inativo';
  }

  private carregarPlanos(resolverSelecao = false, planoId: number | null = null): void {
    this.carregandoLista = true;

    this.planosService.listar$()
      .pipe(finalize(() => (this.carregandoLista = false)))
      .subscribe({
        next: (planos) => {
          this.planos = [...(planos || [])].sort((a, b) => {
            const ordemA = a.ordemExibicao ?? Number.MAX_SAFE_INTEGER;
            const ordemB = b.ordemExibicao ?? Number.MAX_SAFE_INTEGER;
            if (ordemA !== ordemB) {
              return ordemA - ordemB;
            }
            return a.nome.localeCompare(b.nome);
          });

          if (resolverSelecao) {
            this.resolverSelecao(planoId);
          }
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar os planos.');
        }
      });
  }

  private resolverSelecao(planoId: number | null): void {
    if (this.modoCriacao) {
      return;
    }

    const idSelecionado = planoId && this.planos.some((item) => item.id === planoId)
      ? planoId
      : this.planos[0]?.id;

    if (idSelecionado) {
      this.carregarDetalhe(idSelecionado);
    } else {
      this.planoSelecionado = null;
      this.form = this.criarFormPadrao();
    }
  }

  private carregarDetalhe(id: number): void {
    this.carregandoDetalhe = true;

    this.planosService.buscarPorId$(id)
      .pipe(finalize(() => (this.carregandoDetalhe = false)))
      .subscribe({
        next: (plano) => {
          this.aplicarPlano(plano);
          this.modoCriacao = false;
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar o detalhe do plano.');
        }
      });
  }

  private aplicarPlano(plano: AdminPlanoResponse): void {
    this.planoSelecionado = plano;
    this.sincronizarForm(plano);
    this.planos = this.planos.map((item) => item.id === plano.id ? plano : item);
  }

  private sincronizarForm(plano: AdminPlanoResponse): void {
    this.form = {
      codigo: plano.codigo,
      nome: plano.nome,
      descricao: plano.descricao || '',
      periodicidade: plano.periodicidade,
      precoCentavos: plano.precoCentavos,
      moeda: plano.moeda || 'BRL',
      ativo: plano.ativo,
      ordemExibicao: plano.ordemExibicao,
      limitesJson: plano.limitesJson || '',
      beneficiosJson: plano.beneficiosJson || '',
      vantagem: plano.vantagem || '',
      destaque: plano.destaque || '',
      mercadoPagoPlanId: plano.mercadoPagoPlanId || ''
    };
  }

  private montarPayload(): AdminSalvarPlanoRequest | null {
    const codigo = this.form.codigo.trim();
    const nome = this.form.nome.trim();
    const ordemExibicao = this.form.ordemExibicao;

    if (!codigo || !nome) {
      this.toastr.error('Código e nome são obrigatórios.');
      return null;
    }

    if (!this.validarJsonOpcional(this.form.limitesJson, 'Limites JSON')) {
      return null;
    }

    if (!this.validarJsonOpcional(this.form.beneficiosJson, 'Benefícios JSON')) {
      return null;
    }

    return {
      codigo,
      nome,
      descricao: this.form.descricao.trim() || null,
      periodicidade: this.form.periodicidade,
      precoCentavos: Number(this.form.precoCentavos || 0),
      moeda: (this.form.moeda.trim() || 'BRL').toUpperCase(),
      ativo: this.form.ativo,
      ordemExibicao: ordemExibicao == null || Number.isNaN(Number(ordemExibicao))
        ? null
        : Number(ordemExibicao),
      limitesJson: this.form.limitesJson.trim() || null,
      beneficiosJson: this.form.beneficiosJson.trim() || null,
      vantagem: this.form.vantagem.trim() || null,
      destaque: this.form.destaque.trim() || null,
      mercadoPagoPlanId: this.form.mercadoPagoPlanId.trim() || null
    };
  }

  private validarJsonOpcional(raw: string, label: string): boolean {
    const valor = raw.trim();
    if (!valor) {
      return true;
    }

    try {
      JSON.parse(valor);
      return true;
    } catch {
      this.toastr.error(`${label} precisa ser um JSON válido.`);
      return false;
    }
  }

  private criarFormPadrao(): PlanoFormModel {
    return {
      codigo: '',
      nome: '',
      descricao: '',
      periodicidade: 'MENSAL',
      precoCentavos: 0,
      moeda: 'BRL',
      ativo: true,
      ordemExibicao: null,
      limitesJson: '{\n  "usuarios": 10\n}',
      beneficiosJson: '[\n  "Suporte prioritário"\n]',
      vantagem: '',
      destaque: '',
      mercadoPagoPlanId: ''
    };
  }
}
