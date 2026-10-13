import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  AdminLandingAcessoDeviceType,
  AdminLandingAcessoEtapaFunil,
  AdminLandingAcessoItemResponse,
  AdminLandingAcessosResumoResponse,
  AdminLandingQuantidadeItem,
  AdminListaLandingAcessosFiltros,
  AdminListaLandingAcessosResponse
} from '../models/admin-landing-acesso.model';

@Injectable({
  providedIn: 'root'
})
export class AdminLandingAcessosService {
  private readonly endpoint = 'api/admin/landing-acessos';

  constructor(private readonly api: ApiService) {}

  buscarResumo$(filtros?: Pick<AdminListaLandingAcessosFiltros, 'dataInicio' | 'dataFim'>): Observable<AdminLandingAcessosResumoResponse> {
    let params = new HttpParams();

    if (filtros?.dataInicio) {
      params = params.set('dataInicio', filtros.dataInicio);
    }

    if (filtros?.dataFim) {
      params = params.set('dataFim', filtros.dataFim);
    }

    return this.api.get<any>(`${this.endpoint}/resumo`, params).pipe(map((raw) => this.mapResumo(raw)));
  }

  listar$(filtros: AdminListaLandingAcessosFiltros): Observable<AdminListaLandingAcessosResponse> {
    let params = new HttpParams()
      .set('pagina', String(filtros.pagina ?? 0))
      .set('tamanho', String(filtros.tamanho ?? 20));

    if (filtros.busca?.trim()) {
      params = params.set('busca', filtros.busca.trim());
    }

    if (filtros.deviceType) {
      params = params.set('deviceType', filtros.deviceType);
    }

    if (filtros.etapaFunil) {
      params = params.set('etapaFunil', filtros.etapaFunil);
    }

    if (filtros.dataInicio) {
      params = params.set('dataInicio', filtros.dataInicio);
    }

    if (filtros.dataFim) {
      params = params.set('dataFim', filtros.dataFim);
    }

    return this.api.get<any>(this.endpoint, params).pipe(map((raw) => this.mapLista(raw)));
  }

  private mapResumo(raw: any): AdminLandingAcessosResumoResponse {
    return {
      totalAcessos: Number(raw?.['totalAcessos'] || 0),
      baseTotalAcessos: String(raw?.['baseTotalAcessos'] || 'Evento bruto'),
      visitantesUnicos: Number(raw?.['visitantesUnicos'] || 0),
      totalLeads: Number(raw?.['totalLeads'] || 0),
      taxaConversaoPercentual: Number(raw?.['taxaConversaoPercentual'] || 0),
      visitantesLanding: Number(raw?.['visitantesLanding'] ?? raw?.['visitantesUnicos'] ?? 0),
      baseVisitantesLanding: String(raw?.['baseVisitantesLanding'] || 'Visitante unico'),
      visitantesFormulario: Number(raw?.['visitantesFormulario'] || 0),
      baseVisitantesFormulario: String(raw?.['baseVisitantesFormulario'] || 'Visitante unico'),
      formulariosConcluidos: Number(raw?.['formulariosConcluidos'] ?? raw?.['totalLeads'] ?? 0),
      baseFormulariosConcluidos: String(raw?.['baseFormulariosConcluidos'] || 'Visitante unico'),
      taxaVisitaParaFormularioPercentual: Number(raw?.['taxaVisitaParaFormularioPercentual'] || 0),
      taxaConclusaoFormularioPercentual: Number(raw?.['taxaConclusaoFormularioPercentual'] || 0),
      taxaConclusaoSobreLandingPercentual: Number(
        raw?.['taxaConclusaoSobreLandingPercentual'] ?? raw?.['taxaConversaoPercentual'] ?? 0
      ),
      desktop: Number(raw?.['desktop'] || 0),
      mobile: Number(raw?.['mobile'] || 0),
      tablet: Number(raw?.['tablet'] || 0),
      bots: Number(raw?.['bots'] || 0),
      outros: Number(raw?.['outros'] || 0),
      baseDispositivos: String(raw?.['baseDispositivos'] || 'Visitante unico'),
      navegadores: this.mapQuantidadeLista(raw?.['navegadores']),
      sistemasOperacionais: this.mapQuantidadeLista(raw?.['sistemasOperacionais']),
      origens: this.mapQuantidadeLista(raw?.['origens'])
    };
  }

  private mapLista(raw: any): AdminListaLandingAcessosResponse {
    return {
      pagina: Number(raw?.['pagina'] || 0),
      tamanho: Number(raw?.['tamanho'] || 20),
      totalItens: Number(raw?.['totalItens'] || 0),
      totalPaginas: Number(raw?.['totalPaginas'] || 0),
      itens: Array.isArray(raw?.['itens']) ? raw['itens'].map((item: any) => this.mapItem(item)) : []
    };
  }

  private mapItem(raw: any): AdminLandingAcessoItemResponse {
    return {
      id: Number(raw?.['id'] || 0),
      pagina: String(raw?.['pagina'] || 'Página não informada'),
      path: String(raw?.['path'] || '/'),
      sessionId: raw?.['sessionId'] != null ? String(raw['sessionId']) : null,
      referrer: raw?.['referrer'] != null ? String(raw['referrer']) : null,
      utmSource: raw?.['utmSource'] != null ? String(raw['utmSource']) : null,
      utmMedium: raw?.['utmMedium'] != null ? String(raw['utmMedium']) : null,
      utmCampaign: raw?.['utmCampaign'] != null ? String(raw['utmCampaign']) : null,
      etapaFunil: String(raw?.['etapaFunil'] || 'LANDING_VISUALIZADA').toUpperCase() as AdminLandingAcessoEtapaFunil,
      deviceType: String(raw?.['deviceType'] || 'OUTRO').toUpperCase() as AdminLandingAcessoDeviceType,
      sistemaOperacional: raw?.['sistemaOperacional'] != null ? String(raw['sistemaOperacional']) : null,
      navegador: raw?.['navegador'] != null ? String(raw['navegador']) : null,
      bot: Boolean(raw?.['bot']),
      criadoEm: String(raw?.['criadoEm'] || '')
    };
  }

  private mapQuantidadeLista(raw: any): AdminLandingQuantidadeItem[] {
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw.map((item) => ({
      nome: String(item?.['nome'] || 'Não informado'),
      quantidade: Number(item?.['quantidade'] || 0)
    }));
  }
}
