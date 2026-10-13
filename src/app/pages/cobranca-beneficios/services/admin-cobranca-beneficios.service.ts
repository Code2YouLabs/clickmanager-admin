import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  AdminAplicacaoBeneficioCobrancaResponse,
  AdminAplicarBeneficioCobrancaEmpresaRequest,
  AdminBeneficioCobrancaResponse,
  AdminSalvarBeneficioCobrancaRequest
} from '../models/admin-cobranca-beneficio.model';

@Injectable({
  providedIn: 'root'
})
export class AdminCobrancaBeneficiosService {
  private readonly endpoint = 'api/admin/cobranca-beneficios';

  constructor(private readonly api: ApiService) {}

  listar$(): Observable<AdminBeneficioCobrancaResponse[]> {
    return this.api.get<any[]>(this.endpoint).pipe(
      map((raw) => Array.isArray(raw) ? raw.map((item) => this.mapBeneficio(item)) : [])
    );
  }

  buscarPorId$(id: number): Observable<AdminBeneficioCobrancaResponse> {
    return this.api.get<any>(`${this.endpoint}/${id}`).pipe(map((raw) => this.mapBeneficio(raw)));
  }

  criar$(payload: AdminSalvarBeneficioCobrancaRequest): Observable<AdminBeneficioCobrancaResponse | null> {
    return this.api.post<any>(this.endpoint, payload).pipe(
      map((raw) => raw?.['id'] ? this.mapBeneficio(raw) : null)
    );
  }

  atualizar$(id: number, payload: AdminSalvarBeneficioCobrancaRequest): Observable<AdminBeneficioCobrancaResponse | null> {
    return this.api.put<any>(`${this.endpoint}/${id}`, payload).pipe(
      map((raw) => raw?.['id'] ? this.mapBeneficio(raw) : null)
    );
  }

  atualizarAtivo$(id: number, ativo: boolean): Observable<AdminBeneficioCobrancaResponse | null> {
    return this.api.patch<any>(`${this.endpoint}/${id}/ativo`, { ativo }).pipe(
      map((raw) => raw?.['id'] ? this.mapBeneficio(raw) : null)
    );
  }

  aplicarEmEmpresa$(beneficioId: number, payload: AdminAplicarBeneficioCobrancaEmpresaRequest): Observable<AdminAplicacaoBeneficioCobrancaResponse | null> {
    return this.api.post<any>(`${this.endpoint}/${beneficioId}/aplicacoes`, payload).pipe(
      map((raw) => raw?.['id'] ? this.mapAplicacao(raw) : null)
    );
  }

  listarAplicacoesEmpresa$(empresaId: number): Observable<AdminAplicacaoBeneficioCobrancaResponse[]> {
    const params = new HttpParams().set('empresaId', String(empresaId));
    return this.api.get<any[]>(`${this.endpoint}/aplicacoes`, params).pipe(
      map((raw) => Array.isArray(raw) ? raw.map((item) => this.mapAplicacao(item)) : [])
    );
  }

  removerAplicacao$(aplicacaoId: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/aplicacoes/${aplicacaoId}`);
  }

  private mapBeneficio(raw: any): AdminBeneficioCobrancaResponse {
    return {
      id: Number(raw?.['id'] || 0),
      codigo: String(raw?.['codigo'] || ''),
      nome: String(raw?.['nome'] || ''),
      descricao: raw?.['descricao'] != null ? String(raw['descricao']) : null,
      planoId: raw?.['planoId'] != null ? Number(raw['planoId']) : null,
      planoNome: raw?.['planoNome'] != null ? String(raw['planoNome']) : null,
      tipo: String(raw?.['tipo'] || 'ISENCAO').toUpperCase() as any,
      valorDescontoCentavos: raw?.['valorDescontoCentavos'] != null ? Number(raw['valorDescontoCentavos']) : null,
      percentualDesconto: raw?.['percentualDesconto'] != null ? Number(raw['percentualDesconto']) : null,
      ativo: Boolean(raw?.['ativo']),
      validadeInicio: raw?.['validadeInicio'] != null ? String(raw['validadeInicio']) : null,
      validadeFim: raw?.['validadeFim'] != null ? String(raw['validadeFim']) : null,
      criadoEm: String(raw?.['criadoEm'] || ''),
      atualizadoEm: String(raw?.['atualizadoEm'] || '')
    };
  }

  private mapAplicacao(raw: any): AdminAplicacaoBeneficioCobrancaResponse {
    return {
      id: Number(raw?.['id'] || 0),
      empresaId: Number(raw?.['empresaId'] || 0),
      empresaNome: String(raw?.['empresaNome'] || ''),
      beneficioId: Number(raw?.['beneficioId'] || 0),
      codigo: String(raw?.['codigo'] || ''),
      nome: String(raw?.['nome'] || ''),
      tipo: String(raw?.['tipo'] || 'ISENCAO').toUpperCase() as any,
      planoId: raw?.['planoId'] != null ? Number(raw['planoId']) : null,
      planoNome: raw?.['planoNome'] != null ? String(raw['planoNome']) : null,
      todosOsPlanos: Boolean(raw?.['todosOsPlanos']),
      aplicadoPorNome: raw?.['aplicadoPorNome'] != null ? String(raw['aplicadoPorNome']) : null,
      observacao: raw?.['observacao'] != null ? String(raw['observacao']) : null,
      aplicadoEm: String(raw?.['aplicadoEm'] || ''),
      utilizadoEm: raw?.['utilizadoEm'] != null ? String(raw['utilizadoEm']) : null,
      ativo: Boolean(raw?.['ativo'])
    };
  }
}
