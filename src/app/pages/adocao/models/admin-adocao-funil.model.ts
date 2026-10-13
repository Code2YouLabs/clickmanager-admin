export type AdminAdocaoSegmento = 'GRAFICA';

export type AdminAdocaoFunilEtapaCodigo =
  | 'EMPRESAS_CRIADAS'
  | 'CONFIGURACAO_CONCLUIDA'
  | 'PRIMEIRO_PEDIDO'
  | 'PRIMEIRA_MOVIMENTACAO'
  | 'ATIVADA';

export interface AdminAdocaoFunilFiltro {
  inicio: string;
  fim: string;
  segmento: AdminAdocaoSegmento;
}

export interface AdminAdocaoFunilResponse {
  periodo: AdminAdocaoFunilPeriodo;
  segmento: AdminAdocaoSegmento;
  coorte: AdminAdocaoFunilCoorte;
  etapas: AdminAdocaoFunilEtapa[];
  timeToValue: AdminAdocaoFunilTimeToValue;
}

export interface AdminAdocaoFunilPeriodo {
  inicio: string;
  fim: string;
}

export interface AdminAdocaoFunilCoorte {
  totalEmpresas: number;
}

export interface AdminAdocaoFunilEtapa {
  codigo: AdminAdocaoFunilEtapaCodigo;
  quantidade: number;
  percentualDoTotal: number | null;
  percentualEtapaAnterior: number | null;
}

export interface AdminAdocaoFunilTimeToValue {
  desdeCriacao: AdminAdocaoFunilMetricaTtv;
  desdeConfiguracao: AdminAdocaoFunilMetricaTtv;
}

export interface AdminAdocaoFunilMetricaTtv {
  mediaSegundos: number | null;
  medianaSegundos: number | null;
  amostra: number;
}
