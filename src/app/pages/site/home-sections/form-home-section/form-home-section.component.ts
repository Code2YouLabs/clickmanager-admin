
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr.service';
import { finalize } from 'rxjs/operators';
import { MaterialModule } from 'src/app/material.module';
import { TemPermissaoDirective } from 'src/app/diretivas/tem-permissao.directive';
import { extrairMensagemErro } from 'src/app/utils/mensagem.util';
import {
  SITE_HOME_SECTION_LAYOUTS,
  SITE_HOME_SECTION_TIPOS,
  SITE_HOME_SECTION_TIPOS_SEM_ITENS,
  SiteHomeSection,
  SiteHomeSectionLayout,
  SiteHomeSectionRequest,
  SiteHomeSectionTipo
} from '../../models/site-home-section.models';
import { SiteHomeSectionService } from '../../services/site-home-section.service';

@Component({
  selector: 'app-form-home-section',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, MaterialModule, TemPermissaoDirective],
  templateUrl: './form-home-section.component.html',
  styleUrl: './form-home-section.component.scss'
})
export class FormHomeSectionComponent implements OnInit {
  readonly tipos = SITE_HOME_SECTION_TIPOS;
  readonly layouts = SITE_HOME_SECTION_LAYOUTS;
  readonly tiposSemItens = SITE_HOME_SECTION_TIPOS_SEM_ITENS;

  id: number | null = null;
  carregando = false;
  salvando = false;
  erroJson = '';

  form = this.fb.group({
    tipo: ['PRODUTOS' as SiteHomeSectionTipo, [Validators.required]],
    titulo: ['', [Validators.required]],
    subtitulo: [''],
    layout: ['GRID' as SiteHomeSectionLayout, [Validators.required]],
    limiteItens: [6 as number | null, [Validators.min(1)]],
    ordem: [1, [Validators.required, Validators.min(1)]],
    ativo: [true],
    configJson: ['{}', [Validators.required]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly service: SiteHomeSectionService,
    private readonly toastr: ToastrService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? Number(idParam) : null;

    this.form.get('tipo')?.valueChanges.subscribe(() => this.atualizarLimiteItens());
    this.atualizarLimiteItens();

    if (this.id) {
      this.carregar(this.id);
    }
  }

  get editando(): boolean {
    return Boolean(this.id);
  }

  get tipoSelecionado(): SiteHomeSectionTipo {
    return (this.form.get('tipo')?.value || 'PRODUTOS') as SiteHomeSectionTipo;
  }

  get tipoNaoUsaItens(): boolean {
    return this.tiposSemItens.includes(this.tipoSelecionado);
  }

  get tituloPreview(): string {
    return this.form.get('titulo')?.value || 'Título da seção';
  }

  get subtituloPreview(): string {
    return this.form.get('subtitulo')?.value || 'Subtítulo da seção';
  }

  get tipoPreview(): string {
    return this.tipos.find((item) => item.id === this.tipoSelecionado)?.nome || this.tipoSelecionado;
  }

  get layoutPreview(): string {
    const layout = this.form.get('layout')?.value;
    return this.layouts.find((item) => item.id === layout)?.nome || String(layout || '-');
  }

  get quantidadePreview(): string {
    if (this.tipoNaoUsaItens) return 'Não usa itens';
    const limite = this.form.get('limiteItens')?.value;
    return `${limite || 0} item(ns)`;
  }

  salvar(): void {
    this.form.markAllAsTouched();
    this.erroJson = '';

    const configJson = this.parseConfigJson();
    if (this.form.invalid || configJson === undefined) return;

    const raw = this.form.getRawValue();
    const payload: SiteHomeSectionRequest = {
      tipo: raw.tipo || 'PRODUTOS',
      titulo: String(raw.titulo || '').trim(),
      subtitulo: raw.subtitulo ? String(raw.subtitulo).trim() : null,
      layout: raw.layout || 'GRID',
      limiteItens: this.tipoNaoUsaItens ? null : Number(raw.limiteItens || 6),
      ordem: Number(raw.ordem || 1),
      ativo: Boolean(raw.ativo),
      configJson
    };

    this.salvando = true;
    const request$ = this.id
      ? this.service.atualizar$(this.id, payload)
      : this.service.criar$(payload);

    request$
      .pipe(finalize(() => (this.salvando = false)))
      .subscribe({
        next: () => {
          this.toastr.success(this.id ? 'Seção atualizada.' : 'Seção criada.');
          this.voltar();
        },
        error: (err) => {
          this.toastr.error(extrairMensagemErro(err, 'Não foi possível salvar a seção da home.'));
        }
      });
  }

  voltar(): void {
    this.router.navigate(['/page/site/home-sections']);
  }

  private carregar(id: number): void {
    this.carregando = true;
    this.service.buscarPorId$(id)
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (secao) => {
          if (!secao) {
            this.toastr.warning('Seção da home não encontrada.');
            this.voltar();
            return;
          }

          this.preencherForm(secao);
        },
        error: (err) => {
          this.toastr.error(extrairMensagemErro(err, 'Não foi possível carregar a seção da home.'));
        }
      });
  }

  private preencherForm(secao: SiteHomeSection): void {
    this.form.patchValue({
      tipo: secao.tipo,
      titulo: secao.titulo,
      subtitulo: secao.subtitulo || '',
      layout: secao.layout,
      limiteItens: secao.limiteItens ?? null,
      ordem: secao.ordem || 1,
      ativo: Boolean(secao.ativo),
      configJson: JSON.stringify(secao.configJson ?? {}, null, 2)
    });
    this.atualizarLimiteItens();
  }

  private atualizarLimiteItens(): void {
    const limiteControl = this.form.get('limiteItens');
    if (!limiteControl) return;

    if (this.tipoNaoUsaItens) {
      limiteControl.disable({ emitEvent: false });
      limiteControl.setValue(null, { emitEvent: false });
    } else {
      limiteControl.enable({ emitEvent: false });
      if (limiteControl.value == null) {
        limiteControl.setValue(6, { emitEvent: false });
      }
    }
  }

  private parseConfigJson(): unknown | undefined {
    const control = this.form.get('configJson');
    const valor = control?.value || '{}';

    try {
      const parsed = JSON.parse(valor);
      control?.setErrors(null);
      return parsed;
    } catch {
      this.erroJson = 'Informe um JSON válido.';
      control?.setErrors({ jsonInvalido: true });
      return undefined;
    }
  }
}
