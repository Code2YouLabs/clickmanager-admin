import { FormBuilder } from '@angular/forms';
import { convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormProdutoComponent } from './form-produto.component';

describe('FormProdutoComponent tabs', () => {
  function createComponent(options: {
    billing?: any;
    billingError?: boolean;
    accessAllowed?: boolean;
    queryTab?: string | null;
  } = {}) {
    const router = jasmine.createSpyObj('Router', ['navigate']);
    const route = {
      paramMap: of(convertToParamMap({ id: '42' })),
      queryParamMap: of(convertToParamMap(options.queryTab ? { tab: options.queryTab } : {}))
    } as any;
    const produtoService = {
      buscarPorId: () => of({
        nome: 'Produto',
        descricao: 'Descricao',
        variacoes: [],
        politicaRevenda: null
      }),
      atualizar: () => of({}),
      salvar: () => of({})
    };
    const cdr = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);
    const authService = {
      podeAcessarFuncionalidade: jasmine.createSpy('podeAcessarFuncionalidade').and.returnValue(options.accessAllowed ?? true)
    };
    const billingService = {
      obterStatus: jasmine.createSpy('obterStatus').and.returnValue(
        options.billingError ? throwError(() => new Error('erro')) : of(options.billing ?? { modulos: [] })
      )
    };

    const component = new FormProdutoComponent(
      new FormBuilder(),
      route,
      router,
      produtoService as any,
      jasmine.createSpyObj('ToastrService', ['error', 'success']),
      cdr,
      authService as any,
      billingService as any
    );

    component.ngOnInit();

    return { component, router, authService, billingService };
  }

  it('exibe Calculadora de Materiais quando a regra central permite', () => {
    const { component, authService } = createComponent({
      billing: { modulos: ['CALCULADORA_MATERIAIS'] },
      accessAllowed: true
    });

    expect(component.tabs.map(tab => tab.id)).toContain('calculadora-materiais');
    expect(authService.podeAcessarFuncionalidade).toHaveBeenCalledWith('CALCULADORA_MATERIAIS', 'CONFIG_CALCULADORAS');
  });

  it('nao exibe Calculadora de Materiais quando a regra central nega', () => {
    const { component } = createComponent({
      accessAllowed: false
    });

    expect(component.tabs.map(tab => tab.id)).not.toContain('calculadora-materiais');
  });

  it('abre a aba por query param quando ela esta disponivel', () => {
    const { component } = createComponent({
      billing: { modulos: ['CALCULADORA_MATERIAIS'] },
      accessAllowed: true,
      queryTab: 'calculadora-materiais'
    });

    expect(component.tabs[component.selectedTabIndex].id).toBe('calculadora-materiais');
  });

  it('ignora query param de aba indisponivel e abre a primeira aba', () => {
    const { component } = createComponent({
      billing: { modulos: [] },
      accessAllowed: false,
      queryTab: 'calculadora-materiais'
    });

    expect(component.selectedTabIndex).toBe(0);
    expect(component.tabs[component.selectedTabIndex].id).toBe('geral');
  });

  it('navega anterior e proximo usando a lista final de tabs', () => {
    const { component } = createComponent({
      billing: { modulos: ['CALCULADORA_MATERIAIS'] },
      accessAllowed: true
    });

    component.onTabIndexChange(2);
    component.nextTab();
    expect(component.tabs[component.selectedTabIndex].id).toBe('calculadora-materiais');
    expect(component.isLastTab).toBeTrue();

    component.previousTab();
    expect(component.tabs[component.selectedTabIndex].id).toBe('variacoes');
  });

  it('atualiza a lista apos retorno do billing e usa a decisao central', () => {
    const { component, authService } = createComponent({
      billing: { allowed: true },
      accessAllowed: true
    });

    expect(authService.podeAcessarFuncionalidade).toHaveBeenCalledWith('CALCULADORA_MATERIAIS', 'CONFIG_CALCULADORAS');
    expect(component.tabs.map(tab => tab.id)).toContain('calculadora-materiais');
  });
});
