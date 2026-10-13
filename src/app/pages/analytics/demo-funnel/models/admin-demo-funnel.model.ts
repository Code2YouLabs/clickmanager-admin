export interface AdminDemoAnalyticsItemResumo {
  nome: string;
  quantidade: number;
}

export interface AdminDemoAnalyticsFunnelSummaryResponse {
  timezone: string;
  dataInicio: string;
  dataFim: string;
  baseContagem: string;
  viewed: number;
  tourStarted: number;
  tourSkipped: number;
  tourCompleted: number;
  calculationCompleted: number;
  orderGenerated: number;
  whatsappPreviewed: number;
  signupClicked: number;
  specialistClicked: number;
  exitClicked: number;
  calculationRatePercent: number;
  orderRatePercent: number;
  whatsappRatePercent: number;
  signupRatePercent: number;
  specialistRatePercent: number;
  devices: AdminDemoAnalyticsItemResumo[];
  sources: AdminDemoAnalyticsItemResumo[];
}

export interface AdminDemoAnalyticsFiltros {
  dataInicio?: string | null;
  dataFim?: string | null;
}
