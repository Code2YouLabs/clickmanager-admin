import { CalculadoraMateriaisComponent } from './calculadora-materiais.component';

describe('CalculadoraMateriaisComponent', () => {
  it('recebe o produtoId do formulario de produto', () => {
    const component = new CalculadoraMateriaisComponent();

    component.produtoId = 42;

    expect(component.produtoId).toBe(42);
  });
});
