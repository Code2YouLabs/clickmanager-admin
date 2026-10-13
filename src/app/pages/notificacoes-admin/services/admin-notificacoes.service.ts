import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  AdminCriarNotificacaoRequest,
  AdminCriarNotificacaoResponse,
  AdminListaNotificacoesResponse
} from '../models/admin-notificacao.model';

@Injectable({
  providedIn: 'root'
})
export class AdminNotificacoesService {
  private readonly endpoint = 'api/admin/notificacoes';

  constructor(private readonly api: ApiService) {}

  criar$(payload: AdminCriarNotificacaoRequest): Observable<AdminCriarNotificacaoResponse> {
    return this.api.post<AdminCriarNotificacaoResponse>(this.endpoint, payload);
  }

  listar$(filtros: {
    empresaId?: number | null;
    titulo?: string | null;
    pagina?: number;
    tamanho?: number;
  }): Observable<AdminListaNotificacoesResponse> {
    let params = new HttpParams()
      .set('pagina', String(filtros.pagina ?? 0))
      .set('tamanho', String(filtros.tamanho ?? 10));

    if (filtros.empresaId) {
      params = params.set('empresaId', String(filtros.empresaId));
    }

    if (filtros.titulo?.trim()) {
      params = params.set('titulo', filtros.titulo.trim());
    }

    return this.api.get<AdminListaNotificacoesResponse>(this.endpoint, params);
  }
}
