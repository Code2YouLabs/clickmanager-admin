export type AdminPlanoPeriodicidade = 'MENSAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

export interface AdminPlanoResponse {
  id: number;
  codigo: string;
  nome: string;
  descricao: string | null;
  periodicidade: AdminPlanoPeriodicidade;
  precoCentavos: number;
  moeda: string;
  ativo: boolean;
  ordemExibicao: number | null;
  limitesJson: string | null;
  beneficiosJson: string | null;
  vantagem: string | null;
  destaque: string | null;
  mercadoPagoPlanId: string | null;
}

export interface AdminSalvarPlanoRequest {
  codigo: string;
  nome: string;
  descricao: string | null;
  periodicidade: AdminPlanoPeriodicidade;
  precoCentavos: number;
  moeda: string;
  ativo: boolean;
  ordemExibicao: number | null;
  limitesJson: string | null;
  beneficiosJson: string | null;
  vantagem: string | null;
  destaque: string | null;
  mercadoPagoPlanId: string | null;
}
