import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { ToastrService } from 'src/app/services/toastr.service';
import { MaterialModule } from 'src/app/material.module';
import { PageCardComponent } from 'src/app/components/page-card/page-card.component';
import { SectionCardComponent } from 'src/app/components/section-card/section-card.component';
import { StatusBadgeComponent } from 'src/app/components/status-badge/status-badge.component';
import {
  AdminChamadoDetalhe,
  AdminChamadoResumo,
  PrioridadeChamadoSuporte,
  StatusChamadoSuporte
} from './models/chamado-suporte.model';
import { SuporteService } from './services/suporte.service';

@Component({
  selector: 'app-suporte',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    MaterialModule,
    PageCardComponent,
    SectionCardComponent,
    StatusBadgeComponent
  ],
  templateUrl: './suporte.component.html',
  styleUrl: './suporte.component.scss'
})
export class SuporteComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly statusOptions: Array<StatusChamadoSuporte | 'TODOS'> = [
    'TODOS',
    'ABERTO',
    'EM_ANALISE',
    'AGUARDANDO_CLIENTE',
    'RESPONDIDO',
    'RESOLVIDO',
    'FECHADO'
  ];

  readonly statusActions: StatusChamadoSuporte[] = [
    'EM_ANALISE',
    'AGUARDANDO_CLIENTE',
    'RESPONDIDO',
    'RESOLVIDO',
    'FECHADO'
  ];

  carregandoLista = false;
  carregandoDetalhe = false;
  salvandoResposta = false;
  atualizandoStatus: StatusChamadoSuporte | null = null;
  chamados: AdminChamadoResumo[] = [];
  chamadoSelecionado: AdminChamadoDetalhe | null = null;
  statusFiltro: StatusChamadoSuporte | 'TODOS' = 'ABERTO';
  empresaIdFiltro = '';
  pagina = 0;
  tamanho = 20;
  totalItens = 0;
  totalPaginas = 0;

  readonly respostaForm = this.fb.group({
    mensagem: ['', [Validators.required, Validators.maxLength(3000)]],
    interna: [false, { nonNullable: true }]
  });

  constructor(
    private readonly service: SuporteService,
    private readonly toastr: ToastrService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('id'));
      this.carregarLista(true, Number.isFinite(id) && id > 0 ? id : null);
    });
  }

  aplicarFiltros(): void {
    this.pagina = 0;
    this.carregarLista(true, this.chamadoSelecionado?.id ?? null);
  }

  limparFiltros(): void {
    this.statusFiltro = 'ABERTO';
    this.empresaIdFiltro = '';
    this.pagina = 0;
    this.carregarLista(true, this.chamadoSelecionado?.id ?? null);
  }

  alterarPagina(event: PageEvent): void {
    this.pagina = event.pageIndex;
    this.tamanho = event.pageSize;
    this.carregarLista(false, this.chamadoSelecionado?.id ?? null);
  }

  selecionarChamado(item: AdminChamadoResumo): void {
    if (!item?.id) {
      return;
    }

    this.carregarDetalhe(item.id, true);
  }

  responderChamado(): void {
    if (!this.chamadoSelecionado?.id || this.naoPodeResponder || this.salvandoResposta) {
      return;
    }

    if (this.respostaForm.invalid) {
      this.respostaForm.markAllAsTouched();
      return;
    }

    const mensagem = String(this.respostaForm.getRawValue().mensagem || '').trim();
    if (!mensagem) {
      return;
    }

    this.salvandoResposta = true;
    this.service.responder$(this.chamadoSelecionado.id, {
      mensagem,
      interna: Boolean(this.respostaForm.getRawValue().interna)
    }).subscribe({
      next: (detalhe) => {
        this.salvandoResposta = false;
        this.chamadoSelecionado = detalhe;
        this.respostaForm.patchValue({ mensagem: '' });
        this.recarregarListaAposMutacao(detalhe);
        this.toastr.success('Resposta enviada com sucesso.');
      },
      error: (err) => {
        this.salvandoResposta = false;
        this.toastr.error(err?.userMessage || 'Não foi possível enviar a resposta.');
      }
    });
  }

  atualizarStatus(status: StatusChamadoSuporte): void {
    if (!this.chamadoSelecionado?.id || this.atualizandoStatus || this.chamadoSelecionado.status === 'FECHADO') {
      return;
    }

    this.atualizandoStatus = status;
    this.service.atualizarStatus$(this.chamadoSelecionado.id, status).subscribe({
      next: (detalhe) => {
        this.atualizandoStatus = null;
        this.chamadoSelecionado = detalhe;
        this.recarregarListaAposMutacao(detalhe);
        this.toastr.success(`Status atualizado para ${this.statusLabel(status)}.`);
      },
      error: (err) => {
        this.atualizandoStatus = null;
        this.toastr.error(err?.userMessage || 'Não foi possível atualizar o status.');
      }
    });
  }

  prioridadeLabel(prioridade: PrioridadeChamadoSuporte): string {
    return {
      BAIXA: 'Baixa',
      MEDIA: 'Média',
      ALTA: 'Alta',
      URGENTE: 'Urgente'
    }[prioridade] || prioridade;
  }

  categoriaLabel(categoria: string): string {
    return {
      DUVIDA: 'Dúvida',
      ERRO: 'Erro',
      FINANCEIRO: 'Financeiro',
      SUGESTAO: 'Sugestão',
      ACESSO: 'Acesso',
      OUTRO: 'Outro'
    }[String(categoria || '').toUpperCase()] || categoria;
  }

  statusLabel(status: string): string {
    return String(status || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  }

  prioridadeClass(prioridade: PrioridadeChamadoSuporte): string {
    return `priority-${String(prioridade || 'MEDIA').toLowerCase()}`;
  }

  dataRelativa(iso?: string | null): string {
    if (!iso) {
      return 'Agora';
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
    return new DatePipe('pt-BR').transform(date, 'dd/MM/yyyy HH:mm') || '';
  }

  autorMensagemClass(tipo: string, interna: boolean): string {
    if (interna) {
      return 'msg-interna';
    }
    return String(tipo || 'CLIENTE').toUpperCase() === 'CLIENTE' ? 'msg-cliente' : 'msg-admin';
  }

  get naoPodeResponder(): boolean {
    return !this.chamadoSelecionado || this.chamadoSelecionado.status === 'FECHADO';
  }

  get resumoContador(): string {
    return `${this.totalItens} chamado(s) encontrado(s)`;
  }

  carregarLista(resolverSelecao = false, chamadoId: number | null = null): void {
    this.carregandoLista = true;
    this.service.listar$({
      pagina: this.pagina,
      tamanho: this.tamanho,
      status: this.statusFiltro === 'TODOS' ? null : this.statusFiltro,
      empresaId: this.parseEmpresaId()
    }).subscribe({
      next: (res) => {
        this.carregandoLista = false;
        this.chamados = res.itens || [];
        this.pagina = res.pagina;
        this.tamanho = res.tamanho;
        this.totalItens = res.totalItens;
        this.totalPaginas = res.totalPaginas;
        if (resolverSelecao) {
          this.resolverSelecaoInicial(chamadoId);
        }
      },
      error: (err) => {
        this.carregandoLista = false;
        this.toastr.error(err?.userMessage || 'Não foi possível carregar os chamados.');
      }
    });
  }

  private resolverSelecaoInicial(chamadoId: number | null): void {
    if (chamadoId) {
      this.carregarDetalhe(chamadoId, false);
      return;
    }

    const primeiro = this.chamados[0];
    if (primeiro) {
      this.carregarDetalhe(primeiro.id, true);
    } else {
      this.chamadoSelecionado = null;
    }
  }

  private carregarDetalhe(id: number, navegar: boolean): void {
    this.carregandoDetalhe = true;
    this.service.buscarPorId$(id).subscribe({
      next: (detalhe) => {
        this.chamadoSelecionado = detalhe;
        this.carregandoDetalhe = false;
        this.respostaForm.patchValue({ mensagem: '' });
        if (navegar) {
          void this.router.navigate(['/chamados', id]);
        }
      },
      error: (err) => {
        this.carregandoDetalhe = false;
        this.toastr.error(err?.userMessage || 'Não foi possível carregar o detalhe do chamado.');
      }
    });
  }

  private recarregarListaAposMutacao(detalhe: AdminChamadoDetalhe): void {
    this.atualizarItemNaLista(detalhe);
    this.carregarLista(false, detalhe.id);
  }

  private atualizarItemNaLista(detalhe: AdminChamadoDetalhe): void {
    this.chamados = this.chamados.map((item) => item.id === detalhe.id ? detalhe : item);
  }

  private parseEmpresaId(): number | null {
    const value = this.empresaIdFiltro.trim();
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
}
