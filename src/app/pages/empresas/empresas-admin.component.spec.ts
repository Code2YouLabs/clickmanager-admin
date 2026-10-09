import { of, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AdminEmpresaAdocaoResponse, AdminEmpresaResumo } from './models/admin-empresa.model';
import { EmpresasAdminComponent } from './empresas-admin.component';
import { AdminEmpresasService } from './services/admin-empresas.service';

describe('EmpresasAdminComponent adoção', () => {
  let service: jasmine.SpyObj<AdminEmpresasService>;
  let component: EmpresasAdminComponent;

  beforeEach(() => {
    service = jasmine.createSpyObj<AdminEmpresasService>('AdminEmpresasService', [
      'buscarResumo$',
      'listar$',
      'buscarPorId$',
      'buscarAdocao$'
    ]);
    service.buscarResumo$.and.returnValue(of({ total: 0, ativas: 0, onboarding: 0, baixaAtividade: 0 }));
    service.listar$.and.returnValue(of({ pagina: 0, tamanho: 20, totalItens: 0, totalPaginas: 0, itens: [] }));

    component = new EmpresasAdminComponent(service, { error: jasmine.createSpy('error') } as unknown as ToastrService);
  });

  it('carrega adoção ao selecionar empresa e troca dados sem reutilizar resposta anterior', () => {
    service.buscarPorId$.and.returnValues(
      of(detalhe(10, 'Empresa A')),
      of(detalhe(20, 'Empresa B'))
    );
    service.buscarAdocao$.and.returnValues(
      of(adocao({ empresaId: 10, ativacaoConcluida: true, jornadaStatus: 'IGNORADO' })),
      of(adocao({ empresaId: 20, ativacaoConcluida: false, jornadaStatus: 'CONCLUIDO' }))
    );

    component.selecionarEmpresa(resumo(10));
    expect(service.buscarAdocao$).toHaveBeenCalledWith(10);
    expect(component.empresaSelecionada?.id).toBe(10);
    expect(component.adocaoSelecionada?.empresaId).toBe(10);
    expect(component.ativacaoLabel(component.adocaoSelecionada)).toBe('Ativada');
    expect(component.adocaoSelecionada?.usuarios[0].jornadas[0].status).toBe('IGNORADO');

    component.selecionarEmpresa(resumo(20));
    expect(service.buscarAdocao$).toHaveBeenCalledWith(20);
    expect(component.empresaSelecionada?.id).toBe(20);
    expect(component.adocaoSelecionada?.empresaId).toBe(20);
    expect(component.ativacaoLabel(component.adocaoSelecionada)).toBe('Pendente');
    expect(component.adocaoSelecionada?.usuarios[0].jornadas[0].status).toBe('CONCLUIDO');
  });

  it('distingue ativação concluída sem ativadaEm de ativação pendente', () => {
    const ativadaSemData = adocao({ ativacaoConcluida: true, ativadaEm: null });
    const pendente = adocao({ ativacaoConcluida: false, ativadaEm: null });

    expect(component.ativacaoLabel(ativadaSemData)).toBe('Ativada');
    expect(component.marcoStatusComAdocao(ativadaSemData, 'ativadaEm')).toBe('Indisponível');
    expect(component.ativacaoLabel(pendente)).toBe('Pendente');
    expect(component.marcoStatusComAdocao(pendente, 'ativadaEm')).toBe('Ainda não realizada');
  });

  it('formata configuração, critérios, duração, etapas e status sem recalcular regra de negócio', () => {
    const response = adocao({
      percentual: 67,
      ativacaoSuportada: false,
      ativacaoConcluida: false,
      primeiroPedidoEm: '2026-10-02T10:22:00',
      ttvCriacao: 9420,
      ttvConfiguracao: null,
      jornadaStatus: 'EM_ANDAMENTO',
      etapaAtual: 'PEDIDO_CRIADO'
    });

    expect(component.configuracaoPercentual(response)).toBe('67%');
    expect(component.configuracaoStatus(response)).toBe('Em andamento');
    expect(component.ativacaoLabel(response)).toBe('Ainda não suportada');
    expect(component.primeiroPedidoLabel(response)).toBe('Concluído');
    expect(component.formatarDuracao(response.timeToValue.desdeCriacaoSegundos)).toBe('2h 37min');
    expect(component.formatarDuracao(response.timeToValue.desdeConfiguracaoSegundos)).toBe('Indisponível');
    expect(component.criterioAtivacaoLabel('PRIMEIRA_MOVIMENTACAO_PEDIDO')).toBe('Primeira movimentação');
    expect(component.jornadaStatusLabel('EM_ANDAMENTO')).toBe('Em andamento');
    expect(component.etapaAtualLabel('PEDIDO_CRIADO')).toBe('Pedido criado');
  });

  it('mantém independentes jornada concluída com ativação pendente e jornada ignorada com ativação concluída', () => {
    const jornadaConcluidaAtivacaoPendente = adocao({ ativacaoConcluida: false, jornadaStatus: 'CONCLUIDO' });
    const jornadaIgnoradaAtivacaoConcluida = adocao({ ativacaoConcluida: true, jornadaStatus: 'IGNORADO' });

    expect(component.ativacaoLabel(jornadaConcluidaAtivacaoPendente)).toBe('Pendente');
    expect(jornadaConcluidaAtivacaoPendente.usuarios[0].jornadas[0].status).toBe('CONCLUIDO');
    expect(component.ativacaoLabel(jornadaIgnoradaAtivacaoConcluida)).toBe('Ativada');
    expect(jornadaIgnoradaAtivacaoConcluida.usuarios[0].jornadas[0].status).toBe('IGNORADO');
  });

  it('mostra erro de adoção sem apagar detalhe da empresa e permite retry', () => {
    service.buscarPorId$.and.returnValue(of(detalhe(10, 'Empresa A')));
    service.buscarAdocao$.and.returnValues(
      throwError(() => new Error('falha')),
      of(adocao({ empresaId: 10, ativacaoConcluida: true }))
    );

    component.selecionarEmpresa(resumo(10));
    expect(component.empresaSelecionada?.id).toBe(10);
    expect(component.erroAdocao).toBeTrue();
    expect(component.adocaoSelecionada).toBeNull();

    component.retryAdocao();
    expect(component.erroAdocao).toBeFalse();
    expect(component.adocaoSelecionada?.empresaId).toBe(10);
  });
});

