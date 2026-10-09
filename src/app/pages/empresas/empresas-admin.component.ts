import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import {
  AdminEmpresaAdocaoJornada,
  AdminEmpresaAdocaoResponse,
  AdminEmpresaDetalheResponse,
  AdminEmpresasResumoResponse,
  AdminEmpresaResumo,
  AdminEmpresaStatus
} from './models/admin-empresa.model';
import { AdminEmpresasService } from './services/admin-empresas.service';

@Component({
  selector: 'app-empresas-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TablerIconsModule, MaterialModule],
  templateUrl: './empresas-admin.component.html',
  styleUrl: './empresas-admin.component.scss'
})
export class EmpresasAdminComponent implements OnInit {
  readonly statusOptions: Array<AdminEmpresaStatus | 'TODAS'> = ['TODAS', 'ATIVA', 'ONBOARDING', 'BAIXA_ATIVIDADE'];
  readonly detailTabs: Array<'visao' | 'dados' | 'adocao'> = ['visao', 'dados', 'adocao'];

  carregandoResumo = false;
  carregandoLista = false;
  carregandoDetalhe = false;
  carregandoAdocao = false;
  erroAdocao = false;

  busca = '';
  statusFiltro: AdminEmpresaStatus | 'TODAS' = 'TODAS';
  abaDetalhe: 'visao' | 'dados' | 'adocao' = 'visao';
  pagina = 0;
  tamanho = 20;
  totalItens = 0;
  totalPaginas = 0;

  resumo: AdminEmpresasResumoResponse = {
    total: 0,
    ativas: 0,
    onboarding: 0,
    baixaAtividade: 0
  };

  empresas: AdminEmpresaResumo[] = [];
  empresaSelecionada: AdminEmpresaDetalheResponse | null = null;
  adocaoSelecionada: AdminEmpresaAdocaoResponse | null = null;

  constructor(
    private readonly empresasService: AdminEmpresasService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.carregarResumo();
    this.carregarLista(true);
  }

  aplicarFiltros(): void {
    this.pagina = 0;
    this.carregarLista(true, this.empresaSelecionada?.id ?? null);
  }

  limparFiltros(): void {
    this.busca = '';
    this.statusFiltro = 'TODAS';
    this.pagina = 0;
    this.carregarLista(true);
  }

  alterarPagina(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanho = event.pageSize;
    this.carregarLista(true, this.empresaSelecionada?.id ?? null);
  }

  selecionarEmpresa(empresa: AdminEmpresaResumo): void {
    this.carregarDetalhe(empresa.id);
  }

  get resumoResultados(): string {
    return `${this.totalItens} empresa(s) encontrada(s)`;
  }

  statusLabel(status: AdminEmpresaStatus): string {
    return {
      ATIVA: 'Ativa',
      ONBOARDING: 'Onboarding',
      BAIXA_ATIVIDADE: 'Baixa atividade'
    }[status];
  }

  statusClass(status: AdminEmpresaStatus): string {
    return `status-${status.toLowerCase()}`;
  }

  tabLabel(tab: 'visao' | 'dados' | 'adocao'): string {
    return {
      visao: 'Visão geral',
      dados: 'Dados',
      adocao: 'Adoção'
    }[tab];
  }

  ativacaoLabel(adocao: AdminEmpresaAdocaoResponse | null): string {
    if (!adocao) {
      return 'Indisponível';
    }
    if (!adocao.ativacao.suportada) {
      return 'Ainda não suportada';
    }
    return adocao.ativacao.concluida ? 'Ativada' : 'Pendente';
  }

  ativacaoClass(adocao: AdminEmpresaAdocaoResponse | null): string {
    if (!adocao || !adocao.ativacao.suportada) {
      return 'neutral';
    }
    return adocao.ativacao.concluida ? 'success' : 'pending';
  }

  configuracaoStatus(adocao: AdminEmpresaAdocaoResponse | null): string {
    if (!adocao) {
      return 'Indisponível';
    }
    return adocao.configuracao.concluida ? 'Concluída' : 'Em andamento';
  }

  configuracaoPercentual(adocao: AdminEmpresaAdocaoResponse | null): string {
    const percentual = adocao?.configuracao?.percentual;
    return percentual == null ? 'Indisponível' : `${percentual}%`;
  }

