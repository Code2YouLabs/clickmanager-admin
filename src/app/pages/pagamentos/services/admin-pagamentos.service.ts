import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  AdminListaPagamentosFiltros,
  AdminListaPagamentosResponse,
  AdminPagamentoDetalheResponse,
  AdminPagamentoResumoResponse,
  AdminPagamentosResumoResponse
} from '../models/admin-pagamento.model';

@Injectable({
  providedIn: 'root'
})
export class AdminPagamentosService {
  private readonly endpoint = 'api/admin/pagamentos';

  constructor(private readonly api: ApiService) {}

  listar$(filtros: AdminListaPagamentosFiltros): Observable<AdminListaPagamentosResponse> {
    let params = new HttpParams()
      .set('pagina', String(filtros.pagina ?? 0))
      .set('tamanho', String(filtros.tamanho ?? 20));

    if (filtros.busca?.trim()) {
      params = params.set('busca', filtros.busca.trim());
    }

    if (filtros.status) {
      params = params.set('status', filtros.status);
    }

    return this.api.get<any>(this.endpoint, params).pipe(map((raw) => this.mapLista(raw)));
  }

  buscarResumo$(): Observable<AdminPagamentosResumoResponse> {
    return this.api.get<any>(`${this.endpoint}/resumo`).pipe(
      map((raw) => ({
        totalRecebido: Number(raw?.['totalRecebido'] || 0),
        totalEstornado: Number(raw?.['totalEstornado'] || 0),
        pendentes: Number(raw?.['pendentes'] || 0),
        aprovados: Number(raw?.['aprovados'] || 0),
        recusados: Number(raw?.['recusados'] || 0),
        cancelados: Number(raw?.['cancelados'] || 0),
        estornados: Number(raw?.['estornados'] || 0),
        chargebacks: Number(raw?.['chargebacks'] || 0),
        ultimoRecebimentoEm: raw?.['ultimoRecebimentoEm'] != null ? String(raw['ultimoRecebimentoEm']) : null
      }))
    );
  }

  buscarPorId$(id: number): Observable<AdminPagamentoDetalheResponse> {
    return this.api.get<any>(`${this.endpoint}/${id}`).pipe(map((raw) => this.mapDetalhe(raw)));
  }

  private mapLista(raw: any): AdminListaPagamentosResponse {
    return {
      pagina: Number(raw?.['pagina'] || 0),
      tamanho: Number(raw?.['tamanho'] || 20),
      totalItens: Number(raw?.['totalItens'] || 0),
      totalPaginas: Number(raw?.['totalPaginas'] || 0),
      itens: Array.isArray(raw?.['itens']) ? raw['itens'].map((item: any) => this.mapResumo(item)) : []
    };
  }

  private mapResumo(raw: any): AdminPagamentoResumoResponse {
    return {
      id: Number(raw?.['id'] || 0),
      assinaturaId: raw?.['assinaturaId'] != null ? Number(raw['assinaturaId']) : null,
      empresaId: raw?.['empresaId'] != null ? Number(raw['empresaId']) : null,
      empresaNome: raw?.['empresaNome'] != null ? String(raw['empresaNome']) : null,
      planoId: raw?.['planoId'] != null ? Number(raw['planoId']) : null,
      planoNome: raw?.['planoNome'] != null ? String(raw['planoNome']) : null,
      gateway: raw?.['gateway'] != null ? String(raw['gateway']) : null,
      referenciaExterna: raw?.['referenciaExterna'] != null ? String(raw['referenciaExterna']) : null,
      valor: Number(raw?.['valor'] || 0),
      status: String(raw?.['status'] || 'PENDENTE').toUpperCase() as any,
      criadoEm: raw?.['criadoEm'] != null ? String(raw['criadoEm']) : null,
      confirmadoEm: raw?.['confirmadoEm'] != null ? String(raw['confirmadoEm']) : null
    };
  }

  private mapDetalhe(raw: any): AdminPagamentoDetalheResponse {
    return {
      ...this.mapResumo(raw),
      assinaturaInicio: raw?.['assinaturaInicio'] != null ? String(raw['assinaturaInicio']) : null,
      assinaturaFim: raw?.['assinaturaFim'] != null ? String(raw['assinaturaFim']) : null,
      proximoCobrancaEm: raw?.['proximoCobrancaEm'] != null ? String(raw['proximoCobrancaEm']) : null,
      payloadJson: raw?.['payloadJson'] != null ? String(raw['payloadJson']) : null
    };
  }
}
