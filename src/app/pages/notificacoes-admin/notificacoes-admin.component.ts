import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { ToastrService } from 'src/app/services/toastr.service';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { MaterialModule } from 'src/app/material.module';
import { AdminEmpresaResumo } from '../empresas/models/admin-empresa.model';
import { AdminEmpresasService } from '../empresas/services/admin-empresas.service';
import {
  AdminCriarNotificacaoRequest,
  AdminCriarNotificacaoResponse,
  AdminNotificacaoHistoricoItemResponse,
  NivelNotificacao
} from './models/admin-notificacao.model';
import { AdminNotificacoesService } from './services/admin-notificacoes.service';

@Component({
  selector: 'app-notificacoes-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DesignSystemIconsModule, MaterialModule],
  templateUrl: './notificacoes-admin.component.html',
  styleUrl: './notificacoes-admin.component.scss'
})
export class NotificacoesAdminComponent {
  readonly niveis: Array<{ value: NivelNotificacao; label: string }> = [
    { value: 'INFO', label: 'Informação' },
    { value: 'SUCESSO', label: 'Sucesso' },
    { value: 'ATENCAO', label: 'Atenção' },
    { value: 'CRITICO', label: 'Crítico' }
  ];

  readonly form = this.fb.group({
    titulo: ['', [Validators.required, Validators.maxLength(180)]],
    resumo: ['', [Validators.maxLength(280)]],
    conteudo: ['', [Validators.required]],
    link: ['', [Validators.maxLength(400)]],
    nivel: ['INFO' as NivelNotificacao, [Validators.required]],
    expiraEm: [''],
    todasEmpresas: [true, [Validators.required]]
  });

  buscandoEmpresas = false;
  buscandoEmpresasHistorico = false;
  enviando = false;
  carregandoHistorico = false;
  buscaEmpresa = '';
  empresasEncontradas: AdminEmpresaResumo[] = [];
  empresaSelecionada: AdminEmpresaResumo | null = null;
  ultimoResultado: AdminCriarNotificacaoResponse | null = null;
  filtroTitulo = '';
  buscaEmpresaHistorico = '';
  empresaHistoricoSelecionada: AdminEmpresaResumo | null = null;
  empresasHistoricoEncontradas: AdminEmpresaResumo[] = [];
  historico: AdminNotificacaoHistoricoItemResponse[] = [];
  paginaHistorico = 0;
  tamanhoHistorico = 10;
  totalHistorico = 0;

  constructor(
    private readonly fb: FormBuilder,
    private readonly empresasService: AdminEmpresasService,
    private readonly notificacoesService: AdminNotificacoesService,
    private readonly toastr: ToastrService
  ) {
    this.carregarHistorico();
  }

  get todasEmpresasSelecionadas(): boolean {
    return this.form.controls.todasEmpresas.value !== false;
  }

  get podeEnviar(): boolean {
    return this.form.valid && (this.todasEmpresasSelecionadas || !!this.empresaSelecionada) && !this.enviando;
  }

  get resumoDestino(): string {
    if (this.todasEmpresasSelecionadas) {
      return 'Todas as empresas';
    }

    return this.empresaSelecionada?.nome || 'Nenhuma empresa selecionada';
  }

  get resumoImpacto(): string {
    if (!this.ultimoResultado) {
      return 'O impacto do envio aparece aqui após a criação da notificação.';
    }

    return `${this.ultimoResultado.notificacoesCriadas} notificação(ões) criada(s) para ${this.ultimoResultado.destinatariosCriados} destinatário(s).`;
  }

  get resumoHistorico(): string {
    return `${this.totalHistorico} envio(s) encontrado(s)`;
  }

  onModoDestinoChange(): void {
    this.ultimoResultado = null;
    if (this.todasEmpresasSelecionadas) {
      this.empresaSelecionada = null;
      this.empresasEncontradas = [];
      this.buscaEmpresa = '';
    }
  }