  primeiroPedidoLabel(adocao: AdminEmpresaAdocaoResponse | null): string {
    if (!adocao) {
      return 'Indisponível';
    }
    return adocao.marcos.primeiroPedidoEm ? 'Concluído' : 'Pendente';
  }

  primeiroPedidoClass(adocao: AdminEmpresaAdocaoResponse | null): string {
    if (!adocao) {
      return 'neutral';
    }
    return adocao.marcos.primeiroPedidoEm ? 'success' : 'pending';
  }

  formatarData(valor?: string | null): string {
    if (!valor) {
      return 'Indisponível';
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(valor));
  }

  formatarDuracao(segundos?: number | null): string {
    if (segundos == null) {
      return 'Indisponível';
    }
    if (segundos < 60) {
      return `${segundos}s`;
    }
    const minutos = Math.floor(segundos / 60);
    if (minutos < 60) {
      return `${minutos}min`;
    }
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;
    if (horas < 24) {
      return minutosRestantes > 0 ? `${horas}h ${minutosRestantes}min` : `${horas}h`;
    }
    const dias = Math.floor(horas / 24);
    const horasRestantes = horas % 24;
    return horasRestantes > 0 ? `${dias}d ${horasRestantes}h` : `${dias}d`;
  }

  criterioAtivacaoLabel(codigo: string): string {
    const labels: Record<string, string> = {
      CONFIGURACAO: 'Configuração',
      PRIMEIRO_PEDIDO: 'Primeiro pedido',
      PRIMEIRA_MOVIMENTACAO_PEDIDO: 'Primeira movimentação'
    };
    return labels[codigo] || this.humanizarCodigo(codigo);
  }

  jornadaLabel(codigo: string): string {
    const labels: Record<string, string> = {
      PRIMEIRO_PEDIDO: 'Primeiro Pedido'
    };
    return labels[codigo] || this.humanizarCodigo(codigo);
  }

  jornadaStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      NAO_INICIADO: 'Não iniciado',
      EM_ANDAMENTO: 'Em andamento',
      CONCLUIDO: 'Concluído',
      IGNORADO: 'Ignorado',
      ABANDONADO: 'Abandonado'
    };
    return labels[status] || this.humanizarCodigo(status);
  }

  jornadaStatusClass(status: string): string {
    const classes: Record<string, string> = {
      NAO_INICIADO: 'neutral',
      EM_ANDAMENTO: 'pending',
      CONCLUIDO: 'success',
      IGNORADO: 'muted',
      ABANDONADO: 'muted'
    };
    return classes[status] || 'neutral';
  }

  etapaAtualLabel(etapa?: string | null): string {
    if (!etapa) {
      return '';
    }
    const labels: Record<string, string> = {
      PEDIDO_CRIADO: 'Pedido criado'
    };
    return labels[etapa] || this.humanizarCodigo(etapa);
  }

  dataJornada(jornada: AdminEmpresaAdocaoJornada): string {
    if (jornada.status === 'CONCLUIDO') {
      return jornada.concluidoEm ? `Concluído em ${this.formatarData(jornada.concluidoEm)}` : 'Data de conclusão indisponível';
    }
    if (jornada.status === 'EM_ANDAMENTO') {
      return jornada.iniciadoEm ? `Iniciado em ${this.formatarData(jornada.iniciadoEm)}` : 'Data de início indisponível';
    }
    if (jornada.status === 'IGNORADO') {
      return jornada.ignoradoEm ? `Ignorado em ${this.formatarData(jornada.ignoradoEm)}` : 'Data indisponível';
    }
    if (jornada.status === 'ABANDONADO') {
      return jornada.abandonadoEm ? `Abandonado em ${this.formatarData(jornada.abandonadoEm)}` : 'Data indisponível';
    }
    if (jornada.oferecidoEm) {
      return `Oferecido em ${this.formatarData(jornada.oferecidoEm)}`;
    }
    return 'Ainda não iniciado';
  }

  marcoStatus(campo: keyof AdminEmpresaAdocaoResponse['marcos'] | 'ativadaEm'): string {
    if (!this.adocaoSelecionada) {
      return 'Indisponível';
    }

    return this.marcoStatusComAdocao(this.adocaoSelecionada, campo);
  }

  marcoStatusComAdocao(adocao: AdminEmpresaAdocaoResponse, campo: keyof AdminEmpresaAdocaoResponse['marcos'] | 'ativadaEm'): string {
    if (campo === 'ativadaEm') {
      if (adocao.ativacao.ativadaEm) {
        return this.formatarData(adocao.ativacao.ativadaEm);
      }
      return adocao.ativacao.concluida ? 'Indisponível' : 'Ainda não realizada';
    }
    const valor = adocao.marcos[campo];
    if (valor) {
      return this.formatarData(valor);
    }
    if (campo === 'primeiroPedidoEm') {
      return 'Ainda não realizado';
    }
    if (campo === 'primeiraMovimentacaoPedidoEm') {
      return 'Ainda não realizada';
    }
    return 'Indisponível';
  }

  retryAdocao(): void {
    if (this.empresaSelecionada) {
      this.carregarAdocao(this.empresaSelecionada.id);
    }
  }

  dataRelativa(iso?: string | null): string {
    if (!iso) {
      return 'Sem atividade';
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

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(valor || 0);
  }

  enderecoCompleto(): string {
    const endereco = this.empresaSelecionada?.endereco;
    if (!endereco) {
      return 'Não informado';
    }

    return [
      endereco.logradouro,
      endereco.numero,
      endereco.complemento,
      endereco.bairro,
      endereco.cidade,
      endereco.estado
    ].filter(Boolean).join(', ') || 'Não informado';
  }

  private carregarResumo(): void {
    this.carregandoResumo = true;
    this.empresasService.buscarResumo$()
      .pipe(finalize(() => (this.carregandoResumo = false)))
      .subscribe({
        next: (resumo) => {
          this.resumo = resumo;
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar o resumo das empresas.');
        }
      });
  }

  private carregarLista(resolverSelecao = false, empresaId: number | null = null): void {
    this.carregandoLista = true;

    this.empresasService.listar$({
      busca: this.busca || null,
      status: this.statusFiltro === 'TODAS' ? null : this.statusFiltro,
      pagina: this.pagina,
      tamanho: this.tamanho
    })
      .pipe(finalize(() => (this.carregandoLista = false)))
      .subscribe({
        next: (res) => {
          this.empresas = res.itens || [];
          this.pagina = res.pagina;
          this.tamanho = res.tamanho;
          this.totalItens = res.totalItens;
          this.totalPaginas = res.totalPaginas;

          if (resolverSelecao) {
            this.resolverSelecao(empresaId);
          }
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar a lista de empresas.');
        }
      });
  }

  private resolverSelecao(empresaId: number | null): void {
    const idSelecionado = empresaId && this.empresas.some((item) => item.id === empresaId)
      ? empresaId
      : this.empresas[0]?.id;

    if (idSelecionado) {
      this.carregarDetalhe(idSelecionado);
    } else {
      this.empresaSelecionada = null;
    }
  }

  private carregarDetalhe(id: number): void {
    this.carregandoDetalhe = true;
    this.adocaoSelecionada = null;
    this.erroAdocao = false;
    this.carregarAdocao(id);

    this.empresasService.buscarPorId$(id)
      .pipe(finalize(() => (this.carregandoDetalhe = false)))
      .subscribe({
        next: (empresa) => {
          this.empresaSelecionada = empresa;
          this.abaDetalhe = 'visao';
        },
        error: (err) => {
          this.toastr.error(err?.userMessage || 'Não foi possível carregar o detalhe da empresa.');
        }
      });
  }

  private carregarAdocao(id: number): void {
    this.carregandoAdocao = true;
    this.erroAdocao = false;

    this.empresasService.buscarAdocao$(id)
      .pipe(finalize(() => (this.carregandoAdocao = false)))
      .subscribe({
        next: (adocao) => {
          this.adocaoSelecionada = adocao;
        },
        error: () => {
          this.adocaoSelecionada = null;
          this.erroAdocao = true;
        }
      });
  }

  private humanizarCodigo(codigo: string): string {
    return codigo
      .toLowerCase()
      .split('_')
      .filter(Boolean)
      .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(' ');
  }
}
