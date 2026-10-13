import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ToastrService } from 'src/app/services/toastr.service';
import { BillingStateService } from 'src/app/pages/billing/services/billing-state.service';
import { BillingService } from 'src/app/pages/billing/services/billing.service';
import { PlanoPublico } from 'src/app/types/plano-publico.type';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';
import { BillingAccessResponse } from 'src/app/models/billing-access.model';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { PricingCardComponent } from 'src/app/components/pricing-card/pricing-card.component';
import { AuthService } from 'src/app/services/auth.service';
import { Usuario } from 'src/app/models/usuario/usuario.model';
import { CheckoutResponse } from 'src/app/models/billing-access.model';

@Component({
  selector: 'app-billing-pagamento',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule, MatCardModule, CardHeaderComponent, DesignSystemIconsModule, PricingCardComponent],
  templateUrl: './billing-pagamento.component.html',
  styleUrls: ['./billing-pagamento.component.scss']
})
export class BillingPagamentoComponent implements OnInit {
  billing: BillingAccessResponse | null = null;
  loading = false;
  ownerDenied = false;
  returnUrl: string | null = null;
  planos: PlanoPublico[] = [];
  planoSelecionado: PlanoPublico | null = null;
  checkoutIndisponivel = false;
  usuario?: Usuario | null;
  private readonly fallbackCheckoutEndpoint = 'api/assinaturas/checkout';

  constructor(
    private billingState: BillingStateService,
    private billingService: BillingService,
    private toastr: ToastrService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.usuario$.subscribe(u => this.usuario = u);
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.billing = this.billingState.snapshot;

    if (!this.billing) {
      this.carregarStatus();
    } else {
      this.verificarPlanos();
      if (!this.billing.checkoutUrl) {
        this.carregarStatus();
      }
    }
  }

  private carregarStatus(): void {
    this.billingService.obterStatus().subscribe({
      next: (resp) => {
        this.billingState.setFromResponse(resp);
        this.billing = resp;
        this.verificarPlanos();
        this.checkoutIndisponivel = !resp?.checkoutUrl;
      },
      error: () => {
        // se 402, o interceptor já redireciona. Aqui evitamos travar o botão.
        this.billing = this.billingState.snapshot;
        if (!this.billing) {
          this.toastr.error('Não foi possível carregar o status de assinatura.');
        } else if (!this.billing.checkoutUrl) {
          this.checkoutIndisponivel = true;
        }
      }
    });
  }

  private verificarPlanos(): void {
    this.billingService.listarPlanosPublicos().subscribe({
      next: (planos) => {
        const comDefaults = (planos || []).map((plano, idx) => ({
          ...plano,
          // normaliza campos vindos do back (camelCase) para os consumidos pelo front
          preco_centavos: plano.preco_centavos ?? (plano as any).precoCentavos,
          beneficios_json: plano.beneficios_json ?? (plano as any).beneficiosJson,
          limites_json: plano.limites_json ?? (plano as any).limitesJson,
          periodicidade: plano.periodicidade ?? (plano as any).periodicidade,
          destaque: plano.destaque ?? (plano as any).destaque ?? null,
          imgSrc: plano.imgSrc || this.fallbackImg(idx),
          popular: plano.popular ?? (!!((plano as any).destaque) ? true : idx === 1),
        }));
        this.planos = comDefaults.sort((a, b) => (a.ordem_exibicao || 0) - (b.ordem_exibicao || 0));
        if (this.billing?.planoId) {
          this.planoSelecionado = this.planos.find((plano) => plano.id === this.billing?.planoId) || null;
          if (this.planoSelecionado?.id) {
            sessionStorage.setItem('billing_selected_plan', this.planoSelecionado.id.toString());
          }
        } else {
          const stored = sessionStorage.getItem('billing_selected_plan');
          if (stored) {
            const found = this.planos.find(p => p.id?.toString() === stored);
            this.planoSelecionado = found || null;
          } else {
            this.planoSelecionado = null;
          }
        }
      },
      error: () => {
        this.toastr.error('Não foi possível carregar os planos disponíveis.');
      }
    });
  }

  get badgeLabel(): string {
    if (this.billing?.type === 'PRE_DUE' || this.billing?.type === 'POST_DUE') return 'Aviso';
    if (this.billing?.type === 'BLOCKED') return 'Acesso bloqueado';
    return '';
  }

  get podePagar(): boolean {
    if (this.ownerDenied) return false;
    if (!this.billing?.checkoutUrl) return false;
    return true; // sempre habilitado quando há checkoutUrl
  }

  getBeneficios(plano: PlanoPublico): string[] {
    const beneficios = plano.beneficios_json;
    if (!beneficios) return [];
    if (Array.isArray(beneficios)) return beneficios as string[];
    try {
      const parsed = JSON.parse(beneficios);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private get isProprietario(): boolean {
    if (this.billing?.proprietario === false || this.usuario?.proprietario === false) {
      return false;
    }
    if (this.billing?.proprietario === true || this.usuario?.proprietario === true) {
      return true;
    }
    // se ainda não sabemos, deixamos o backend validar (evita travar botão)
    return true;
  }

  preco(plano: PlanoPublico): number {
    return (plano.preco_centavos || 0) / 100;
  }

  precoAnual(plano: PlanoPublico): number {
    return this.preco(plano) * 12;
  }

  selecionar(plano: PlanoPublico): void {
    this.planoSelecionado = plano;
    if (plano?.id) {
      sessionStorage.setItem('billing_selected_plan', plano.id.toString());
    }
  }

  private fallbackImg(idx: number): string {
    const assets = [
      'assets/images/backgrounds/silver.png',
      'assets/images/backgrounds/bronze.png',
      'assets/images/backgrounds/gold.png',
    ];
    return assets[idx % assets.length];
  }

  irParaPagamento(): void {
    // Usa sempre o endpoint atual de checkout de assinaturas (Asaas)
    const checkoutEndpoint = this.fallbackCheckoutEndpoint;
    if (!this.planoSelecionado?.id) {
      this.toastr.warning('Selecione um plano para continuar.');
      return;
    }

    this.loading = true;
    const body: any = { planoId: this.planoSelecionado.id };

    const obs = checkoutEndpoint === this.fallbackCheckoutEndpoint
      ? this.billingService.checkoutAssinatura(this.planoSelecionado.id)
      : this.billingService.checkoutUrl(checkoutEndpoint, body);

    obs.subscribe({
      next: (resp: CheckoutResponse) => {
        const invoiceUrl = resp?.initPoint || (resp as any)?.invoiceUrl;
        if (invoiceUrl) {
          sessionStorage.setItem('asaas_last_payment_id', resp?.paymentReference || resp?.paymentId || '');
          sessionStorage.setItem('asaas_last_invoice_url', invoiceUrl);
          window.location.href = invoiceUrl;
        } else {
          this.toastr.error('Não foi possível iniciar o checkout.');
        }
      },
      error: (err) => {
        if (err?.status === 403) {
          this.ownerDenied = true;
          this.toastr.error(err?.error?.message || 'Somente o proprietário pode regularizar a assinatura.');
        } else if (err?.error?.billing) {
          this.billingState.setFromErrorBody(err, this.router.url);
          this.billing = this.billingState.snapshot;
          this.toastr.error(this.billing?.message || 'Acesso bloqueado.');
        } else {
          this.toastr.error('Não foi possível iniciar o checkout.');
        }
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  voltar(): void {
    if (this.returnUrl) {
      this.router.navigateByUrl(this.returnUrl);
    } else {
      this.router.navigate(['/billing/blocked']);
    }
  }
}
