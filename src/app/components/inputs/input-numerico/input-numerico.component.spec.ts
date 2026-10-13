import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { InputNumericoComponent } from './input-numerico.component';

describe('InputNumericoComponent (Design System)', () => {
  let fixture: ComponentFixture<InputNumericoComponent>;

  async function mount(control: FormControl) {
    await TestBed.configureTestingModule({
      imports: [InputNumericoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputNumericoComponent);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('label', 'CEP');
    fixture.detectChanges();
    return fixture;
  }

  function field() {
    return fixture.nativeElement.querySelector('[data-slot="field"]') as HTMLElement;
  }

  function input() {
    return fixture.nativeElement.querySelector('input[dsInput]') as HTMLInputElement;
  }

  it('renders ds-field and dsInput with numeric inputmode and links label', async () => {
    await mount(new FormControl(''));
    expect(field()).toBeTruthy();
    expect(input().getAttribute('inputmode')).toBe('numeric');
    const label = field().querySelector('label');
    expect(label?.textContent).toContain('CEP');
    expect(label?.getAttribute('for')).toBe(input().id);
  });

  it('blocks non-numeric keys', async () => {
    const control = new FormControl('');
    await mount(control);
    const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
    input().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('allows numeric keys', async () => {
    const control = new FormControl('');
    await mount(control);
    const event = new KeyboardEvent('keydown', { key: '5', cancelable: true });
    input().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('shows required error when invalid and touched', async () => {
    const control = new FormControl('', Validators.required);
    await mount(control);
    control.markAsTouched();
    fixture.detectChanges();
    expect(field().querySelector('p[role="alert"]')?.textContent).toContain('Campo obrigatório');
  });

  it('shows max error when above the maximum', async () => {
    const control = new FormControl<number | string>('', Validators.max(100));
    await mount(control);
    control.setValue(200);
    control.markAsTouched();
    fixture.detectChanges();
    expect(field().querySelector('p[role="alert"]')?.textContent).toContain('Valor máximo permitido é 100');
  });
});
