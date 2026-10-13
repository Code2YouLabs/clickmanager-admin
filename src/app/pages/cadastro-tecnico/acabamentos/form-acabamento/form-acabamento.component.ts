
import {
  Component,
  OnInit
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr.service';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';

import { Observable } from 'rxjs';

import { AcabamentoService } from '../acabamento.service';
import { AcabamentoRequest } from 'src/app/models/acabamento/acabamento-request.model';
import { AcabamentoResponse } from 'src/app/models/acabamento/acabamento-response.model';
import { AcabamentoVariacaoResponse } from 'src/app/models/acabamento/acabamento-variacao-response.model';
import { AcabamentoVariacaoRequest } from 'src/app/models/acabamento/acabamento-variacao-request.model';
import { PrecoRequest } from 'src/app/models/preco/preco.model';

import { InputTextoRestritoComponent } from '../../../../components/inputs/input-texto/input-texto-restrito.component';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { AcabamentoVariacaoForm, VariacoesAcabamentoComponent } from '../variacoes-acabamento/variacoes-acabamento.component';
import { extrairMensagemErro } from 'src/app/utils/mensagem.util';

@Component({
  selector: 'app-form-acabamento',
  standalone: true,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatTabsModule,
    InputTextoRestritoComponent,
    CardHeaderComponent,
    VariacoesAcabamentoComponent
],
  templateUrl: './form-acabamento.component.html',
  styleUrl: './form-acabamento.component.scss'
})
export class FormAcabamentoComponent implements OnInit {

  form!: FormGroup;
  isEditMode = false;
  acabamentoId!: number;

  /** variações atuais (emitidas pelo filho) */
  variacoes: AcabamentoVariacaoForm[] = [];

  /** seed para edição (preenche o componente de variações) */
  variacoesIniciais: AcabamentoVariacaoResponse[] = [];

