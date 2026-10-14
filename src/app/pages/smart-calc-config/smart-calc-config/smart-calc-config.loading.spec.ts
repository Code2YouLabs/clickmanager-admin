import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { Subject, throwError } from 'rxjs';
import { ToastrService } from 'src/app/services/toastr.service';
import { CalculadoraConfigService } from '../calculadora-config.service';
import { CalculadoraConfigComponent } from './smart-calc-config.component';

describe('SmartCalc signal loading lifecycle', () => {
  let component: CalculadoraConfigComponent;
  let service: jasmine.SpyObj<CalculadoraConfigService>;
  beforeEach(() => {
    service = jasmine.createSpyObj('CalculadoraConfigService', ['salvar']);
    TestBed.configureTestingModule({ providers: [FormBuilder,
      { provide: CalculadoraConfigService, useValue: service },
      { provide: ToastrService, useValue: jasmine.createSpyObj('ToastrService', ['error', 'success']) }
    ] });
    component = TestBed.runInInjectionContext(() => new CalculadoraConfigComponent());
    component.form.controls.ativo.setValue(false);
  });
  it('resets saving after an HTTP error', () => {
    service.salvar.and.returnValue(throwError(() => new Error('HTTP')));
    component.onSubmit();
    expect(component.salvando()).toBeFalse();
  });
  it('resets saving and cancels on destruction', () => {
    const response = new Subject<any>();
    service.salvar.and.returnValue(response);
    component.onSubmit();
    expect(component.salvando()).toBeTrue();
    TestBed.resetTestingModule();
    expect(component.salvando()).toBeFalse();
    expect(response.observed).toBeFalse();
  });
});
