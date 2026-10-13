export type AdminLandingAcessoDeviceType =
  | 'DESKTOP'
  | 'MOBILE'
  | 'TABLET'
  | 'BOT'
  | 'OUTRO';

export type AdminLandingAcessoEtapaFunil =
  | 'LANDING_VISUALIZADA'
  | 'FORMULARIO_VISUALIZADO'
  | 'FORMULARIO_CONCLUIDO';

export interface AdminLandingQuantidadeItem {
  nome: string;
  quantidade: number;
}

export interface AdminLandingAcessosResumoResponse {
  totalAcessos: number;
  baseTotalAcessos: string;
  visitantesUnicos: number;
  totalLeads: number;
  taxaConversaoPercentual: number;
  visitantesLanding: number;
  baseVisitantesLanding: string;
  visitantesFormulario: number;
  baseVisitantesFormulario: string;
  formulariosConcluidos: number;
  baseFormulariosConcluidos: string;
  taxaVisitaParaFormularioPercentual: number;
  taxaConclusaoFormularioPercentual: number;
  taxaConclusaoSobreLandingPercentual: number;
  desktop: number;
  mobile: number;
  tablet: number;
  bots: number;
  outros: number;
  baseDispositivos: string;
  navegadores: AdminLandingQuantidadeItem[];
  sistemasOperacionais: AdminLandingQuantidadeItem[];
  origens: AdminLandingQuantidadeItem[];
}

export interface AdminLandingAcessoItemResponse {
  id: number;
  pagina: string;
  path: string;
  sessionId: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  etapaFunil: AdminLandingAcessoEtapaFunil;
  deviceType: AdminLandingAcessoDeviceType;
  sistemaOperacional: string | null;
  navegador: string | null;
  bot: boolean;
  criadoEm: string;
}

export interface AdminListaLandingAcessosResponse {
  pagina: number;
  tamanho: number;
  totalItens: number;
  totalPaginas: number;
  itens: AdminLandingAcessoItemResponse[];
}

export interface AdminListaLandingAcessosFiltros {
  busca?: string | null;
  deviceType?: AdminLandingAcessoDeviceType | null;
  etapaFunil?: AdminLandingAcessoEtapaFunil | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  pagina?: number;
  tamanho?: number;
}
