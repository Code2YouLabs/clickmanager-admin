import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
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
