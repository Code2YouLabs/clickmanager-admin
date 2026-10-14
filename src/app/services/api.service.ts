import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, take } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private readonly BASE_URL = environment.apiUrl;

  constructor(private http: HttpClient) { }

  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.BASE_URL}/${endpoint}`, { params }).pipe(take(1));
  }

  getBlobResponse(endpoint: string, params?: HttpParams): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.BASE_URL}/${endpoint}`, {
      params,
      responseType: 'blob',
      observe: 'response'
    }).pipe(take(1));
  }

  getExterno<T>(url: string): Observable<T> {
    return this.http.get<T>(url).pipe(take(1));
  }

  post<T>(endpoint: string, body: any, params?: HttpParams): Observable<T> {
    return this.http.post<T>(`${this.BASE_URL}/${endpoint}`, body, { params }).pipe(take(1));
  }

  put<T>(endpoint: string, body: any, params?: HttpParams): Observable<T> {
    return this.http.put<T>(`${this.BASE_URL}/${endpoint}`, body, { params }).pipe(take(1));
  }

  patch<T>(endpoint: string, body: any, params?: HttpParams): Observable<T> {
    return this.http.patch<T>(`${this.BASE_URL}/${endpoint}`, body, { params }).pipe(take(1));
  }

  delete<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.delete<T>(`${this.BASE_URL}/${endpoint}`, { params }).pipe(take(1));
  }

  buscarEnderecoPorCep(cep: string): Observable<any> {
    const cepLimpo = cep.replace(/\D/g, '');
    const url = `https://viacep.com.br/ws/${cepLimpo}/json/`;
    return this.getExterno(url);
  }

}
