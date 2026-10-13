import { DesignSystemIconComponent } from './design-system-icons.module';

describe('DesignSystemIconComponent', () => {
  it('resolves a published Design System icon', () => {
    const component = new DesignSystemIconComponent();
    component.name = 'alert-circle';

    expect(component.definition.name).toBe('alert-circle');
  });

  it('uses the info icon for legacy names without a published equivalent', () => {
    const component = new DesignSystemIconComponent();
    component.name = 'brand-producthunt';

    expect(component.definition.name).toBe('info-circle');
  });
});
