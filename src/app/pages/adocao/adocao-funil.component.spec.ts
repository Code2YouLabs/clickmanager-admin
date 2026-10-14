import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { ToastrService } from 'src/app/services/toastr.service';
import { AdocaoFunilComponent } from './adocao-funil.component';
import { AdminAdocaoFunilResponse } from './models/admin-adocao-funil.model';
import { AdminAdocaoService } from './services/admin-adocao.service';

describe('AdocaoFunilComponent', () => {
  let service: jasmine.SpyObj<AdminAdocaoService>;
  let router: jasmine.SpyObj<Router>;
  let queryParams$: BehaviorSubject<Record<string, string>>;
  let component: AdocaoFunilComponent;

  beforeEach(() => {
    service = jasmine.createSpyObj<AdminAdocaoService>('AdminAdocaoService', ['consultarFunil$']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    queryParams$ = new BehaviorSubject<Record<string, string>>({});

    service.consultarFunil$.and.returnValue(of(funilCompleto()));

    component = new AdocaoFunilComponent(
      service,
      { queryParams: queryParams$.asObservable() } as ActivatedRoute,
      router,
      { error: jasmine.createSpy('error') } as unknown as ToastrService
    );
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('restaura filtros de query params e carrega a coorte', () => {
    queryParams$.next({ inicio: '2026-10-01', fim: '2026-10-31', segmento: 'GRAFICA' });
    component.ngOnInit();

    expect(service.consultarFunil$).toHaveBeenCalledWith({
      inicio: '2026-10-01',
      fim: '2026-10-31',
      segmento: 'GRAFICA'
    });
    expect(component.funil?.coorte.totalEmpresas).toBe(100);
  });

  it('bloqueia request quando periodo esta invertido', () => {
    queryParams$.next({ inicio: '2026-11-01', fim: '2026-10-31', segmento: 'GRAFICA' });
    component.ngOnInit();

    expect(service.consultarFunil$).not.toHaveBeenCalled();
    expect(component.erroPeriodo).toContain('data inicial');
  });

  it('altera filtros pela url e nao chama backend diretamente no apply', () => {
    component.inicio = '2026-10-01';
    component.fim = '2026-10-31';
    component.segmento = 'GRAFICA';

    component.aplicarFiltros();

    expect(router.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: {
        inicio: '2026-10-01',
        fim: '2026-10-31',
        segmento: 'GRAFICA'
      },
      queryParamsHandling: 'merge'
    }));
  });

  it('renderiza labels, percentuais recebidos e nao mostra null como percentual', () => {
    component.ngOnInit();

    const primeira = component.funil!.etapas[0];
    const ativada = component.funil!.etapas[4];

    expect(component.etapaLabel(primeira.codigo)).toBe('Empresas criadas');
    expect(component.conversaoAnterior(primeira)).toBe('Base da coorte');
    expect(component.conversaoAnterior(ativada)).toBe('100% avançaram');
    expect(component.formatarPercentual(null)).toBe('Indisponível');
    expect(component.larguraEtapa(ativada)).toBe(45);
  });

  it('mantem primeira movimentacao e ativada mesmo quando quantidades sao iguais', () => {
    component.ngOnInit();

    expect(component.funil!.etapas.map((etapa) => etapa.codigo)).toEqual([
      'EMPRESAS_CRIADAS',
      'CONFIGURACAO_CONCLUIDA',
      'PRIMEIRO_PEDIDO',
      'PRIMEIRA_MOVIMENTACAO',
      'ATIVADA'
    ]);
    expect(component.funil!.etapas[3].quantidade).toBe(45);
    expect(component.funil!.etapas[4].quantidade).toBe(45);
  });

  it('trata coorte vazia sem NaN e sem valores quebrados', () => {
    service.consultarFunil$.and.returnValue(of(funilVazio()));

    component.ngOnInit();

    expect(component.coorteVazia).toBeTrue();
    expect(component.resumoCards[0].valor).toBe('0');
    expect(component.resumoCards[2].valor).toBe('Indisponível');
  });

  it('formata ttv com mediana, media, amostra parcial e indisponivel sem exibir 0s', () => {
    component.ngOnInit();

    expect(component.formatarTtvValor(component.funil!.timeToValue.desdeCriacao.medianaSegundos, 31)).toBe('3h 18min');
    expect(component.formatarTtvValor(component.funil!.timeToValue.desdeCriacao.mediaSegundos, 31)).toBe('5h 42min');
    expect(component.ttvDescricao(component.funil!.timeToValue.desdeCriacao)).toContain('31 empresa');
    expect(component.formatarTtvValor(null, 0)).toBe('Indisponível');
    expect(component.ttvDescricao(component.funil!.timeToValue.desdeConfiguracao)).toContain('dados temporais suficientes');
  });

  it('mostra erro e retry refaz consulta', () => {
    service.consultarFunil$.and.returnValues(
      throwError(() => ({ userMessage: 'Falha controlada' })),
      of(funilCompleto())
    );

    component.ngOnInit();
    expect(component.erro).toBe('Falha controlada');
    expect(component.funil).toBeNull();

    component.tentarNovamente();

    expect(service.consultarFunil$).toHaveBeenCalledTimes(2);
    expect(component.erro).toBe('');
    expect(component.funil?.coorte.totalEmpresas).toBe(100);
  });

  it('encerra o carregamento assim que recebe a primeira resposta', () => {
    const resposta = new Subject<AdminAdocaoFunilResponse>();
    service.consultarFunil$.and.returnValue(resposta.asObservable());

    component.ngOnInit();
    expect(component.carregando).toBeTrue();

    resposta.next(funilCompleto());

    expect(component.carregando).toBeFalse();
    expect(component.funil?.coorte.totalEmpresas).toBe(100);
  });
});

function funilCompleto(): AdminAdocaoFunilResponse {
  return {
    periodo: { inicio: '2026-10-01', fim: '2026-10-31' },
    segmento: 'GRAFICA',
    coorte: { totalEmpresas: 100 },
    etapas: [
      { codigo: 'EMPRESAS_CRIADAS', quantidade: 100, percentualDoTotal: 100, percentualEtapaAnterior: null },
      { codigo: 'CONFIGURACAO_CONCLUIDA', quantidade: 80, percentualDoTotal: 80, percentualEtapaAnterior: 80 },
      { codigo: 'PRIMEIRO_PEDIDO', quantidade: 60, percentualDoTotal: 60, percentualEtapaAnterior: 75 },
      { codigo: 'PRIMEIRA_MOVIMENTACAO', quantidade: 45, percentualDoTotal: 45, percentualEtapaAnterior: 75 },
      { codigo: 'ATIVADA', quantidade: 45, percentualDoTotal: 45, percentualEtapaAnterior: 100 }
    ],
    timeToValue: {
      desdeCriacao: { mediaSegundos: 20520, medianaSegundos: 11880, amostra: 31 },
      desdeConfiguracao: { mediaSegundos: null, medianaSegundos: null, amostra: 0 }
    }
  };
}

function funilVazio(): AdminAdocaoFunilResponse {
  return {
    periodo: { inicio: '2026-10-01', fim: '2026-10-31' },
    segmento: 'GRAFICA',
    coorte: { totalEmpresas: 0 },
    etapas: [
      { codigo: 'EMPRESAS_CRIADAS', quantidade: 0, percentualDoTotal: null, percentualEtapaAnterior: null },
      { codigo: 'CONFIGURACAO_CONCLUIDA', quantidade: 0, percentualDoTotal: null, percentualEtapaAnterior: null },
      { codigo: 'PRIMEIRO_PEDIDO', quantidade: 0, percentualDoTotal: null, percentualEtapaAnterior: null },
      { codigo: 'PRIMEIRA_MOVIMENTACAO', quantidade: 0, percentualDoTotal: null, percentualEtapaAnterior: null },
      { codigo: 'ATIVADA', quantidade: 0, percentualDoTotal: null, percentualEtapaAnterior: null }
    ],
    timeToValue: {
      desdeCriacao: { mediaSegundos: null, medianaSegundos: null, amostra: 0 },
      desdeConfiguracao: { mediaSegundos: null, medianaSegundos: null, amostra: 0 }
    }
  };
}

import { ApplicationRef, NgZone, provideZoneChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('AdocaoFunilComponent HTTP DOM regression (AOT)', () => {
  let fixture: ComponentFixture<AdocaoFunilComponent>;
  let http: HttpTestingController;
  let params: BehaviorSubject<Record<string, string>>;
  let zone: NgZone;
  const request = () => http.expectOne(req => req.url.endsWith('/api/admin/adocao/funil'));
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
    params = new BehaviorSubject<Record<string, string>>({ inicio: '2026-10-01', fim: '2026-10-31', segmento: 'GRAFICA' });
    await TestBed.configureTestingModule({ imports: [AdocaoFunilComponent], providers: [
      provideZoneChangeDetection(), provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations(),
      { provide: ActivatedRoute, useValue: { queryParams: params.asObservable() } },
      { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      { provide: ToastrService, useValue: { error: jasmine.createSpy('error') } }
    ] }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    zone = TestBed.inject(NgZone);
    fixture = TestBed.createComponent(AdocaoFunilComponent);
    fixture.autoDetectChanges();
  });
  afterEach(() => { fixture.destroy(); http.verify(); });

  it('renders indicators and funnel after HTTP without a click or forced fixture detection', async () => {
    expect(html().querySelector('mat-progress-spinner')).toBeTruthy();
    await respond(request(), funilCompleto());
    expect(html().querySelector('mat-progress-spinner')).toBeNull();
    expect(html().querySelector('.summary-grid')?.textContent).toContain('100');
    expect(html().querySelector('.funnel-card')?.textContent).toContain('Configuração concluída');
  });

  it('updates filters, cancels the obsolete query and ends loading on the latest response', async () => {
    const old = request();
    zone.run(() => params.next({ inicio: '2026-09-01', fim: '2026-09-30', segmento: 'GRAFICA' }));
    expect(old.cancelled).toBeTrue();
    const latest = request();
    expect(latest.request.params.get('inicio')).toBe('2026-09-01');
    await respond(latest, funilVazio());
    expect(html().querySelector('mat-progress-spinner')).toBeNull();
    expect(html().textContent).toContain('Nenhuma empresa');
  });

  it('renders error and recovers on retry', async () => {
    await respond(request(), {}, true);
    expect(html().querySelector('.feedback-card.error')).toBeTruthy();
    expect(html().querySelector('mat-progress-spinner')).toBeNull();
    zone.run(() => fixture.componentInstance.tentarNovamente());
    await respond(request(), funilCompleto());
    expect(html().querySelector('.summary-grid')).toBeTruthy();
    expect(html().querySelector('.feedback-card.error')).toBeNull();
  });

  it('cancels a pending query when filters become invalid', async () => {
    const pending = request();
    zone.run(() => params.next({ inicio: '2026-11-01', fim: '2026-10-01', segmento: 'GRAFICA' }));
    await fixture.whenStable();
    TestBed.inject(ApplicationRef).tick();
    expect(pending.cancelled).toBeTrue();
    expect(fixture.componentInstance.carregando).toBeFalse();
    expect(html().querySelector('mat-progress-spinner')).toBeNull();
    expect(html().querySelector('[role=alert]')?.textContent).toContain('data inicial');
    http.expectNone(req => req.url.endsWith('/api/admin/adocao/funil'));
  });

  it('cancels pending HTTP on destruction and finalizes loading', () => {
    const pending = request();
    fixture.destroy();
    expect(pending.cancelled).toBeTrue();
    expect(fixture.componentInstance.carregando).toBeFalse();
  });
});
