import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Usuario } from '../models/usuario/usuario.model';
import { AuthApiService } from './auth-api.service';
import { AuthTokenStorageService } from './auth-token-storage.service';
import { AuthTokens } from '../models/auth-tokens.interface';
import { decodeToken } from '../utils/token.util';
import { JwtPayload } from '../pages/authentication/jwt-payload.interface';
import { BillingStateService } from '../pages/billing/services/billing-state.service';
import { FeatureFlagService } from './feature-flag.service';

const ADMIN_EMPRESA = 'ADMIN_EMPRESA';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private jwtPayload: JwtPayload | null = null;
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  readonly usuario$ = this.usuarioSubject.asObservable();

  constructor(
    private authApi: AuthApiService,
    private tokenStorage: AuthTokenStorageService,
    private router: Router,
    private billingState: BillingStateService,
    private featureFlagService: FeatureFlagService
  ) {
    this.initJwt();
  }

  login(username: string, password: string, lembrar = false): Observable<Usuario> {
    lembrar ? this.tokenStorage.usarLocalStorage() : this.tokenStorage.usarSessionStorage();

    return this.authApi.login(username, password).pipe(
      tap((tokens) => this.persistirTokens(tokens, username)),
      tap(() => void this.router.navigateByUrl('/dashboard')),
      map(() => {
        const usuario = this.criarUsuarioAdmin();
        this.usuarioSubject.next(usuario);
        return usuario;
      })
    );
  }

  carregarUsuarioCompleto(): Observable<Usuario> {
    if (!this.getToken()) {
      this.usuarioSubject.next(null);
      return of(null as unknown as Usuario);
    }

    const usuario = this.criarUsuarioAdmin();
    this.usuarioSubject.next(usuario);
    return of(usuario);
  }

  logout(): void {
    this.tokenStorage.limparTokens();
    this.jwtPayload = null;
    this.usuarioSubject.next(null);
    void this.router.navigateByUrl('/login');
  }

  temPermissao(permissao: string): boolean {
    if (!this.isAuthenticated()) return false;
    if (this.isAdminEmpresa()) return true;
    const chave = this.normalizeCode(permissao);
    if (!chave) return false;
    return this.getPermissionCodes().some(p => this.normalizeCode(p) === chave);
  }

  temAlgumaPermissao(permissoes: string[]): boolean {
    if (!this.isAuthenticated()) return false;
    return (permissoes || []).some(permissao => this.temPermissao(permissao));
  }

  podeAcessarFuncionalidade(moduloCodigo: string, permissao?: string): boolean {
    if (!this.isAuthenticated()) return false;
    if (!this.isModuloHabilitado(moduloCodigo)) return false;
    if (this.isAdminEmpresa()) return true;
    if (!permissao) return true;
    return this.temPermissao(permissao);
  }

  isAdminEmpresa(): boolean {
    return this.getRoleCodes().some(role => this.normalizeRole(role) === ADMIN_EMPRESA);
  }

  isModuloHabilitado(moduloCodigo: string): boolean {
    const expected = this.normalizeCode(moduloCodigo);
    if (!expected) return false;

    const modules = this.extractEnabledModules(this.billingState.snapshot)
      ?? this.extractEnabledModules(this.jwtPayload);

    if (modules) {
      return modules.some(module => this.normalizeCode(module) === expected);
    }

    return this.featureFlagService.isEnabled(moduloCodigo);
  }

  isAuthenticated(): boolean {
    const token = this.tokenStorage.getToken();
    return !!token && !this.isAccessTokenExpired(token);
  }

  getUsuario(): Usuario {
    const usuario = this.usuarioSubject.value ?? this.criarUsuarioAdmin();
    this.usuarioSubject.next(usuario);
    return usuario;
  }

  getUsuarioNome(): string | null {
    return this.usuarioSubject.value?.nome || this.tokenStorage.getUsername() || null;
  }

  getJwtPayload(): JwtPayload | null {
    return this.jwtPayload;
  }

  getJwtId(): number | null {
    return this.jwtPayload?.id || null;
  }

  getToken(): string | null {
    return this.tokenStorage.getAccessToken();
  }

  getRefreshToken(): string | null {
    return this.tokenStorage.getRefreshToken();
  }

  register(_: string, __: string, ___: string): Observable<any> {
    return throwError(() => new Error('Cadastro admin não disponível neste front.'));
  }

  recuperarSenha(_: string): Observable<void> {
    return throwError(() => new Error('Recuperação de senha admin não disponível neste front.'));
  }

  resetarSenha(_: string, __: string): Observable<void> {
    return throwError(() => new Error('Reset de senha admin não disponível neste front.'));
  }

  verificarSeTemUsuarios(): Observable<boolean> {
    return of(true);
  }

  refreshToken(): Observable<AuthTokens> {
    return throwError(() => new Error('Refresh token admin não disponível.'));
  }

  isAccessTokenExpired(token: string): boolean {
    try {
      const payload = decodeToken(token);
      if (!payload?.exp) {
        return false;
      }

      const now = Math.floor(Date.now() / 1000);
      return payload.exp < now;
    } catch {
      return false;
    }
  }

  hasValidRefreshToken(): boolean {
    return false;
  }

  private initJwt(): void {
    const token = this.tokenStorage.getToken();
    if (!token) {
      this.jwtPayload = null;
      this.usuarioSubject.next(null);
      return;
    }

    try {
      this.jwtPayload = decodeToken(token);
    } catch {
      this.jwtPayload = null;
    }

    this.usuarioSubject.next(this.criarUsuarioAdmin());
  }

  private persistirTokens(tokens: AuthTokens, usernameFallback?: string): void {
    const username = tokens.username || usernameFallback || '';
    this.tokenStorage.salvarTokens(tokens.accessToken, tokens.refreshToken, username);
    if (username) {
      this.tokenStorage.salvarUsername(username);
    }

    try {
      this.jwtPayload = decodeToken(tokens.accessToken);
    } catch {
      this.jwtPayload = null;
    }
  }

  private criarUsuarioAdmin(): Usuario {
    const nome = this.tokenStorage.getUsername() || this.jwtPayload?.nome || this.jwtPayload?.sub || 'Admin';
    const perfilNome = this.getPerfilNome() || 'Administrador';
    return {
      id: this.jwtPayload?.id,
      nome,
      username: nome,
      perfil: {
        id: 0,
        nome: perfilNome,
        permissoes: this.getPermissionCodes().map((chave, index) => ({
          id: index,
          chave,
          titulo: chave,
          grupo: ''
        }))
      },
      proprietario: this.jwtPayload?.proprietario ?? this.isAdminEmpresa()
    };
  }

  private getPerfilNome(): string | null {
    const perfil = this.jwtPayload?.perfil;
    if (typeof perfil === 'string') return perfil;
    if (perfil && typeof perfil === 'object') {
      return perfil.nome || perfil.codigo || perfil.chave || null;
    }
    return this.getRoleCodes().find(role => this.normalizeRole(role) === ADMIN_EMPRESA) ?? null;
  }

  private getRoleCodes(): string[] {
    const payload = this.jwtPayload as any;
    const roles = [
      ...(Array.isArray(payload?.roles) ? payload.roles : []),
      ...(Array.isArray(payload?.authorities) ? payload.authorities : []),
      payload?.role,
      typeof payload?.perfil === 'string' ? payload.perfil : null,
      payload?.perfil?.nome,
      payload?.perfil?.codigo,
      payload?.perfil?.chave,
    ];

    return roles
      .filter((role): role is string => typeof role === 'string' && !!role.trim())
      .map(role => this.normalizeRole(role));
  }

  private getPermissionCodes(): string[] {
    const payload = this.jwtPayload as any;
    return [
      ...this.extractCodes(payload?.permissoes),
      ...this.extractCodes(payload?.permissions),
      ...this.extractCodes(payload?.authorities)
    ];
  }

  private extractCodes(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map(item => {
        if (typeof item === 'string') return item;
        if (!item || typeof item !== 'object') return '';
        const raw = item as Record<string, unknown>;
        return String(raw['chave'] ?? raw['codigo'] ?? raw['code'] ?? raw['key'] ?? raw['nome'] ?? '');
      })
      .filter(Boolean);
  }

  private extractEnabledModules(source: unknown): string[] | null {
    if (!source || typeof source !== 'object') return null;
    const raw = source as Record<string, unknown>;
    const candidate =
      raw['modulos'] ??
      raw['modulosHabilitados'] ??
      raw['modules'] ??
      raw['enabledModules'] ??
      raw['features'];

    if (Array.isArray(candidate)) {
      return this.extractCodes(candidate);
    }

    if (candidate && typeof candidate === 'object') {
      return Object.entries(candidate)
        .filter(([, enabled]) => enabled === true)
        .map(([code]) => code);
    }

    return null;
  }

  private normalizeCode(value: string): string {
    return (value || '').trim().toUpperCase().replace(/[-\s]+/g, '_');
  }

  private normalizeRole(value: string): string {
    return this.normalizeCode(value).replace(/^ROLE_/, '');
  }
}
