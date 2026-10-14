import { Component, ViewEncapsulation, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ADMIN_TABLER_ICONS } from './admin-tabler-icons';
import { DesignSystemIconComponent, DesignSystemIconsModule } from './design-system-icons.module';
import { navItems } from '../layouts/full/vertical/sidebar/sidebar-data';
import { DsButtonComponent } from '../ui/button';
import { AppNavItemComponent } from '../layouts/full/vertical/sidebar/nav-item/nav-item.component';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

@Component({
  standalone: true,
  imports: [DesignSystemIconsModule, DsButtonComponent],
  encapsulation: ViewEncapsulation.None,
  // Load the actual application's sizing helpers, not a test approximation.
  styleUrls: ['../../assets/scss/helpers/_icon-size.scss'],
  template: `<ds-button [disabled]="disabled()">
    <i-tabler [name]="name" class="icon-18" style="color: inherit" /> Editar
  </ds-button>`,
})
class StandaloneIconHost {
  name = 'edit';
  disabled = signal(false);
}

describe('Tabler compatibility bridge', () => {
  let fixture: ComponentFixture<DesignSystemIconComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DesignSystemIconComponent, StandaloneIconHost, AppNavItemComponent, TranslateModule.forRoot()],
      providers: [provideRouter([]), provideNoopAnimations()] }).compileComponents();
    fixture = TestBed.createComponent(DesignSystemIconComponent);
  });

  async function render(name: string) {
    fixture.componentRef.setInput('name', name);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement.querySelector('svg') as SVGElement | null;
  }

  it('renders the actual mail glyph, not the former x alias', async () => {
    const svg = (await render('mail'))!;
    expect(svg.getAttribute('data-tabler-icon')).toBe('mail');
    for (const [tag, attributes] of ADMIN_TABLER_ICONS.get('mail')!.nodes) {
      expect([...svg.querySelectorAll(tag)].some(node => Object.entries(attributes).every(([key, value]) => node.getAttribute(key) === value))).toBeTrue();
    }
    expect(svg.querySelectorAll('path').length).toBeGreaterThan(0);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders all selected names without substituting or warning', async () => {
    const warning = spyOn(console, 'warn');
    for (const [name, definition] of ADMIN_TABLER_ICONS) {
      const svg = (await render(name))!;
      expect(svg).withContext(name).not.toBeNull();
      expect(svg.getAttribute('data-tabler-icon')).withContext(name).toBe(definition.name);
      expect(svg.getAttribute('data-tabler-type')).withContext(name).toBe(definition.type);
    }
    expect(warning).not.toHaveBeenCalled();
  });

  it('renders all navigation icons and the main actions distinctly', async () => {
    const menuIcons: string[] = [];
    function collect(items: typeof navItems) {
      for (const item of items) {
        if (item.iconName) menuIcons.push(item.iconName);
        if (item.children) collect(item.children);
      }
    }
    collect(navItems);
    for (const name of [...menuIcons, 'edit', 'trash', 'eye', 'search', 'adjustments-cog', 'arrow-left', 'check', 'alert-triangle']) {
      expect((await render(name))!.getAttribute('data-tabler-icon')).toBe(name);
    }
  });

  it('renders real sidebar items through their existing standalone imports', async () => {
    const menu = TestBed.createComponent(AppNavItemComponent);
    for (const item of navItems.filter(item => item.iconName)) {
      menu.componentRef.setInput('item', item);
      menu.detectChanges();
      await menu.whenStable();
      expect(menu.nativeElement.querySelector('i-tabler svg')?.getAttribute('data-tabler-icon')).withContext(item.displayName ?? '').toBe(item.iconName);
    }
    menu.destroy();
  });

  it('clears an invalid name and warns without throwing or drawing infoCircle', async () => {
    const warning = spyOn(console, 'warn');
    await render('mail');
    expect(await render('missing-invalid-icon')).toBeNull();
    expect(warning).toHaveBeenCalledWith(jasmine.stringMatching(/Unknown Tabler icon "missing-invalid-icon"/));
    expect(fixture.nativeElement.querySelector('.tabler-icon-info-circle')).toBeNull();
    expect((await render('trash'))!.getAttribute('data-tabler-icon')).toBe('trash');
  });

  it('supports filled icons with their real filled paths', async () => {
    const svg = (await render('circle-filled'))!;
    expect(svg.getAttribute('data-tabler-type')).toBe('filled');
    expect(svg.getAttribute('fill')).toBe('currentColor');
    expect(svg.getAttribute('stroke')).toBe('none');
  });

  it('keeps sizes, inherited colors and disabled buttons in standalone Design System components', async () => {
    const host = TestBed.createComponent(StandaloneIconHost);
    document.body.appendChild(host.nativeElement);
    host.nativeElement.style.color = 'rgb(20, 40, 60)';
    host.detectChanges();
    await host.whenStable();
    const icon = host.nativeElement.querySelector('i-tabler') as HTMLElement;
    const svg = icon.querySelector('svg')!;
    expect(getComputedStyle(icon).width).toBe('18px');
    expect(svg.getBoundingClientRect().width).toBe(18);
    expect(svg.getBoundingClientRect().height).toBe(18);
    expect(svg.getAttribute('stroke')).toBe('currentColor');
    expect(svg.getAttribute('stroke-width')).toBe('2');
    expect(getComputedStyle(svg).color).toBe(getComputedStyle(icon).color);
    for (const color of ['rgb(20, 40, 60)', 'rgb(210, 220, 230)']) {
      icon.style.color = color;
      expect(getComputedStyle(svg).stroke).toBe(color);
    }
    host.componentInstance.disabled.set(true);
    host.detectChanges();
    expect(host.nativeElement.querySelector('button').disabled).toBeTrue();
    expect(icon.querySelector('svg')).toBeTruthy();
    host.nativeElement.remove();
    host.destroy();
  });
});
