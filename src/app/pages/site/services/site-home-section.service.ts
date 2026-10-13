import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  SiteHomeSection,
  SiteHomeSectionOrdemRequest,
  SiteHomeSectionRequest,
  SiteHomeSectionStatusRequest
} from '../models/site-home-section.models';

@Injectable({
  providedIn: 'root'
})
export class SiteHomeSectionService {
  private readonly endpoint = 'api/site/home-sections';

  constructor(private readonly api: ApiService) {}

  listar$(): Observable<SiteHomeSection[]> {
    return this.api.get<SiteHomeSection[]>(this.endpoint).pipe(
      map((itens) => [...(itens || [])].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)))
    );
  }

  buscarPorId$(id: number): Observable<SiteHomeSection | undefined> {
    return this.listar$().pipe(
      map((itens) => itens.find((item) => item.id === id))
    );
  }

  criar$(payload: SiteHomeSectionRequest): Observable<SiteHomeSection> {
    return this.api.post<SiteHomeSection>(this.endpoint, payload);
  }

  atualizar$(id: number, payload: SiteHomeSectionRequest): Observable<SiteHomeSection> {
    return this.api.put<SiteHomeSection>(`${this.endpoint}/${id}`, payload);
  }

  atualizarStatus$(id: number, ativo: boolean): Observable<SiteHomeSection> {
    const payload: SiteHomeSectionStatusRequest = { ativo };
    return this.api.patch<SiteHomeSection>(`${this.endpoint}/${id}/status`, payload);
  }

  excluir$(id: number): Observable<void> {
    return this.api.delete<void>(`${this.endpoint}/${id}`);
  }

  atualizarOrdem$(payload: SiteHomeSectionOrdemRequest[]): Observable<SiteHomeSection[]> {
    return this.api.patch<SiteHomeSection[]>(`${this.endpoint}/ordem`, payload);
  }
}
