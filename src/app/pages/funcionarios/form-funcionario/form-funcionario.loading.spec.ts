import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ToastrService } from 'src/app/services/toastr.service';
import { UsuarioService } from 'src/app/pages/usuarios/services/usuario.service';
import { FuncionariosService } from '../services/funcionarios.service';
import { FormFuncionarioComponent } from './form-funcionario.component';

describe('FormFuncionarioComponent loading lifecycle', () => {
  let service: jasmine.SpyObj<FuncionariosService>;
  let users: jasmine.SpyObj<UsuarioService>;
  let component: FormFuncionarioComponent;
  beforeEach(() => {
    service = jasmine.createSpyObj('FuncionariosService', ['obterPorId$']);
    users = jasmine.createSpyObj('UsuarioService', ['listarVinculaveis', 'listar']);
    const toastr = jasmine.createSpyObj('ToastrService', ['error', 'warning']);
    const router = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({});
    component = TestBed.runInInjectionContext(() => new FormFuncionarioComponent(
      new FormBuilder(), { snapshot: { paramMap: { get: () => '10' } } } as unknown as ActivatedRoute,
      router as Router, service, users, toastr as ToastrService
    ));
  });

  it('ends loading after HTTP error and an empty employee response', () => {
    service.obterPorId$.and.returnValue(throwError(() => new Error('HTTP')));
    component.ngOnInit();
    expect(component.carregando).toBeFalse();
    service.obterPorId$.and.returnValue(of(null as any));
    component.ngOnInit();
    expect(component.carregando).toBeFalse();
  });

  it('ends loading on the terminated-employee early return', () => {
    service.obterPorId$.and.returnValue(of({ status: 'DESLIGADO' } as any));
    component.ngOnInit();
    expect(component.carregando).toBeFalse();
  });

  it('finalizes autocomplete on cancellation and starts only at subscription', () => {
    const response = new Subject<any>();
    users.listarVinculaveis.and.returnValue(response);
    const stream = (component as any).buscarUsuarios$('Maria');
    expect(component.carregandoUsuarios).toBeFalse();
    const subscription = stream.subscribe();
    expect(component.carregandoUsuarios).toBeTrue();
    subscription.unsubscribe();
    expect(component.carregandoUsuarios).toBeFalse();
  });
});
