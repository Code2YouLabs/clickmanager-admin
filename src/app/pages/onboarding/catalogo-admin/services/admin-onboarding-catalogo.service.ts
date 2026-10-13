import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  AdminOnboardingCatalogoAcabamentoResponse,
  AdminOnboardingCatalogoProdutoResponse,
  AdminOnboardingCatalogoRelacionamento,
  AdminOnboardingCatalogoResumoResponse,
  AdminOnboardingCatalogoServicoResponse,
  AdminSalvarAcabamentoOnboardingRequest,
  AdminSalvarProdutoOnboardingRequest,
  AdminSalvarServicoOnboardingRequest
} from '../models/admin-onboarding-catalogo.model';

@Injectable({
  providedIn: 'root'
})
export class AdminOnboardingCatalogoService {
  private readonly endpoint = 'api/admin/onboarding/catalogo';

  constructor(private readonly api: ApiService) {}

  buscarCatalogo$(): Observable<AdminOnboardingCatalogoResumoResponse> {
    return this.api.get<any>(this.endpoint).pipe(map((raw) => this.mapResumo(raw)));
  }

  buscarServicoPorId$(id: number): Observable<AdminOnboardingCatalogoServicoResponse> {
    return this.api.get<any>(`${this.endpoint}/servicos/${id}`).pipe(map((raw) => this.mapServico(raw)));
  }

  criarServico$(payload: AdminSalvarServicoOnboardingRequest): Observable<AdminOnboardingCatalogoServicoResponse | null> {
    return this.api.post<any>(`${this.endpoint}/servicos`, payload).pipe(
      map((raw) => raw?.['id'] ? this.mapServico(raw) : null)
    );
  }

  atualizarServico$(id: number, payload: AdminSalvarServicoOnboardingRequest): Observable<AdminOnboardingCatalogoServicoResponse | null> {
    return this.api.put<any>(`${this.endpoint}/servicos/${id}`, payload).pipe(
      map((raw) => raw?.['id'] ? this.mapServico(raw) : null)
    );
  }

  atualizarAtivoServico$(id: number, ativo: boolean): Observable<AdminOnboardingCatalogoServicoResponse | null> {
    return this.api.patch<any>(`${this.endpoint}/servicos/${id}/ativo`, { ativo }).pipe(
      map((raw) => raw?.['id'] ? this.mapServico(raw) : null)
    );
  }

  buscarAcabamentoPorId$(id: number): Observable<AdminOnboardingCatalogoAcabamentoResponse> {
    return this.api.get<any>(`${this.endpoint}/acabamentos/${id}`).pipe(map((raw) => this.mapAcabamento(raw)));
  }

  criarAcabamento$(payload: AdminSalvarAcabamentoOnboardingRequest): Observable<AdminOnboardingCatalogoAcabamentoResponse | null> {
    return this.api.post<any>(`${this.endpoint}/acabamentos`, payload).pipe(
      map((raw) => raw?.['id'] ? this.mapAcabamento(raw) : null)
    );
  }

  atualizarAcabamento$(id: number, payload: AdminSalvarAcabamentoOnboardingRequest): Observable<AdminOnboardingCatalogoAcabamentoResponse | null> {
    return this.api.put<any>(`${this.endpoint}/acabamentos/${id}`, payload).pipe(
      map((raw) => raw?.['id'] ? this.mapAcabamento(raw) : null)
    );
  }

  atualizarAtivoAcabamento$(id: number, ativo: boolean): Observable<AdminOnboardingCatalogoAcabamentoResponse | null> {
    return this.api.patch<any>(`${this.endpoint}/acabamentos/${id}/ativo`, { ativo }).pipe(
      map((raw) => raw?.['id'] ? this.mapAcabamento(raw) : null)
    );
  }

  buscarProdutoPorId$(id: number): Observable<AdminOnboardingCatalogoProdutoResponse> {
    return this.api.get<any>(`${this.endpoint}/produtos/${id}`).pipe(map((raw) => this.mapProduto(raw)));
  }

  criarProduto$(payload: AdminSalvarProdutoOnboardingRequest): Observable<AdminOnboardingCatalogoProdutoResponse | null> {
    return this.api.post<any>(`${this.endpoint}/produtos`, payload).pipe(
      map((raw) => raw?.['id'] ? this.mapProduto(raw) : null)
    );
  }

