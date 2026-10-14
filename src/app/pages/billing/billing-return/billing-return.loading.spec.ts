import { fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { EMPTY, Subject, of, throwError } from 'rxjs';
import { BillingService } from '../services/billing.service';
import { BillingStateService } from '../services/billing-state.service';
import { ToastrService } from 'src/app/services/toastr.service';
import { BillingReturnComponent } from './billing-return.component';

describe('BillingReturnComponent loading lifecycle', () => {
  let component: BillingReturnComponent;
  let service: jasmine.SpyObj<BillingService>;
  beforeEach(() => {
    service = jasmine.createSpyObj('BillingService', ['obterStatus']);
    component = new BillingReturnComponent(service, {} as BillingStateService, {} as Router, {} as ToastrService);
    component.maxAttempts = 2;
  });
  afterEach(() => component.ngOnDestroy());

  it('ends loading when polling completes with no response', fakeAsync(() => {
    service.obterStatus.and.returnValue(EMPTY);
    component.iniciarValidacao();
    tick(10000);
    expect(component.attempts).toBe(2);
    expect(component.loading).toBeFalse();
  }));
  it('ends loading on HTTP errors', fakeAsync(() => {
    service.obterStatus.and.returnValue(throwError(() => new Error('HTTP')));
    component.iniciarValidacao();
    tick(0);
    expect(component.loading).toBeFalse();
  }));
  it('keeps a restarted poll loading and releases it on destruction', fakeAsync(() => {
    const response = new Subject<any>();
    service.obterStatus.and.returnValue(response);
    component.iniciarValidacao();
    tick(0);
    component.tentarNovamente();
    expect(component.loading).toBeTrue();
    tick(0);
    component.ngOnDestroy();
    expect(component.loading).toBeFalse();
    expect(response.observed).toBeFalse();
  }));
});
