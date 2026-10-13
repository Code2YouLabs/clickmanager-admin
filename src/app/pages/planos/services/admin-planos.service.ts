import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import { AdminPlanoResponse, AdminSalvarPlanoRequest } from '../models/admin-plano.model';

@Injectable({
  providedIn: 'root'
})
export class AdminPlanosService {
  private readonly endpoint = 'api/admin/planos';

  constructor(private readonly api: ApiService) {}

  listar$(): Observable<AdminPlanoResponse[]> {
    return this.api.get<any[]>(this.endpoint).pipe(
      map((raw) => Array.isArray(raw) ? raw.map((item) => this.mapPlano(item)) : [])
    );
  }

  buscarPorId$(id: number): Observable<AdminPlanoResponse> {
    return this.api.get<any>(`${this.endpoint}/${id}`).pipe(map((raw) => this.mapPlano(raw)));
  }

  criar$(payload: AdminSalvarPlanoRequest): Observable<AdminPlanoResponse | null> {
    return this.api.post<any>(this.endpoint, payload).pipe(
      map((raw) => raw?.['id'] ? this.mapPlano(raw) : null)
    );
  }

  atualizar$(id: number, payload: AdminSalvarPlanoRequest): Observable<AdminPlanoResponse | null> {
    return this.api.put<any>(`${this.endpoint}/${id}`, payload).pipe(
      map((raw) => raw?.['id'] ? this.mapPlano(raw) : null)
    );
  }

  atualizarAtivo$(id: number, ativo: boolean): Observable<AdminPlanoResponse | null> {
    return this.api.patch<any>(`${this.endpoint}/${id}/ativo`, { ativo }).pipe(
      map((raw) => raw?.['id'] ? this.mapPlano(raw) : null)
    );
  }

  private mapPlano(raw: any): AdminPlanoResponse {
    return {
      id: Number(raw?.['id'] || 0),
      codigo: String(raw?.['codigo'] || ''),
      nome: String(raw?.['nome'] || ''),
      descricao: raw?.['descricao'] != null ? String(raw['descricao']) : null,
      periodicidade: String(raw?.['periodicidade'] || 'MENSAL').toUpperCase() as any,
      precoCentavos: Number(raw?.['precoCentavos'] || 0),
      moeda: String(raw?.['moeda'] || 'BRL').toUpperCase(),
      ativo: Boolean(raw?.['ativo']),
      ordemExibicao: raw?.['ordemExibicao'] != null ? Number(raw['ordemExibicao']) : null,
      limitesJson: raw?.['limitesJson'] != null ? String(raw['limitesJson']) : null,
      beneficiosJson: raw?.['beneficiosJson'] != null ? String(raw['beneficiosJson']) : null,
      vantagem: raw?.['vantagem'] != null ? String(raw['vantagem']) : null,
      destaque: raw?.['destaque'] != null ? String(raw['destaque']) : null,
      mercadoPagoPlanId: raw?.['mercadoPagoPlanId'] != null ? String(raw['mercadoPagoPlanId']) : null
    };
  }
}