  atualizarProduto$(id: number, payload: AdminSalvarProdutoOnboardingRequest): Observable<AdminOnboardingCatalogoProdutoResponse | null> {
    return this.api.put<any>(`${this.endpoint}/produtos/${id}`, payload).pipe(
      map((raw) => raw?.['id'] ? this.mapProduto(raw) : null)
    );
  }

  atualizarAtivoProduto$(id: number, ativo: boolean): Observable<AdminOnboardingCatalogoProdutoResponse | null> {
    return this.api.patch<any>(`${this.endpoint}/produtos/${id}/ativo`, { ativo }).pipe(
      map((raw) => raw?.['id'] ? this.mapProduto(raw) : null)
    );
  }

  private mapResumo(raw: any): AdminOnboardingCatalogoResumoResponse {
    return {
      servicos: Array.isArray(raw?.['servicos']) ? raw['servicos'].map((item: any) => this.mapServico(item)) : [],
      acabamentos: Array.isArray(raw?.['acabamentos']) ? raw['acabamentos'].map((item: any) => this.mapAcabamento(item)) : [],
      produtos: Array.isArray(raw?.['produtos']) ? raw['produtos'].map((item: any) => this.mapProduto(item)) : []
    };
  }

  private mapServico(raw: any): AdminOnboardingCatalogoServicoResponse {
    return {
      id: Number(raw?.['id'] || 0),
      codigo: String(raw?.['codigo'] || ''),
      nome: String(raw?.['nome'] || ''),
      descricao: raw?.['descricao'] != null ? String(raw['descricao']) : null,
      valorBaseCentavos: Number(raw?.['valorBaseCentavos'] ?? raw?.['valorCentavos'] ?? 0),
      ativo: this.toBoolean(raw?.['ativo']),
      ordemExibicao: raw?.['ordemExibicao'] != null ? Number(raw['ordemExibicao']) : null
    };
  }

  private mapAcabamento(raw: any): AdminOnboardingCatalogoAcabamentoResponse {
    return {
      id: Number(raw?.['id'] || 0),
      codigo: String(raw?.['codigo'] || ''),
      nome: String(raw?.['nome'] || ''),
      descricao: raw?.['descricao'] != null ? String(raw['descricao']) : null,
      valorBaseCentavos: Number(raw?.['valorBaseCentavos'] ?? raw?.['valorCentavos'] ?? 0),
      ativo: this.toBoolean(raw?.['ativo']),
      ordemExibicao: raw?.['ordemExibicao'] != null ? Number(raw['ordemExibicao']) : null
    };
  }

  private mapProduto(raw: any): AdminOnboardingCatalogoProdutoResponse {
    const servicos = this.mapRelacionamentos(raw?.['servicos']);
    const acabamentos = this.mapRelacionamentos(raw?.['acabamentos']);

    return {
      id: Number(raw?.['id'] || 0),
      codigo: String(raw?.['codigo'] || ''),
      nome: String(raw?.['nome'] || ''),
      descricao: raw?.['descricao'] != null ? String(raw['descricao']) : null,
      categoria: raw?.['categoria'] != null ? String(raw['categoria']) : null,
      destaque: raw?.['destaque'] != null ? String(raw['destaque']) : null,
      preSelecionado: this.toBoolean(raw?.['preSelecionado']),
      ativo: this.toBoolean(raw?.['ativo']),
      ordemExibicao: raw?.['ordemExibicao'] != null ? Number(raw['ordemExibicao']) : null,
      servicoIds: this.mapIds(raw?.['servicoIds'], servicos),
      acabamentoIds: this.mapIds(raw?.['acabamentoIds'], acabamentos),
      servicos,
      acabamentos
    };
  }

  private mapRelacionamentos(raw: any): AdminOnboardingCatalogoRelacionamento[] {
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw.map((item: any) => ({
      id: Number(item?.['id'] || 0),
      codigo: String(item?.['codigo'] || ''),
      nome: String(item?.['nome'] || ''),
      ativo: this.toBoolean(item?.['ativo'])
    }));
  }

  private mapIds(rawIds: any, relacionados: AdminOnboardingCatalogoRelacionamento[]): number[] {
    if (Array.isArray(rawIds)) {
      return rawIds
        .map((item: any) => Number(item))
        .filter((item: number) => Number.isFinite(item) && item > 0);
    }

    return relacionados
      .map((item) => Number(item.id))
      .filter((item) => Number.isFinite(item) && item > 0);
  }

  private toBoolean(value: any): boolean {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }

    return Boolean(value);
  }
}
