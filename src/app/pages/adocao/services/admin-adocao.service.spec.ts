import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { AdminAdocaoService } from './admin-adocao.service';

describe('AdminAdocaoService', () => {
  let service: AdminAdocaoService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(AdminAdocaoService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('monta endpoint do funil com inicio, fim e segmento', () => {
    service.consultarFunil$({
      inicio: '2026-10-01',
      fim: '2026-10-31',
      segmento: 'GRAFICA'
    }).subscribe((response) => {
      expect(response.coorte.totalEmpresas).toBe(100);
      expect(response.etapas[0].codigo).toBe('EMPRESAS_CRIADAS');
      expect(response.timeToValue.desdeCriacao.medianaSegundos).toBe(11880);
    });

    const req = http.expectOne((request) =>
      request.url === `${environment.apiUrl}/api/admin/adocao/funil`
      && request.params.get('inicio') === '2026-10-01'
      && request.params.get('fim') === '2026-10-31'
      && request.params.get('segmento') === 'GRAFICA'
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      periodo: { inicio: '2026-10-01', fim: '2026-10-31' },
      segmento: 'GRAFICA',
      coorte: { totalEmpresas: 100 },
      etapas: [
        { codigo: 'EMPRESAS_CRIADAS', quantidade: 100, percentualDoTotal: 100, percentualEtapaAnterior: null }
      ],
      timeToValue: {
        desdeCriacao: { mediaSegundos: 20520, medianaSegundos: 11880, amostra: 31 },
        desdeConfiguracao: { mediaSegundos: null, medianaSegundos: null, amostra: 0 }
      }
    });
  });
});
