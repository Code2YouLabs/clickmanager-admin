import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { BillingService } from 'src/app/pages/billing/services/billing.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastrService } from 'src/app/services/toastr.service';
import { BillingStateService } from 'src/app/pages/billing/services/billing-state.service';
import { CardHeaderComponent } from 'src/app/components/card-header/card-header.component';

@Component({
  selector: 'app-billing-pay',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatButtonModule, MatCardModule, CardHeaderComponent],
  templateUrl: './billing-pay.component.html',
  styleUrls: ['./billing-pay.component.scss']
})
export class BillingPayComponent implements OnInit {
  constructor(
    private billingService: BillingService,
    private authService: AuthService,
    private toastr: ToastrService,
    private router: Router,
    private route: ActivatedRoute,
    private billingState: BillingStateService
  ) {}

  ngOnInit(): void {
    let user: any;
    try {
      user = this.authService.getUsuario();
    } catch {
      user = null;
    }
    if (!user?.proprietario) {
      this.toastr.error('Somente o proprietário pode regularizar a assinatura.');
      this.router.navigate(['/billing/blocked']);
      return;
    }
    this.billingService.checkout().subscribe({
      next: (resp) => {
        const link = resp?.linkPagamento;
        if (link) {
          window.location.href = link;
        } else {
          this.toastr.error('Não foi possível iniciar o checkout.');
          this.router.navigate(['/billing/blocked']);
        }
      },
      error: () => {
        this.toastr.error('Não foi possível iniciar o checkout.');
        this.router.navigate(['/billing/blocked']);
      }
    });
  }

  voltar(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || this.billingState.snapshot?.returnUrl;
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/']);
    }
  }
}
