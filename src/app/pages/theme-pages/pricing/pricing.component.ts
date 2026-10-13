import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { BillingService } from 'src/app/pages/billing/services/billing.service';
import { PlanoPublico } from 'src/app/types/plano-publico.type';
import { ToastrService } from 'src/app/services/toastr.service';
import { Router } from '@angular/router';
import { CurrencyPipe, NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-pricing',
    imports: [DesignSystemIconsModule, MatCardModule, MatSlideToggleModule, MatButtonModule, MatSlideToggleModule, CurrencyPipe, NgIf, NgFor],
    templateUrl: './pricing.component.html',
})
export class AppPricingComponent implements OnInit {
  planos: PlanoPublico[] = [];
  loading = false;

  constructor(
    private billingService: BillingService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.billingService.listarPlanosPublicos().subscribe({
      next: (planos) => {
        this.planos = (planos || []).sort((a, b) => (a.ordem_exibicao || 0) - (b.ordem_exibicao || 0));
        this.loading = false;
      },
      error: () => {
        this.toastr.error('Não foi possível carregar os planos.');
        this.loading = false;
      }
    });
  }

  escolherPlano(plano: PlanoPublico): void {
    this.router.navigate(['/billing/pagamento'], { queryParams: { planoId: plano.id, from: 'pricing' } });
  }

  preco(plano: PlanoPublico): number {
    return (plano.preco_centavos || 0) / 100;
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
}
