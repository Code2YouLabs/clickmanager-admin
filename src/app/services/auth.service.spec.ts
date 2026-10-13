import { AuthService } from './auth.service';

describe('AuthService acesso modular', () => {
  function createAuth(options: {
    roles?: string[];
    permissoes?: string[];
    modulos?: unknown;
    featureFallback?: boolean;
  }) {
    const token = [
      'eyJhbGciOiJub25lIn0',
      'eyJzdWIiOiJ1c3VhcmlvIiwiaWQiOjEsIm5vbWUiOiJVc3VhcmlvIiwicm9sZXMiOltdLCJleHAiOjk5OTk5OTk5OTksImlhdCI6MH0',
      ''
    ].join('.');
    const tokenStorage = {
      getToken: () => token,
      getAccessToken: () => token,
      getRefreshToken: () => null,
      getUsername: () => 'usuario',
      salvarTokens: () => undefined,
      salvarUsername: () => undefined,
      limparTokens: () => undefined,
      usarLocalStorage: () => undefined,
      usarSessionStorage: () => undefined,
    };
    const billingState = {
      snapshot: { modulos: options.modulos },
    };
    const featureFlagService = {
      isEnabled: jasmine.createSpy('isEnabled').and.returnValue(!!options.featureFallback)
    };

    const auth = new AuthService(
      {} as any,
      tokenStorage as any,
      jasmine.createSpyObj('Router', ['navigateByUrl']),
      billingState as any,
      featureFlagService as any
    );

    (auth as any).jwtPayload = {
      sub: 'usuario',
      id: 1,
      nome: 'Usuario',
      roles: options.roles || [],
      permissoes: options.permissoes || [],
      exp: 0,
      iat: 0
    };

    return auth;
  }

  it('permite ADMIN_EMPRESA com modulo habilitado', () => {
    const auth = createAuth({ roles: ['ROLE_ADMIN_EMPRESA'], modulos: ['CALCULADORA_MATERIAIS'] });

    expect(auth.podeAcessarFuncionalidade('CALCULADORA_MATERIAIS', 'CONFIG_CALCULADORAS')).toBeTrue();
  });

  it('nega ADMIN_EMPRESA com modulo desabilitado', () => {
    const auth = createAuth({ roles: ['ROLE_ADMIN_EMPRESA'], modulos: [] });

    expect(auth.podeAcessarFuncionalidade('CALCULADORA_MATERIAIS', 'CONFIG_CALCULADORAS')).toBeFalse();
  });

  it('permite usuario comum com permissao e modulo habilitado', () => {
    const auth = createAuth({
      roles: ['ROLE_OPERADOR'],
      permissoes: ['CONFIG_CALCULADORAS'],
      modulos: ['CALCULADORA_MATERIAIS']
    });

    expect(auth.podeAcessarFuncionalidade('CALCULADORA_MATERIAIS', 'CONFIG_CALCULADORAS')).toBeTrue();
  });

  it('nega usuario comum sem permissao mesmo com modulo habilitado', () => {
    const auth = createAuth({
      roles: ['ROLE_OPERADOR'],
      permissoes: [],
      modulos: ['CALCULADORA_MATERIAIS']
    });

    expect(auth.podeAcessarFuncionalidade('CALCULADORA_MATERIAIS', 'CONFIG_CALCULADORAS')).toBeFalse();
  });

  it('usa o codigo real ADMIN_EMPRESA sem aceitar outro nome como equivalente', () => {
    const auth = createAuth({ roles: ['ROLE_OWNER'], modulos: ['CALCULADORA_MATERIAIS'] });

    expect(auth.podeAcessarFuncionalidade('CALCULADORA_MATERIAIS', 'CONFIG_CALCULADORAS')).toBeFalse();
  });
});