  loading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly acabamentoService: AcabamentoService,
    private readonly toastr: ToastrService
  ) { }

  // ============ lifecycle ============

  ngOnInit(): void {
    this.buildForm();
    this.detectEditModeAndLoad();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(120)]],
      descricao: ['', [Validators.required, Validators.maxLength(1000)]],
    });
  }

  private detectEditModeAndLoad(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!idParam;

    if (!this.isEditMode) {
      return;
    }

    this.acabamentoId = Number(idParam);
    if (!Number.isFinite(this.acabamentoId)) {
      return;
    }

    this.carregarAcabamento(this.acabamentoId);
  }

  // ============ load ============

  private carregarAcabamento(id: number): void {
    this.loading = true;

    this.acabamentoService.buscarPorId(id).subscribe({
      next: (acabamento: AcabamentoResponse) => {
        this.patchAcabamento(acabamento);
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(extrairMensagemErro(err, 'Erro ao carregar acabamento.'));
        this.router.navigate(['/page/cadastro-tecnico/acabamentos']);
      }
    });
  }

  private patchAcabamento(acabamento: AcabamentoResponse): void {
    this.form.patchValue({
      nome: acabamento?.nome ?? '',
      descricao: acabamento?.descricao ?? '',
    });

    this.variacoesIniciais = acabamento.variacoes ?? [];
  }

  // ============ variações (filho) ============

  onVariacoesChange(lista: AcabamentoVariacaoForm[]): void {
    this.variacoes = Array.isArray(lista)
      ? lista.filter(v => v && typeof v === 'object')
      : [];
  }

  // ============ submit ============

  onSubmit(): void {
    if (this.form.invalid) {
      this.markFormControlsAsTouched();
      this.toastr.error('Preencha os campos obrigatórios.');
      return;
    }

    if (!Array.isArray(this.variacoes) || !this.variacoes.length) {
      this.toastr.error('Adicione pelo menos uma variação antes de salvar.');
      return;
    }

    // Valida se todas as variações possuem tipoAplicacao e preço válido
    const invalid = this.variacoes.find(v => this.isInvalidVariacao(v));
    if (invalid) {
      this.toastr.error('Há variações com dados inválidos. Verifique tipo de aplicação, material, formato e preço.');
      return;
    }

    const payload = this.toAcabamentoRequest(this.form.getRawValue());

    this.loading = true;

    const acao: Observable<AcabamentoResponse> = this.isEditMode
      ? this.acabamentoService.atualizar(this.acabamentoId, payload)
      : this.acabamentoService.salvar(payload);

    acao.subscribe({
      next: () => {
        const mensagem = this.isEditMode ? 'atualizado' : 'criado';
        this.toastr.success(`Acabamento ${mensagem} com sucesso!`);
        this.loading = false;
        this.router.navigate(['/page/cadastro-tecnico/acabamentos']);
      },
      error: (err) => {
        const mensagem = this.isEditMode ? 'atualizar' : 'criar';
        this.loading = false;
        this.toastr.error(extrairMensagemErro(err, `Erro ao ${mensagem} acabamento.`));
      }
    });
  }

  // ============ mapeamento payload ============

  private toAcabamentoRequest(formValue: any): AcabamentoRequest {
    return {
      nome: String(formValue?.nome ?? '').trim(),
      descricao: String(formValue?.descricao ?? '').trim(),
      variacoes: this.toVariacoesRequest(this.variacoes),
    };
  }

  private toVariacoesRequest(lista: AcabamentoVariacaoForm[]): AcabamentoVariacaoRequest[] {
    return (lista ?? []).map((v: AcabamentoVariacaoForm) => {
      const materialId = this.extractId(v.materialId);
      const formatoId = this.extractId(v.formatoId);

      if (!v.tipoAplicacao) {
        throw new Error('Variação inválida: tipoAplicacao é obrigatório.');
      }

      if (!materialId && !formatoId) {
        // Se quiser forçar pelo menos um deles:
        // throw new Error('Variação inválida: informe material, formato ou ambos.');
      }

      if (!v.preco?.tipo) {
        throw new Error('Variação inválida: tipo de preço ausente.');
      }

      return {
        ...(v.id ? { id: Number(v.id) } : {}),
        materialId: materialId ?? null,
        formatoId: formatoId ?? null,
        tipoAplicacao: v.tipoAplicacao,
        preco: this.toPrecoRequest(v.preco),
        ativo: v.ativo ?? true,
      } as AcabamentoVariacaoRequest;
    });
  }

  private toPrecoRequest(preco: any): PrecoRequest {
    if (!preco?.tipo) throw new Error('Preço inválido na variação.');
    const p = preco ?? {};

    switch (preco.tipo) {
      case 'FIXO':
        return { tipo: 'FIXO', valor: this.num(p.valor) };

      case 'QUANTIDADE':
        return {
          tipo: 'QUANTIDADE',
          faixas: (p.faixas ?? []).map((f: any) => ({
            quantidade: this.num(f.quantidade),
            valor: this.num(f.valor),
          })),
        };

      case 'DEMANDA':
        return {
          tipo: 'DEMANDA',
          faixas: (p.faixas ?? []).map((f: any) => ({
            de: this.num(f.de),
            ate: this.num(f.ate),
            valorUnitario: this.num(f.valorUnitario),
          })),
        };

      case 'METRO':
        return {
          tipo: 'METRO',
          precoMetro: this.num(p.precoMetro),
          modoCobranca: p.modoCobranca ?? 'QUADRADO',
          ...(p.precoMinimo != null ? { precoMinimo: this.num(p.precoMinimo) } : {}),
          ...(p.alturaMaxima != null ? { alturaMaxima: this.num(p.alturaMaxima) } : {}),
          ...(p.larguraMaxima != null ? { larguraMaxima: this.num(p.larguraMaxima) } : {}),
          ...(p.largurasLinearesPermitidas
            ? { largurasLinearesPermitidas: String(p.largurasLinearesPermitidas) }
            : {}),
        } as PrecoRequest;

      case 'HORA':
        return {
          tipo: 'HORA',
          valorHora: this.num(p.valorHora),
        } as any;

      default:
        throw new Error(`Tipo de preço desconhecido: ${preco?.tipo}`);
    }
  }

  // ============ helpers ============

  private isInvalidVariacao(v: AcabamentoVariacaoForm): boolean {
    if (!v || typeof v !== 'object') return true;

    if (!v.tipoAplicacao) return true;
    if (!v.preco || !v.preco.tipo) return true;

    // materialId e formatoId são opcionais (podem ser genéricos), então não valido aqui
    return false;
  }

  private extractId(val: any): number | null {
    if (val == null) return null;
    if (typeof val === 'number') return Number(val);
    if (typeof val === 'string' && /^\d+$/.test(val)) return Number(val);
    if (typeof val === 'object') {
      if ('id' in val && val.id != null) return Number(val.id);
      if ('value' in val && val.value != null) return Number(val.value);
    }
    return null;
  }

  private num(v: any): number {
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error('Valor numérico inválido.');
    return n;
  }

  private markFormControlsAsTouched(): void {
    Object.values(this.form.controls).forEach(control => control.markAsTouched());
  }

  // ============ getters convenientes p/ template ============

  get nomeControl(): FormControl {
    return this.form.get('nome') as FormControl;
  }

  get descricaoControl(): FormControl {
    return this.form.get('descricao') as FormControl;
  }
}