  buscarEmpresas(): void {
    const busca = this.buscaEmpresa.trim();
    this.buscandoEmpresas = true;

    this.empresasService.listar$({
      busca: busca || null,
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
    this.ultimoResultado = null;
  }

  limparEmpresa(): void {
    this.empresaSelecionada = null;
    this.buscaEmpresa = '';
  }

  buscarEmpresasHistorico(): void {
    const busca = this.buscaEmpresaHistorico.trim();
    this.buscandoEmpresasHistorico = true;

    this.empresasService.listar$({
      busca: busca || null,
      pagina: 0,
      tamanho: 8
    })
      .pipe(finalize(() => (this.buscandoEmpresasHistorico = false)))
      .subscribe({
        next: (res) => {
          this.empresasHistoricoEncontradas = res.itens || [];
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível buscar empresas do histórico.');
        }
      });
  }

  selecionarEmpresaHistorico(empresa: AdminEmpresaResumo): void {
    this.empresaHistoricoSelecionada = empresa;
    this.buscaEmpresaHistorico = empresa.nome;
    this.paginaHistorico = 0;
    this.carregarHistorico();
  }

  limparFiltrosHistorico(): void {
    this.filtroTitulo = '';
    this.buscaEmpresaHistorico = '';
    this.empresaHistoricoSelecionada = null;
    this.empresasHistoricoEncontradas = [];
    this.paginaHistorico = 0;
    this.carregarHistorico();
  }

  aplicarFiltrosHistorico(): void {
    this.paginaHistorico = 0;
    this.carregarHistorico();
  }

  alterarPaginaHistorico(event: PageEvent): void {
    this.paginaHistorico = event.pageIndex;
    this.tamanhoHistorico = event.pageSize;
    this.carregarHistorico();
  }

  nivelLabel(nivel: NivelNotificacao): string {
    return {
      INFO: 'Informação',
      SUCESSO: 'Sucesso',
      ATENCAO: 'Atenção',
      CRITICO: 'Crítico'
    }[nivel];
  }

  destinoLabel(tipoDestino: 'EMPRESA_INTEIRA' | 'TODAS_EMPRESAS'): string {
    return tipoDestino === 'EMPRESA_INTEIRA' ? 'Empresa específica' : 'Todas as empresas';
  }

  formatarDataHora(iso?: string | null): string {
    if (!iso) {
      return 'Sem data';
    }

    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(iso));
  }

  enviar(): void {
    if (!this.podeEnviar) {
      this.form.markAllAsTouched();
      if (!this.todasEmpresasSelecionadas && !this.empresaSelecionada) {
        this.toastr.error('Selecione a empresa destinatária.');
      }
      return;
    }

    const raw = this.form.getRawValue();
    const payload: AdminCriarNotificacaoRequest = {
      titulo: String(raw.titulo || '').trim(),
      resumo: String(raw.resumo || '').trim() || null,
      conteudo: String(raw.conteudo || '').trim(),
      link: String(raw.link || '').trim() || null,
      nivel: raw.nivel || 'INFO',
      expiraEm: raw.expiraEm ? new Date(raw.expiraEm).toISOString() : null,
      todasEmpresas: this.todasEmpresasSelecionadas,
      empresaId: this.todasEmpresasSelecionadas ? null : this.empresaSelecionada?.id || null
    };

    this.enviando = true;
    this.notificacoesService.criar$(payload)
      .pipe(finalize(() => (this.enviando = false)))
      .subscribe({
        next: (res) => {
          this.ultimoResultado = res;
          this.toastr.success(
            `${res.notificacoesCriadas} notificação(ões) criada(s) para ${res.destinatariosCriados} destinatário(s).`
          );
          this.form.patchValue({
            titulo: '',
            resumo: '',
            conteudo: '',
            link: '',
            nivel: 'INFO',
            expiraEm: '',
            todasEmpresas: true
          });
          this.empresaSelecionada = null;
          this.empresasEncontradas = [];
          this.buscaEmpresa = '';
          this.carregarHistorico();
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível criar a notificação.');
        }
      });
  }

  private carregarHistorico(): void {
    this.carregandoHistorico = true;

    this.notificacoesService.listar$({
      empresaId: this.empresaHistoricoSelecionada?.id || null,
      titulo: this.filtroTitulo || null,
      pagina: this.paginaHistorico,
      tamanho: this.tamanhoHistorico
    })
      .pipe(finalize(() => (this.carregandoHistorico = false)))
      .subscribe({
        next: (res) => {
          this.historico = res.itens || [];
          this.paginaHistorico = res.pagina;
          this.tamanhoHistorico = res.tamanho;
          this.totalHistorico = res.totalItens;
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar o histórico de notificações.');
        }
      });
  }
}
