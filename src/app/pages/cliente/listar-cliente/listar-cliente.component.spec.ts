import { ApplicationRef, NgZone, provideZoneChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ToastrService } from 'src/app/services/toastr.service';
import { ListarClienteComponent } from './listar-cliente.component';

describe('Legacy Clientes HTTP DOM regression (AOT)', () => {
  let fixture: ComponentFixture<ListarClienteComponent>;
  let http: HttpTestingController;
  let zone: NgZone;
  const request = () => http.expectOne(req => req.url.includes('/api/clientes?'));
  const html = () => fixture.nativeElement as HTMLElement;
  async function respond(req: TestRequest, body: object | null, error = false) {
    await new Promise<void>(resolve => setTimeout(() => {
      zone.run(() => error ? req.flush(body, { status: 500, statusText: 'Error' }) : req.flush(body));
      resolve();
    }));
    await fixture.whenStable();
    TestBed.inject(ApplicationRef).tick();
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ListarClienteComponent], providers: [
      provideZoneChangeDetection(), provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(), provideRouter([]),
      { provide: AuthService, useValue: { temPermissao: () => true } },
      { provide: ToastrService, useValue: { error: jasmine.createSpy('error') } }
    ] }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    zone = TestBed.inject(NgZone);
    fixture = TestBed.createComponent(ListarClienteComponent);
    fixture.autoDetectChanges();
  });
  afterEach(() => { fixture.destroy(); http.verify(); });

  it('renders a customer row after HTTP without forcing component detection', async () => {
    await respond(request(), { content: [{ id: 1, nome: 'Cliente legado', email: 'cliente@test.com', telefone: null }], totalElements: 1 });
    expect(html().querySelector('td')?.textContent).toContain('Cliente legado');
    expect(fixture.componentInstance.carregando).toBeFalse();
  });

  it('renders an empty table for a response with no body', async () => {
    await respond(request(), null);
    expect(html().querySelector('td')).toBeNull();
    expect(fixture.componentInstance.carregando).toBeFalse();
  });

  it('cancels an older search and renders only the latest response', async () => {
    const old = request();
    zone.run(() => fixture.componentInstance.onPesquisar('Atual'));
    expect(old.cancelled).toBeTrue();
    await respond(request(), { content: [{ id: 2, nome: 'Atual', email: '', telefone: null }], totalElements: 1 });
    expect(html().querySelector('td')?.textContent).toContain('Atual');
  });

  it('ends loading after error, empty response and destruction', async () => {
    await respond(request(), {}, true);
    expect(fixture.componentInstance.carregando).toBeFalse();
    zone.run(() => fixture.componentInstance.carregarClientes());
    await respond(request(), { content: [], totalElements: 0 });
    expect(html().querySelector('td')).toBeNull();
    zone.run(() => fixture.componentInstance.carregarClientes());
    const pending = request();
    fixture.destroy();
    expect(pending.cancelled).toBeTrue();
    expect(fixture.componentInstance.carregando).toBeFalse();
  });
});
