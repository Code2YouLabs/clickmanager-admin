import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  AdminEmpresaAdocaoResponse,
  AdminEmpresaDetalheResponse,
  AdminEmpresaResumo,
  AdminEmpresasResumoResponse,
  AdminListaEmpresasFiltros,
  AdminListaEmpresasResponse
} from '../models/admin-empresa.model';

@Injectable({
  providedIn: 'root'
})
export class AdminEmpresasService {
  private readonly endpoint = 'api/admin/empresas';

  constructor(private readonly api: ApiService) {}

  listar$(filtros: AdminListaEmpresasFiltros): Observable<AdminListaEmpresasResponse> {
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

  buscarPorId$(id: number): Observable<AdminEmpresaDetalheResponse> {
    return this.api.get<any>(`${this.endpoint}/${id}`).pipe(map((raw) => this.mapDetalhe(raw)));
  }

  buscarAdocao$(id: number): Observable<AdminEmpresaAdocaoResponse> {
    return this.api.get<AdminEmpresaAdocaoResponse>(`${this.endpoint}/${id}/adocao`);
  }

  buscarResumo$(): Observable<AdminEmpresasResumoResponse> {
    return this.api.get<any>(`${this.endpoint}/resumo`).pipe(map((raw) => ({
      total: Number(raw?.['total'] || 0),
      ativas: Number(raw?.['ativas'] || 0),
      onboarding: Number(raw?.['onboarding'] || 0),
      baixaAtividade: Number(raw?.['baixaAtividade'] || 0)
    })));
  }

  private mapLista(raw: any): AdminListaEmpresasResponse {
    return {
      pagina: Number(raw?.['pagina'] || 0),
      tamanho: Number(raw?.['tamanho'] || 20),
      totalItens: Number(raw?.['totalItens'] || 0),
      totalPaginas: Number(raw?.['totalPaginas'] || 0),
      itens: Array.isArray(raw?.['itens']) ? raw['itens'].map((item: any) => this.mapResumo(item)) : []
    };
  }

  private mapDetalhe(raw: any): AdminEmpresaDetalheResponse {
    return {
      ...this.mapResumo(raw),
      email: raw?.['email'] != null ? String(raw['email']) : null,
      telefone: raw?.['telefone'] != null ? String(raw['telefone']) : null,
      cnpj: raw?.['cnpj'] != null ? String(raw['cnpj']) : null,
      ativa: Boolean(raw?.['ativa']),
      dataCriacao: raw?.['dataCriacao'] != null ? String(raw['dataCriacao']) : null,
      endereco: raw?.['endereco']
        ? {
            cep: raw['endereco']['cep'] != null ? String(raw['endereco']['cep']) : null,
            logradouro: raw['endereco']['logradouro'] != null ? String(raw['endereco']['logradouro']) : null,
            numero: raw['endereco']['numero'] != null ? String(raw['endereco']['numero']) : null,
            complemento: raw['endereco']['complemento'] != null ? String(raw['endereco']['complemento']) : null,
            bairro: raw['endereco']['bairro'] != null ? String(raw['endereco']['bairro']) : null,
            cidade: raw['endereco']['cidade'] != null ? String(raw['endereco']['cidade']) : null,
            estado: raw['endereco']['estado'] != null ? String(raw['endereco']['estado']) : null
          }
        : null,
      modulos: Array.isArray(raw?.['modulos']) ? raw['modulos'].map((item: any) => String(item)) : [],
      observacoes: Array.isArray(raw?.['observacoes']) ? raw['observacoes'].map((item: any) => String(item)) : []
    };
  }

  private mapResumo(raw: any): AdminEmpresaResumo {
    return {
      id: Number(raw?.['id'] || 0),
      nome: String(raw?.['nome'] || ''),
      segmento: String(raw?.['segmento'] || 'Não informado'),
      status: String(raw?.['status'] || 'ATIVA').toUpperCase() as any,
      plano: String(raw?.['plano'] || 'Não informado'),
      cidade: String(raw?.['cidade'] || 'Não informado'),
      usuarios: Number(raw?.['usuarios'] || 0),
      ultimaAtividadeEm: raw?.['ultimaAtividadeEm'] != null ? String(raw['ultimaAtividadeEm']) : null,
      onboardingPercentual: Number(raw?.['onboardingPercentual'] || 0),
      responsavelNome: raw?.['responsavelNome'] != null ? String(raw['responsavelNome']) : null,
      responsavelEmail: raw?.['responsavelEmail'] != null ? String(raw['responsavelEmail']) : null,
      responsavelTelefone: raw?.['responsavelTelefone'] != null ? String(raw['responsavelTelefone']) : null,
      mrr: Number(raw?.['mrr'] || 0)
    };
  }
}
