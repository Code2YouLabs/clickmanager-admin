
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr.service';
import { finalize } from 'rxjs/operators';
import { MaterialModule } from 'src/app/material.module';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { extrairMensagemErro } from 'src/app/utils/mensagem.util';
import {
  SITE_HOME_SECTION_LAYOUTS,
  SITE_HOME_SECTION_TIPOS,
  SiteHomeSection
} from '../../models/site-home-section.models';
import { SiteHomeSectionService } from '../../services/site-home-section.service';

@Component({
  selector: 'app-listar-home-sections',
  standalone: true,
  imports: [RouterModule, MaterialModule, TemPermissaoDirective],
  templateUrl: './listar-home-sections.component.html',
  styleUrl: './listar-home-sections.component.scss'
})
export class ListarHomeSectionsComponent implements OnInit {
  readonly displayedColumns = ['tipo', 'titulo', 'layout', 'limite', 'ordem', 'status', 'acoes'];
  readonly tipoLabels = new Map(SITE_HOME_SECTION_TIPOS.map((item) => [item.id, item.nome]));
  readonly layoutLabels = new Map(SITE_HOME_SECTION_LAYOUTS.map((item) => [item.id, item.nome]));

  secoes: SiteHomeSection[] = [];
  carregando = false;
  atualizandoId: number | null = null;

  constructor(
    private readonly service: SiteHomeSectionService,
    private readonly toastr: ToastrService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.service.listar$()
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (secoes) => {
          this.secoes = secoes;
        },
        error: (err) => {
          this.toastr.error(extrairMensagemErro(err, 'Não foi possível carregar as seções da home.'));
        }
      });
  }

  novaSecao(): void {
    this.router.navigate(['/page/site/home-sections/novo']);
  }

  editar(secao: SiteHomeSection): void {
    this.router.navigate(['/page/site/home-sections/editar', secao.id]);
  }

  alternarStatus(secao: SiteHomeSection): void {
    if (!secao?.id || this.atualizandoId === secao.id) return;

    this.atualizandoId = secao.id;
    this.service.atualizarStatus$(secao.id, !secao.ativo)
      .pipe(finalize(() => (this.atualizandoId = null)))
      .subscribe({
        next: () => {
          this.toastr.success(secao.ativo ? 'Seção desativada.' : 'Seção ativada.');
          this.carregar();
        },
        error: (err) => {
          this.toastr.error(extrairMensagemErro(err, 'Não foi possível atualizar o status da seção.'));
        }
      });
  }

  excluir(secao: SiteHomeSection): void {
    if (!secao?.id || !confirm(`Excluir a seção "${secao.titulo}"?`)) return;

    this.atualizandoId = secao.id;
    this.service.excluir$(secao.id)
      .pipe(finalize(() => (this.atualizandoId = null)))
      .subscribe({
        next: () => {
          this.toastr.success('Seção excluída.');
          this.carregar();
        },
        error: (err) => {
          this.toastr.error(extrairMensagemErro(err, 'Não foi possível excluir a seção.'));
        }
      });
  }

  mover(secao: SiteHomeSection, direcao: -1 | 1): void {
    const index = this.secoes.findIndex((item) => item.id === secao.id);
    const destino = index + direcao;
    if (index < 0 || destino < 0 || destino >= this.secoes.length) return;

    const reordenadas = [...this.secoes];
    [reordenadas[index], reordenadas[destino]] = [reordenadas[destino], reordenadas[index]];
    const payload = reordenadas.map((item, ordemIndex) => ({
      id: item.id,
      ordem: ordemIndex + 1
    }));

    this.atualizandoId = secao.id;
    this.service.atualizarOrdem$(payload)
      .pipe(finalize(() => (this.atualizandoId = null)))
      .subscribe({
        next: () => {
          this.toastr.success('Ordem atualizada.');
          this.carregar();
        },
        error: (err) => {
          this.toastr.error(extrairMensagemErro(err, 'Não foi possível atualizar a ordem das seções.'));
        }
      });
  }

  tipoLabel(secao: SiteHomeSection): string {
    return this.tipoLabels.get(secao.tipo) || secao.tipo;
  }

  layoutLabel(secao: SiteHomeSection): string {
    return this.layoutLabels.get(secao.layout) || secao.layout;
  }

  limiteLabel(secao: SiteHomeSection): string {
    return secao.limiteItens == null ? '-' : String(secao.limiteItens);
  }

  trackById(_: number, item: SiteHomeSection): number {
    return item.id;
  }
}
