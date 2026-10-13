export type AdminEmpresaStatus = 'ATIVA' | 'ONBOARDING' | 'BAIXA_ATIVIDADE';

export interface AdminEmpresaResumo {
  id: number;
  nome: string;
  segmento: string;
  status: AdminEmpresaStatus;
  plano: string;
  cidade: string;
  usuarios: number;
  ultimaAtividadeEm: string | null;
  onboardingPercentual: number;
  responsavelNome: string | null;
  responsavelEmail: string | null;
  responsavelTelefone: string | null;
  mrr: number;
}

export interface AdminListaEmpresasResponse {
  pagina: number;
  tamanho: number;
  totalItens: number;
  totalPaginas: number;
  itens: AdminEmpresaResumo[];
}

export interface AdminEmpresasResumoResponse {
  total: number;
  ativas: number;
  onboarding: number;
  baixaAtividade: number;
}

export interface AdminEmpresaEndereco {
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
}

export interface AdminEmpresaDetalheResponse extends AdminEmpresaResumo {
  email: string | null;
  telefone: string | null;
  cnpj: string | null;
  ativa: boolean;
  dataCriacao: string | null;
  endereco: AdminEmpresaEndereco | null;
  modulos: string[];
  observacoes: string[];
}

export interface AdminListaEmpresasFiltros {
  busca?: string | null;
  status?: AdminEmpresaStatus | null;
  pagina?: number;
  tamanho?: number;
}

export interface AdminEmpresaAdocaoResponse {
  empresaId: number;
  segmento: string | null;
  configuracao: AdminEmpresaAdocaoConfiguracao;
  marcos: AdminEmpresaAdocaoMarcos;
  ativacao: AdminEmpresaAdocaoAtivacao;
  timeToValue: AdminEmpresaAdocaoTimeToValue;
  usuarios: AdminEmpresaAdocaoUsuario[];
}

export interface AdminEmpresaAdocaoConfiguracao {
  percentual: number | null;
  concluida: boolean;
  concluidaEm: string | null;
  onboardingIgnorado: boolean;
  criterios: AdminEmpresaAdocaoCriterioConfiguracao[];
}

export interface AdminEmpresaAdocaoCriterioConfiguracao {
  codigo: string;
  concluido: boolean;
}

export interface AdminEmpresaAdocaoMarcos {
  empresaCriadaEm: string | null;
  configuracaoConcluidaEm: string | null;
  primeiroAcessoEm: string | null;
  primeiroClienteEm: string | null;
  primeiroPedidoEm: string | null;
  primeiraMovimentacaoPedidoEm: string | null;
}

export interface AdminEmpresaAdocaoAtivacao {
  suportada: boolean;
  concluida: boolean;
  ativadaEm: string | null;
  criterios: AdminEmpresaAdocaoCriterioAtivacao[];
}

export interface AdminEmpresaAdocaoCriterioAtivacao {
  codigo: string;
  concluido: boolean;
  concluidoEm: string | null;
}

export interface AdminEmpresaAdocaoTimeToValue {
  desdeCriacaoSegundos: number | null;
  desdeConfiguracaoSegundos: number | null;
}

export interface AdminEmpresaAdocaoUsuario {
  usuarioId: number;
  nome: string | null;
  email: string | null;
  jornadas: AdminEmpresaAdocaoJornada[];
}

export type AdminEmpresaJornadaStatus = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'IGNORADO' | 'ABANDONADO';

export interface AdminEmpresaAdocaoJornada {
  jornada: string;
  versao: number;
  status: AdminEmpresaJornadaStatus | string;
  etapaAtual: string | null;
  oferecidoEm: string | null;
  iniciadoEm: string | null;
  concluidoEm: string | null;
  ignoradoEm: string | null;
  abandonadoEm: string | null;
}
