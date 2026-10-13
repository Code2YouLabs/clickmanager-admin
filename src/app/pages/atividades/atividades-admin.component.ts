import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr.service';
import { finalize } from 'rxjs/operators';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { MaterialModule } from 'src/app/material.module';
import {
  AdminAtividadeCriticidade,
  AdminAtividadeEventoResponse,
  AdminAtividadeModulo,
  AdminAtividadeTipo
} from './models/admin-atividade-evento.model';
import { AdminAtividadesService } from './services/admin-atividades.service';

@Component({
  selector: 'app-atividades-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DesignSystemIconsModule, MaterialModule],
  templateUrl: './atividades-admin.component.html',
  styleUrl: './atividades-admin.component.scss'
})
export class AtividadesAdminComponent implements OnInit {
  readonly tipoOptions: Array<AdminAtividadeTipo | 'TODOS'> = ['TODOS', 'ONBOARDING', 'ACESSO', 'DEPLOY', 'SUPORTE', 'COMERCIAL'];
  readonly moduloOptions: Array<AdminAtividadeModulo | 'TODOS'> = ['TODOS', 'ONBOARDING', 'SUPORTE', 'COMERCIAL', 'BILLING', 'OPERACAO'];
  readonly criticidadeOptions: Array<AdminAtividadeCriticidade | 'TODOS'> = ['TODOS', 'CRITICO', 'ATENCAO', 'INFO'];

  carregando = false;
  erro = '';
  limite = 50;
  tipoFiltro: AdminAtividadeTipo | 'TODOS' = 'TODOS';
  moduloFiltro: AdminAtividadeModulo | 'TODOS' = 'TODOS';
  criticidadeFiltro: AdminAtividadeCriticidade | 'TODOS' = 'TODOS';
  somenteNaoVisualizadas = false;
  eventos: AdminAtividadeEventoResponse[] = [];

  constructor(
    private readonly atividadesService: AdminAtividadesService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.carregarAtividades();
  }

  carregarAtividades(): void {
    this.carregando = true;
    this.erro = '';

    this.atividadesService.listar$(this.limite)
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (eventos) => {
          this.eventos = eventos;
        },
        error: (err) => {
          this.erro = err?.userMessage || 'Não foi possível carregar as atividades.';
          this.toastr.error(this.erro);
        }
      });
  }

  limparFiltros(): void {
    this.tipoFiltro = 'TODOS';
    this.moduloFiltro = 'TODOS';
    this.criticidadeFiltro = 'TODOS';
    this.somenteNaoVisualizadas = false;
  }

  get eventosFiltrados(): AdminAtividadeEventoResponse[] {
    return this.eventos.filter((evento) => {
      if (this.tipoFiltro !== 'TODOS' && evento.tipo !== this.tipoFiltro) {
        return false;
      }
      if (this.moduloFiltro !== 'TODOS' && evento.modulo !== this.moduloFiltro) {
        return false;
      }
      if (this.criticidadeFiltro !== 'TODOS' && evento.criticidade !== this.criticidadeFiltro) {
        return false;
      }
      if (this.somenteNaoVisualizadas && evento.visualizada) {
        return false;
      }
      return true;
    });
  }

  get totalCriticos(): number {
    return this.eventosFiltrados.filter((evento) => evento.criticidade === 'CRITICO').length;
  }

  get totalNaoVisualizadas(): number {
    return this.eventosFiltrados.filter((evento) => !evento.visualizada).length;
  }

  get totalSuporte(): number {
    return this.eventosFiltrados.filter((evento) => evento.tipo === 'SUPORTE').length;
  }

  criticidadeClass(criticidade: AdminAtividadeCriticidade): string {
    return `criticidade-${criticidade.toLowerCase()}`;
  }

  moduloClass(modulo: AdminAtividadeModulo): string {
    return `modulo-${modulo.toLowerCase()}`;
  }

  tipoIcon(tipo: AdminAtividadeTipo): string {
    return {
      ONBOARDING: 'rocket',
      ACESSO: 'shield-lock',
      DEPLOY: 'cloud-upload',
      SUPORTE: 'lifebuoy',
      COMERCIAL: 'chart-line'
    }[tipo];
  }

  tipoLabel(tipo: AdminAtividadeTipo): string {
    return {
      ONBOARDING: 'Onboarding',
      ACESSO: 'Acesso',
      DEPLOY: 'Deploy',
      SUPORTE: 'Suporte',
      COMERCIAL: 'Comercial'
    }[tipo];
  }

  moduloLabel(modulo: AdminAtividadeModulo): string {
    return {
      ONBOARDING: 'Onboarding',
      SUPORTE: 'Suporte',
      COMERCIAL: 'Comercial',
      BILLING: 'Billing',
      OPERACAO: 'Operação'
    }[modulo];
  }

  criticidadeLabel(criticidade: AdminAtividadeCriticidade): string {
    return {
      INFO: 'Info',
      ATENCAO: 'Atenção',
      CRITICO: 'Crítico'
    }[criticidade];
  }

  dataRelativa(iso: string): string {
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

  rotaEvento(evento: AdminAtividadeEventoResponse): any[] | null {
    if (evento.entidadeTipo === 'CHAMADO_SUPORTE' && evento.entidadeId) {
      return ['/chamados', evento.entidadeId];
    }
    return null;
  }
}
