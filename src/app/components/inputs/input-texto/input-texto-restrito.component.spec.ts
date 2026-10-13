import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { InputTextoRestritoComponent } from './input-texto-restrito.component';

describe('InputTextoRestritoComponent (Design System)', () => {
  let fixture: ComponentFixture<InputTextoRestritoComponent>;

  async function mount(control: FormControl) {
    await TestBed.configureTestingModule({
      imports: [InputTextoRestritoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputTextoRestritoComponent);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('label', 'Nome');
    fixture.componentRef.setInput('bloquearNumeros', true);
    fixture.detectChanges();
    return fixture;
  }

  function field() {
    return fixture.nativeElement.querySelector('[data-slot="field"]') as HTMLElement;
  }

  function input() {
    return fixture.nativeElement.querySelector('input[dsInput]') as HTMLInputElement;
  }

  it('renders ds-field and dsInput and links label to input', async () => {
    await mount(new FormControl(''));
    expect(field()).toBeTruthy();
    expect(input()).toBeTruthy();
    const label = field().querySelector('label');
    expect(label?.textContent).toContain('Nome');
    expect(label?.getAttribute('for')).toBe(input().id);
  });

  it('shows the asterisk when the control is required', async () => {
    await mount(new FormControl('', Validators.required));
    expect(field().querySelector('label span')?.textContent).toContain('*');
  });

  it('shows error text when invalid and touched', async () => {
    const control = new FormControl('', Validators.required);
    await mount(control);
    control.markAsTouched();
    fixture.detectChanges();
    expect(field().querySelector('p[role="alert"]')?.textContent).toContain('Campo obrigatório');
  });

  it('hides error text when valid', async () => {
    const control = new FormControl('ok');
    await mount(control);
    control.markAsTouched();
    fixture.detectChanges();
    expect(field().querySelector('p[role="alert"]')).toBeFalsy();
  });

  it('marks the input invalid (aria-invalid) when invalid and touched', async () => {
    const control = new FormControl('', Validators.required);
    await mount(control);
    control.markAsTouched();
    fixture.detectChanges();
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });

  it('blocks digits from being typed when bloquearNumeros is set', async () => {
    const control = new FormControl('');
    await mount(control);
    const event = new KeyboardEvent('keydown', { key: '3', cancelable: true });
    input().dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