function resumo(id: number): AdminEmpresaResumo {
  return {
    id,
    nome: `Empresa ${id}`,
    segmento: 'GRAFICA',
    status: 'ATIVA',
    plano: 'Pro',
    cidade: 'Belo Horizonte',
    usuarios: 2,
    ultimaAtividadeEm: null,
    onboardingPercentual: 100,
    responsavelNome: null,
    responsavelEmail: null,
    responsavelTelefone: null,
    mrr: 9900
  };
}

function detalhe(id: number, nome: string) {
  return {
    ...resumo(id),
    nome,
    email: 'contato@clickmanager.test',
    telefone: null,
    cnpj: null,
    ativa: true,
    dataCriacao: '2026-10-01T08:15:00',
    endereco: null,
    modulos: [],
    observacoes: []
  };
}

function adocao(options: {
  empresaId?: number;
  percentual?: number | null;
  ativacaoSuportada?: boolean;
  ativacaoConcluida?: boolean;
  ativadaEm?: string | null;
  primeiroPedidoEm?: string | null;
  ttvCriacao?: number | null;
  ttvConfiguracao?: number | null;
  jornadaStatus?: string;
  etapaAtual?: string | null;
}): AdminEmpresaAdocaoResponse {
  return {
    empresaId: options.empresaId ?? 10,
    segmento: 'GRAFICA',
    configuracao: {
      percentual: options.percentual ?? 100,
      concluida: (options.percentual ?? 100) === 100,
      concluidaEm: (options.percentual ?? 100) === 100 ? '2026-10-02T14:30:00' : null,
      onboardingIgnorado: false,
      criterios: [{ codigo: 'DADOS_EMPRESA', concluido: true }]
    },
    marcos: {
      empresaCriadaEm: '2026-10-01T08:15:00',
      configuracaoConcluidaEm: '2026-10-02T14:30:00',
      primeiroAcessoEm: null,
      primeiroClienteEm: null,
      primeiroPedidoEm: options.primeiroPedidoEm ?? null,
      primeiraMovimentacaoPedidoEm: options.ativacaoConcluida ? '2026-10-02T10:41:00' : null
    },
    ativacao: {
      suportada: options.ativacaoSuportada ?? true,
      concluida: options.ativacaoConcluida ?? false,
      ativadaEm: options.ativadaEm === undefined
        ? ((options.ativacaoConcluida ?? false) ? '2026-10-02T10:41:00' : null)
        : options.ativadaEm,
      criterios: [
        { codigo: 'CONFIGURACAO', concluido: true, concluidoEm: '2026-10-02T14:30:00' },
        { codigo: 'PRIMEIRO_PEDIDO', concluido: Boolean(options.primeiroPedidoEm), concluidoEm: options.primeiroPedidoEm ?? null },
        { codigo: 'PRIMEIRA_MOVIMENTACAO_PEDIDO', concluido: options.ativacaoConcluida ?? false, concluidoEm: (options.ativacaoConcluida ?? false) ? '2026-10-02T10:41:00' : null }
      ]
    },
    timeToValue: {
      desdeCriacaoSegundos: options.ttvCriacao ?? null,
      desdeConfiguracaoSegundos: options.ttvConfiguracao ?? null
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
            status: options.jornadaStatus ?? 'NAO_INICIADO',
            etapaAtual: options.etapaAtual ?? null,
            oferecidoEm: null,
            iniciadoEm: options.jornadaStatus === 'EM_ANDAMENTO' ? '2026-10-02T09:00:00' : null,
            concluidoEm: options.jornadaStatus === 'CONCLUIDO' ? '2026-10-02T10:00:00' : null,
            ignoradoEm: options.jornadaStatus === 'IGNORADO' ? '2026-10-02T10:00:00' : null,
            abandonadoEm: null
          }
        ]
      },
      {
        usuarioId: 8,
        nome: 'Joao',
        email: 'joao@clickmanager.test',
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
  };
}
