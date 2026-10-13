import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ToastrService } from 'src/app/services/toastr.service';
import { forkJoin } from 'rxjs';
import { BillingService } from '../services/billing.service';
import { BillingStateService } from '../services/billing-state.service';
import { AuthService } from 'src/app/services/auth.service';
import { Usuario } from 'src/app/models/usuario/usuario.model';
import { BillingAccessResponse } from 'src/app/models/billing-access.model';

interface Pagamento {
  id: number;
  valor: number;
  status: string;
  criadoEm: string;
  confirmadoEm?: string;
  referenciaExterna?: string;
  invoiceUrl?: string;
}

@Component({
  selector: 'app-minha-assinatura',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    DatePipe,
    CurrencyPipe
  ],
  templateUrl: './minha-assinatura.component.html',
  styleUrls: ['./minha-assinatura.component.scss']
})
export class MinhaAssinaturaComponent implements OnInit {
  loading = true;
  resumo: any = null;
  billingAccess: BillingAccessResponse | null = null;
  pagamentos: Pagamento[] = [];
  usuario?: Usuario | null;
  acessoNegado = false;
  resumoCarregado = false;

  displayedColumns = ['valor', 'forma', 'criado', 'confirmado', 'status', 'referencia', 'link'];

  constructor(
    private billingService: BillingService,
    private billingState: BillingStateService,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.usuario$.subscribe(u => {
      this.usuario = u;
      this.acessoNegado = !u?.proprietario;

       if (this.acessoNegado) {
         this.loading = false;
         return;
       }

       if (!this.resumoCarregado) {
         this.resumoCarregado = true;
         this.carregarResumo();
       }
    });
  }

  carregarResumo(): void {
    this.loading = true;
    forkJoin({
      resumo: this.billingService.resumoAssinatura(),
      access: this.billingService.obterStatus()
    }).subscribe({
      next: ({ resumo, access }) => {
        this.billingAccess = access;
        this.billingState.setFromResponse(access);
        this.resumo = resumo;
        this.pagamentos = this.ordenarPagamentos(resumo?.pagamentos || []);
        this.loading = false;
      },
      error: () => {
        this.toastr.error('Não foi possível carregar a assinatura.');
        this.resumoCarregado = false;
        this.loading = false;
      }
    });
  }

  private ordenarPagamentos(pagamentos: Pagamento[]): Pagamento[] {
    return [...pagamentos].sort((a, b) => {
      const aPending = this.statusPendente(a.status) ? 1 : 0;
      const bPending = this.statusPendente(b.status) ? 1 : 0;
      if (aPending !== bPending) return bPending - aPending;
      return new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime();
    });
  }

  abrirLink(url?: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  statusPendente(status?: string): boolean {
    return (status || '').toUpperCase() === 'PENDENTE';
  }

  getStatusClass(status?: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'PENDENTE') return 'status-warning';
    if (s === 'APROVADO') return 'status-success';
    if (s === 'RECUSADO' || s === 'CANCELADO' || s === 'ESTORNADO' || s === 'CHARGEBACK') return 'status-error';
    return 'status-neutral';
  }

  getStatusLabel(status?: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'PENDENTE') return 'Pendente';
    if (s === 'APROVADO') return 'Aprovado';
    if (s === 'RECUSADO') return 'Recusado';
    if (s === 'CANCELADO') return 'Cancelado';
    if (s === 'ESTORNADO') return 'Estornado';
    if (s === 'CHARGEBACK') return 'Chargeback';
    return status || '—';
  }

  isPendingRow(p: Pagamento): boolean {
    return this.statusPendente(p.status);
  }

  get beneficios(): string[] {
    const raw = this.resumo?.beneficiosJson;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  get limites(): string[] {
    const raw = this.resumo?.limitesJson;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object' && parsed !== null) {
        return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`);
      }
      return [];
    } catch {
      return [];
    }
  }

  get emTrial(): boolean {
    const status = (this.resumo?.status || '').toString().toUpperCase();
    return status.includes('TRIAL');
  }

  get podeTrocarPlano(): boolean {
    return this.usuario?.proprietario === true;
  }

  get ctaPlanoLabel(): string {
    return this.emTrial ? 'Escolher plano' : 'Trocar plano';
  }

  get mostrarAlertaCobranca(): boolean {
    return this.billingAccess?.warning === true || this.billingAccess?.allowed === false;
  }

  get alertTitle(): string {
    if (this.billingAccess?.allowed === false) return 'Assinatura suspensa';
    if (this.statusAssinatura === 'INADIMPLENTE') return 'Pagamento pendente';
    return 'Cobrança próxima';
  }

  get alertSubtitle(): string {
    if (this.billingAccess?.allowed === false) return 'Regularize agora para reativar o acesso ao sistema.';
    return 'Regularize para evitar bloqueio de acesso.';
  }

  get urgencyBadge(): string {
    return this.dueLabel || 'Atenção de cobrança';
  }

  get dueLabel(): string | null {
    const hasDiasField = !!this.resumo && (
      Object.prototype.hasOwnProperty.call(this.resumo, 'diasVencimento') ||
      Object.prototype.hasOwnProperty.call(this.resumo, 'diasVencidos')
    );

    if (hasDiasField) {
      const diasResumoRaw = this.resumo?.diasVencimento ?? this.resumo?.diasVencidos;
      if (diasResumoRaw === null || diasResumoRaw === undefined || diasResumoRaw === '') {
        return null;
      }
      const parsed = typeof diasResumoRaw === 'number' ? diasResumoRaw : Number(diasResumoRaw);
      return Number.isFinite(parsed) ? this.billingState.formatDaysLabel(Math.trunc(parsed)) : null;
    }

    return this.billingState.formatDaysLabel(this.billingAccess?.days);
  }

  get statusAssinatura(): string {
    return (this.resumo?.status || '-').toString().toUpperCase();
  }

  get situacaoAssinatura(): string {
    if (this.dueLabel) return this.dueLabel;
    if (this.statusAssinatura === 'ATIVA') return 'Assinatura ativa e regular';
    if (this.statusAssinatura === 'INADIMPLENTE') return 'Pagamento pendente de regularização';
    if (this.statusAssinatura.includes('TRIAL')) return 'Período de teste em andamento';
    return 'Verifique os dados de cobrança da assinatura';
  }

  get classeStatus(): string {
    if (this.statusAssinatura === 'ATIVA') return 'status-ok';
    if (this.statusAssinatura.includes('TRIAL')) return 'status-trial';
    if (this.statusAssinatura === 'INADIMPLENTE') return 'status-alerta';
    if (this.billingAccess?.allowed === false) return 'status-bloqueado';
    return 'status-neutro';
  }

  get mostrarAcaoRegularizacao(): boolean {
    if (!this.usuario?.proprietario) return false;
    return this.mostrarAlertaCobranca || this.statusAssinatura === 'INADIMPLENTE';
  }

  irParaPlanos(): void {
    this.router.navigate(['/billing/pagamento']);
  }
}
