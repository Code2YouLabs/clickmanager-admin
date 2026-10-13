import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { BillingService } from '../services/billing.service';
import { BillingStateService } from '../services/billing-state.service';
import { ToastrService } from 'src/app/services/toastr.service';

@Component({
  selector: 'app-billing-return',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './billing-return.component.html',
  styleUrls: ['./billing-return.component.scss']
})
export class BillingReturnComponent implements OnInit, OnDestroy {
  loading = true;
  attempts = 0;
  maxAttempts = 12; // 12 * 5s = 60s
  sub?: Subscription;

  constructor(
    private billingService: BillingService,
    private billingState: BillingStateService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.iniciarValidacao();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  iniciarValidacao(): void {
    this.loading = true;
    this.attempts = 0;
    this.sub?.unsubscribe();

    this.sub = timer(0, 5000)
      .pipe(
        takeWhile(() => this.attempts < this.maxAttempts),
        switchMap(() => {
          this.attempts++;
          return this.billingService.obterStatus();
        })
      )
      .subscribe({
        next: (resp) => {
          if (resp?.allowed) {
            this.billingState.setFromResponse(resp);
            this.redirecionarSucesso();
          } else if (resp?.allowed === false) {
            this.billingState.setFromResponse(resp);
            this.router.navigate(['/billing/blocked']);
            this.parar();
          }
        },
        error: () => {
          // se voltar 402, o interceptor já redireciona; aqui só paramos o polling
          this.parar();
        }
      });
  }

  tentarNovamente(): void {
    this.iniciarValidacao();
  }

  private parar(): void {
    this.loading = false;
    this.sub?.unsubscribe();
  }

  private redirecionarSucesso(): void {
    const returnUrl = this.billingState.getReturnUrl() || sessionStorage.getItem('billing_return_url') || '/';
    this.parar();
    this.router.navigateByUrl(returnUrl);
    this.toastr.success('Assinatura validada com sucesso.');
  }
}
