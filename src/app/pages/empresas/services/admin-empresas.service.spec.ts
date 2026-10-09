import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';
import { AdminEmpresasService } from './admin-empresas.service';

describe('AdminEmpresasService', () => {
  let service: AdminEmpresasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(AdminEmpresasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('deve consultar adoção pelo endpoint canônico da empresa', () => {
    service.buscarAdocao$(42).subscribe((response) => {
      expect(response.empresaId).toBe(42);
      expect(response.configuracao.percentual).toBe(100);
      expect(response.usuarios[0].jornadas[0].status).toBe('NAO_INICIADO');
    });

    const req = http.expectOne(`${environment.apiUrl}/api/admin/empresas/42/adocao`);
    expect(req.request.method).toBe('GET');
    req.flush({
      empresaId: 42,
      segmento: 'GRAFICA',
      configuracao: {
        percentual: 100,
        concluida: true,
        concluidaEm: '2026-10-02T14:30:00',
        onboardingIgnorado: false,
        criterios: []
      },
      marcos: {
        empresaCriadaEm: '2026-10-01T08:15:00',
        configuracaoConcluidaEm: '2026-10-02T14:30:00',
        primeiroAcessoEm: null,
        primeiroClienteEm: null,
        primeiroPedidoEm: '2026-10-02T15:00:00',
        primeiraMovimentacaoPedidoEm: null
      },
      ativacao: {
        suportada: true,
        concluida: false,
        ativadaEm: null,
        criterios: []
      },
      timeToValue: {
        desdeCriacaoSegundos: null,
        desdeConfiguracaoSegundos: null
      },
      usuarios: [
        {
          usuarioId: 7,
          nome: 'Maria',
          email: 'maria@clickmanager.test',
          jornadas: [
            {
              jornada: 'PRIMEIRO_PEDIDO',
              versao: 1,
              status: 'NAO_INICIADO',
              etapaAtual: null,
              oferecidoEm: null,
              iniciadoEm: null,
              concluidoEm: null,
              ignoradoEm: null,
              abandonadoEm: null
            }
          ]
        }
      ]
    });
  });
});
