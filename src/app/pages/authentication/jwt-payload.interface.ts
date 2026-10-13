export interface JwtPayload {
    sub: string;
    id: number;
    nome: string;
    roles: string[];
    role?: string;
    perfil?: string | { nome?: string; codigo?: string; chave?: string };
    permissoes?: string[] | Array<{ chave?: string; codigo?: string; nome?: string }>;
    permissions?: string[] | Array<{ chave?: string; codigo?: string; nome?: string }>;
    authorities?: string[];
    modulos?: unknown;
    modulosHabilitados?: unknown;
    modules?: unknown;
    enabledModules?: unknown;
    features?: unknown;
    proprietario?: boolean;
    exp: number;
    iat: number;
  }
  
