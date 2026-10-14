import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { BillingService } from '../services/billing.service';
import { BillingStateService } from '../services/billing-state.service';
import { AuthService } from 'src/app/services/auth.service';
import { ToastrService } from 'src/app/services/toastr.service';
import { BillingPagamentoComponent } from './billing-pagamento.component';

describe('BillingPagamentoComponent loading lifecycle', () => {
  let component: BillingPagamentoComponent;
  let service: jasmine.SpyObj<BillingService>;
  beforeEach(() => {
    service = jasmine.createSpyObj('BillingService', ['checkoutAssinatura']);
    TestBed.configureTestingModule({});
    component = TestBed.runInInjectionContext(() => new BillingPagamentoComponent({} as BillingStateService, service,
      jasmine.createSpyObj('ToastrService', ['error', 'warning']) as ToastrService,
      {} as Router, {} as ActivatedRoute, {} as AuthService));
    component.planoSelecionado = { id: 1 } as any;
  });
  it('ends loading on an HTTP error, including owner denial', () => {
    service.checkoutAssinatura.and.returnValue(throwError(() => ({ status: 403 })));
    component.irParaPagamento();
    expect(component.ownerDenied).toBeTrue();
    expect(component.loading).toBeFalse();
  });
  it('cancels checkout on destruction', () => {
    const response = new Subject<any>();
    service.checkoutAssinatura.and.returnValue(response);
    component.irParaPagamento();
    expect(component.loading).toBeTrue();
    TestBed.resetTestingModule();
    expect(component.loading).toBeFalse();
    expect(response.observed).toBeFalse();
  });
  it('ends loading when the response has no payment URL', () => {
    service.checkoutAssinatura.and.returnValue(of({ provider: 'ASAAS' }));
    component.irParaPagamento();
    expect(component.loading).toBeFalse();
  });
});
