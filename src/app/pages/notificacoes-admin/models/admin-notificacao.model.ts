export type NivelNotificacao = 'INFO' | 'SUCESSO' | 'ATENCAO' | 'CRITICO';

export interface AdminCriarNotificacaoRequest {
  titulo: string;
  resumo?: string | null;
  conteudo: string;
  link?: string | null;
  nivel: NivelNotificacao;
  expiraEm?: string | null;
  todasEmpresas: boolean;
  empresaId?: number | null;
}

export interface AdminCriarNotificacaoResponse {
  notificacoesCriadas: number;
  destinatariosCriados: number;
  todasEmpresas: boolean;
  empresaId: number | null;
  empresaNome: string | null;
}

export interface AdminNotificacaoHistoricoItemResponse {
  id: number;
  empresaId: number | null;
  empresaNome: string | null;
  titulo: string;
  resumo: string | null;
  conteudo: string;
  link: string | null;
  nivel: NivelNotificacao;
  tipoDestino: 'EMPRESA_INTEIRA' | 'TODAS_EMPRESAS';
  criadaPorUsuarioId: number | null;
  criadaEm: string;
  expiraEm: string | null;
  destinatariosCriados: number;
}

export interface AdminListaNotificacoesResponse {
  pagina: number;
  tamanho: number;
  totalItens: number;
  totalPaginas: number;
  itens: AdminNotificacaoHistoricoItemResponse[];
}
