import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  AdminDemoAnalyticsFiltros,
  AdminDemoAnalyticsFunnelSummaryResponse,
  AdminDemoAnalyticsItemResumo
} from '../models/admin-demo-funnel.model';

@Injectable({
  providedIn: 'root'
})
export class AdminDemoFunnelService {
  private readonly endpoint = 'api/admin/demo/analytics';

  constructor(private readonly api: ApiService) {}

  buscarResumo$(filtros?: AdminDemoAnalyticsFiltros): Observable<AdminDemoAnalyticsFunnelSummaryResponse> {
    let params = new HttpParams();

    if (filtros?.dataInicio) {
      params = params.set('dataInicio', filtros.dataInicio);
    }

    if (filtros?.dataFim) {
      params = params.set('dataFim', filtros.dataFim);
    }

    return this.api
      .get<any>(`${this.endpoint}/funnel-summary`, params)
      .pipe(map((raw) => this.mapResumo(raw)));
  }

  private mapResumo(raw: any): AdminDemoAnalyticsFunnelSummaryResponse {
    return {
      timezone: String(raw?.['timezone'] || 'America/Sao_Paulo'),
      dataInicio: String(raw?.['dataInicio'] || ''),
      dataFim: String(raw?.['dataFim'] || ''),
      baseContagem: String(raw?.['baseContagem'] || 'visitantes únicos'),
      viewed: Number(raw?.['viewed'] || 0),
      tourStarted: Number(raw?.['tourStarted'] || 0),
      tourSkipped: Number(raw?.['tourSkipped'] || 0),
      tourCompleted: Number(raw?.['tourCompleted'] || 0),
      calculationCompleted: Number(raw?.['calculationCompleted'] || 0),
      orderGenerated: Number(raw?.['orderGenerated'] || 0),
      whatsappPreviewed: Number(raw?.['whatsappPreviewed'] || 0),
      signupClicked: Number(raw?.['signupClicked'] || 0),
      specialistClicked: Number(raw?.['specialistClicked'] || 0),
      exitClicked: Number(raw?.['exitClicked'] || 0),
      calculationRatePercent: Number(raw?.['calculationRatePercent'] || 0),
      orderRatePercent: Number(raw?.['orderRatePercent'] || 0),
      whatsappRatePercent: Number(raw?.['whatsappRatePercent'] || 0),
      signupRatePercent: Number(raw?.['signupRatePercent'] || 0),
      specialistRatePercent: Number(raw?.['specialistRatePercent'] || 0),
      devices: this.mapLista(raw?.['devices']),
      sources: this.mapLista(raw?.['sources'])
    };
  }

  private mapLista(raw: any): AdminDemoAnalyticsItemResumo[] {
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw.map((item) => ({
      nome: String(item?.['nome'] || 'desconhecido'),
      quantidade: Number(item?.['quantidade'] || 0)
    }));
  }
}
