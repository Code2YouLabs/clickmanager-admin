
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr.service';
import { finalize } from 'rxjs/operators';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { MaterialModule } from 'src/app/material.module';
import { extrairMensagemErro } from 'src/app/utils/mensagem.util';
import {
  AdminOnboardingCatalogoAcabamentoResponse,
  AdminOnboardingCatalogoServicoResponse,
  AdminSalvarAcabamentoOnboardingRequest,
  AdminSalvarServicoOnboardingRequest
} from './models/admin-onboarding-catalogo.model';
import { AdminOnboardingCatalogoService } from './services/admin-onboarding-catalogo.service';

type ItemEntity = 'servicos' | 'acabamentos';

interface ItemFormModel {
  codigo: string;
  nome: string;
  descricao: string;
  valorBaseReais: number | null;
  ativo: boolean;
  ordemExibicao: number | null;
}

@Component({
  selector: 'app-onboarding-catalogo-item-form',
  standalone: true,
  imports: [FormsModule, RouterModule, DesignSystemIconsModule, MaterialModule],
  templateUrl: './onboarding-catalogo-item-form.component.html',
  styleUrl: './onboarding-catalogo-item-form.component.scss'
})
export class OnboardingCatalogoItemFormComponent implements OnInit {
  readonly entity = (this.route.snapshot.data['entity'] as ItemEntity) || 'servicos';

  carregando = false;
  salvando = false;
  isEditMode = false;
  itemId: number | null = null;

  form: ItemFormModel = this.criarFormPadrao();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly catalogoService: AdminOnboardingCatalogoService,
    private readonly toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) {
      return;
    }

    this.isEditMode = true;
    this.itemId = Number(idParam);
    if (!Number.isFinite(this.itemId)) {
      this.toastr.error('Identificador inválido.');
      this.voltar();
      return;
    }

    this.carregarDetalhe(this.itemId);
  }

  get tituloPagina(): string {
    return this.isEditMode ? `Editar ${this.labelSingular}` : `Novo ${this.labelSingular}`;
  }

  get labelPlural(): string {
    return this.entity === 'servicos' ? 'Serviços' : 'Acabamentos';
  }

  get labelSingular(): string {
    return this.entity === 'servicos' ? 'serviço' : 'acabamento';
  }

  get rotaVolta(): string {
    return '/onboarding/catalogo';
  }

  salvar(): void {
    if (!this.form.codigo.trim()) {
      this.toastr.warning(`Informe o código do ${this.labelSingular}.`);
      return;
    }

    if (!this.form.nome.trim()) {
      this.toastr.warning(`Informe o nome do ${this.labelSingular}.`);
      return;
    }

    if ((this.form.valorBaseReais ?? 0) < 0) {
      this.toastr.warning(`O valor base do ${this.labelSingular} não pode ser negativo.`);
      return;
    }

    const payload = {
      codigo: this.form.codigo.trim().toUpperCase(),
      nome: this.form.nome.trim(),
      descricao: this.normalizarTexto(this.form.descricao),
      valorBaseCentavos: this.reaisParaCentavos(this.form.valorBaseReais),
      ativo: this.form.ativo,
      ordemExibicao: this.normalizarNumero(this.form.ordemExibicao)
    };

    this.salvando = true;
    const request$ = this.entity === 'servicos'
      ? (this.isEditMode
        ? this.catalogoService.atualizarServico$(this.itemId!, payload as AdminSalvarServicoOnboardingRequest)
        : this.catalogoService.criarServico$(payload as AdminSalvarServicoOnboardingRequest))
      : (this.isEditMode
        ? this.catalogoService.atualizarAcabamento$(this.itemId!, payload as AdminSalvarAcabamentoOnboardingRequest)
        : this.catalogoService.criarAcabamento$(payload as AdminSalvarAcabamentoOnboardingRequest));

    request$
      .pipe(finalize(() => (this.salvando = false)))
      .subscribe({
        next: () => {
          this.toastr.success(this.isEditMode ? `${this.labelPlural.slice(0, -1)} salvo com sucesso.` : `${this.labelPlural.slice(0, -1)} criado com sucesso.`);
          this.voltar();
        },
        error: (err) => {
          this.toastr.error(extrairMensagemErro(err, `Não foi possível salvar o ${this.labelSingular}.`));
        }
      });
  }

  voltar(): void {
    this.router.navigate([this.rotaVolta], { queryParams: { tab: this.entity } });
  }

  formatarMoedaPreview(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format((this.reaisParaCentavos(this.form.valorBaseReais) || 0) / 100);
  }

  private carregarDetalhe(id: number): void {
    this.carregando = true;
    const request$ = this.entity === 'servicos'
      ? this.catalogoService.buscarServicoPorId$(id)
      : this.catalogoService.buscarAcabamentoPorId$(id);

    request$
      .pipe(finalize(() => (this.carregando = false)))
      .subscribe({
        next: (item) => {
          this.aplicarItem(item);
        },
        error: (err) => {
          this.toastr.error(extrairMensagemErro(err, `Não foi possível carregar o ${this.labelSingular}.`));
          this.voltar();
        }
      });
  }

  private aplicarItem(item: AdminOnboardingCatalogoServicoResponse | AdminOnboardingCatalogoAcabamentoResponse): void {
    this.form = {
      codigo: item.codigo,
      nome: item.nome,
      descricao: item.descricao ?? '',
      valorBaseReais: Number(((item.valorBaseCentavos || 0) / 100).toFixed(2)),
      ativo: item.ativo,
      ordemExibicao: item.ordemExibicao
    };
  }

  private criarFormPadrao(): ItemFormModel {
    return {
      codigo: '',
      nome: '',
      descricao: '',
      valorBaseReais: 0,
      ativo: true,
      ordemExibicao: null
    };
  }

  private reaisParaCentavos(valorReais: number | null): number {
    return Math.round((Number(valorReais || 0) + Number.EPSILON) * 100);
  }

  private normalizarTexto(texto: string): string | null {
    const valor = texto.trim();
    return valor ? valor : null;
  }

  private normalizarNumero(valor: number | null | undefined): number | null {
    return valor == null || Number.isNaN(Number(valor)) ? null : Number(valor);
  }
}
