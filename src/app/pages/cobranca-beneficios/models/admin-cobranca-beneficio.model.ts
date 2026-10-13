export type TipoBeneficioCobranca =
  | 'DESCONTO_PERCENTUAL'
  | 'DESCONTO_VALOR_FIXO'
  | 'ISENCAO';

export interface AdminBeneficioCobrancaResponse {
  id: number;
  codigo: string;
  nome: string;
  descricao: string | null;
  planoId: number | null;
  planoNome?: string | null;
  tipo: TipoBeneficioCobranca;
  valorDescontoCentavos: number | null;
  percentualDesconto: number | null;
  ativo: boolean;
  validadeInicio: string | null;
  validadeFim: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface AdminSalvarBeneficioCobrancaRequest {
  codigo: string;
  nome: string;
  descricao?: string | null;
  planoId?: number | null;
  tipo: TipoBeneficioCobranca;
  valorDescontoCentavos?: number | null;
  percentualDesconto?: number | null;
  ativo?: boolean | null;
  validadeInicio?: string | null;
  validadeFim?: string | null;
}

export interface AdminAplicarBeneficioCobrancaEmpresaRequest {
  empresaId: number;
  aplicadoPorNome?: string | null;
  observacao?: string | null;
}

export interface AdminAplicacaoBeneficioCobrancaResponse {
  id: number;
  empresaId: number;
  empresaNome: string;
  beneficioId: number;
  codigo: string;
  nome: string;
  tipo: TipoBeneficioCobranca;
  planoId: number | null;
  planoNome: string | null;
  todosOsPlanos: boolean;
  aplicadoPorNome: string | null;
  observacao: string | null;
  aplicadoEm: string;
  utilizadoEm: string | null;
  ativo: boolean;
}
