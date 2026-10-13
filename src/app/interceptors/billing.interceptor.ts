import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { BillingStateService } from '../pages/billing/services/billing-state.service';
import { Router } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr.service';

@Injectable()
export class BillingInterceptor implements HttpInterceptor {
  private ignoredPaths = [
    '/auth/',
    '/authentication/',
    '/assets/',
    '/billing/blocked',
    '/billing/pay',
    '/billing/pagamento',
    '/billing/return'
  ];

  constructor(
    private billingState: BillingStateService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.deveIgnorar(req.url)) {
      return next.handle(req);
    }

    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.billingState.setFromHttpResponse(event.body, event.headers);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (this.deveIgnorar(req.url)) {
          return throwError(() => error);
        }

        if (error.status === 402) {
          const returnUrl = this.router.url;
          this.billingState.setReturnUrl(returnUrl);
          this.billingState.setFromHttpError(error, returnUrl);
          sessionStorage.setItem('billing_return_url', returnUrl);
          const inBillingFlow = this.router.url.includes('/billing/blocked') || this.router.url.includes('/billing/pagamento') || this.router.url.includes('/billing/return');
          if (!inBillingFlow) {
            this.router.navigate(['/billing/blocked'], { queryParams: { returnUrl } });
          }
        }

        if (error.status === 403 && this.isCheckout(req.url) && this.isOwnerOnlyMessage(error)) {
          const msg = error.error?.message || 'Apenas o proprietário pode regularizar.';
          this.toastr.error(msg);
          this.router.navigate(['/billing/blocked']);
        }

        return throwError(() => error);
      })
    );
  }

  private deveIgnorar(url: string): boolean {
    const lower = url.toLowerCase();
    return this.ignoredPaths.some(p => lower.includes(p)) || lower.startsWith('assets');
  }

  private isCheckout(url: string): boolean {
    return url.includes('/billing/checkout');
  }

  private isOwnerOnlyMessage(error: HttpErrorResponse): boolean {
    const msg = (error.error?.message || '').toString().toLowerCase();
    return msg.includes('propriet') || msg.includes('somente o proprietário');
  }
}
