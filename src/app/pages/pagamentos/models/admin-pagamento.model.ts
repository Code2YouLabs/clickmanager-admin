export type AdminPagamentoStatus =
  | 'PENDENTE'
  | 'APROVADO'
  | 'RECUSADO'
  | 'CANCELADO'
  | 'ESTORNADO'
  | 'CHARGEBACK';

export interface AdminPagamentoResumoResponse {
  id: number;
  assinaturaId: number | null;
  empresaId: number | null;
  empresaNome: string | null;
  planoId: number | null;
  planoNome: string | null;
  gateway: string | null;
  referenciaExterna: string | null;
  valor: number;
  status: AdminPagamentoStatus;
  criadoEm: string | null;
  confirmadoEm: string | null;
}

export interface AdminListaPagamentosResponse {
  pagina: number;
  tamanho: number;
  totalItens: number;
  totalPaginas: number;
  itens: AdminPagamentoResumoResponse[];
}

export interface AdminPagamentosResumoResponse {
  totalRecebido: number;
  totalEstornado: number;
  pendentes: number;
  aprovados: number;
  recusados: number;
  cancelados: number;
  estornados: number;
  chargebacks: number;
  ultimoRecebimentoEm: string | null;
}

export interface AdminPagamentoDetalheResponse extends AdminPagamentoResumoResponse {
  assinaturaInicio: string | null;
  assinaturaFim: string | null;
  proximoCobrancaEm: string | null;
  payloadJson: string | null;
}

export interface AdminListaPagamentosFiltros {
  busca?: string | null;
  status?: AdminPagamentoStatus | null;
  pagina?: number;
  tamanho?: number;
}
