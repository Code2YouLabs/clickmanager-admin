export interface AdminOnboardingCatalogoResumoResponse {
  servicos: AdminOnboardingCatalogoServicoResponse[];
  acabamentos: AdminOnboardingCatalogoAcabamentoResponse[];
  produtos: AdminOnboardingCatalogoProdutoResponse[];
}

export interface AdminOnboardingCatalogoRelacionamento {
  id: number;
  codigo: string;
  nome: string;
  ativo: boolean;
}

export interface AdminOnboardingCatalogoBaseResponse {
  id: number;
  codigo: string;
  nome: string;
  descricao: string | null;
  valorBaseCentavos: number;
  ativo: boolean;
  ordemExibicao: number | null;
}

export interface AdminOnboardingCatalogoServicoResponse extends AdminOnboardingCatalogoBaseResponse {}

export interface AdminOnboardingCatalogoAcabamentoResponse extends AdminOnboardingCatalogoBaseResponse {}

export interface AdminOnboardingCatalogoProdutoResponse {
  id: number;
  codigo: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  destaque: string | null;
  preSelecionado: boolean;
  ativo: boolean;
  ordemExibicao: number | null;
  servicoIds: number[];
  acabamentoIds: number[];
  servicos: AdminOnboardingCatalogoRelacionamento[];
  acabamentos: AdminOnboardingCatalogoRelacionamento[];
}

export interface AdminSalvarServicoOnboardingRequest {
  codigo: string;
  nome: string;
  descricao: string | null;
  valorBaseCentavos: number;
  ativo: boolean;
  ordemExibicao: number | null;
}

export interface AdminSalvarAcabamentoOnboardingRequest {
  codigo: string;
  nome: string;
  descricao: string | null;
  valorBaseCentavos: number;
  ativo: boolean;
  ordemExibicao: number | null;
}

export interface AdminSalvarProdutoOnboardingRequest {
  codigo: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  destaque: string | null;
  preSelecionado: boolean;
  ativo: boolean;
  ordemExibicao: number | null;
  servicoIds: number[];
  acabamentoIds: number[];
}
