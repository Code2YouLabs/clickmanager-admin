import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from 'src/app/services/api.service';
import {
  AdminAdocaoFunilFiltro,
  AdminAdocaoFunilResponse
} from '../models/admin-adocao-funil.model';

@Injectable({
  providedIn: 'root'
})
export class AdminAdocaoService {
  private readonly endpoint = 'api/admin/adocao/funil';

  constructor(private readonly api: ApiService) {}

  consultarFunil$(filtro: AdminAdocaoFunilFiltro): Observable<AdminAdocaoFunilResponse> {
    const params = new HttpParams()
      .set('inicio', filtro.inicio)
      .set('fim', filtro.fim)
      .set('segmento', filtro.segmento);

    return this.api.get<AdminAdocaoFunilResponse>(this.endpoint, params);
  }
}
