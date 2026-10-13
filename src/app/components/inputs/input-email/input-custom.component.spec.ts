import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { InputEmailComponent } from './input-custom.component';

describe('InputEmailComponent (Design System)', () => {
  let fixture: ComponentFixture<InputEmailComponent>;

  async function mount(control: FormControl) {
    await TestBed.configureTestingModule({
      imports: [InputEmailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputEmailComponent);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('label', 'E-mail');
    fixture.detectChanges();
    return fixture;
  }

  function field() {
    return fixture.nativeElement.querySelector('[data-slot="field"]') as HTMLElement;
  }

  function input() {
    return fixture.nativeElement.querySelector('input[dsInput]') as HTMLInputElement;
  }

  it('renders ds-field and dsInput with type email and links label', async () => {
    await mount(new FormControl(''));
    expect(field()).toBeTruthy();
    expect(input().getAttribute('type')).toBe('email');
    const label = field().querySelector('label');
    expect(label?.textContent).toContain('E-mail');
    expect(label?.getAttribute('for')).toBe(input().id);
  });

  it('shows email error message when invalid and touched', async () => {
    const control = new FormControl('', Validators.email);
    await mount(control);
    control.setValue('invalido');
    control.markAsTouched();
    fixture.detectChanges();
    expect(field().querySelector('p[role="alert"]')?.textContent).toContain('E-mail inválido');
  });

  it('shows required error message', async () => {
    const control = new FormControl('', Validators.required);
    await mount(control);
    control.markAsTouched();
    fixture.detectChanges();
    expect(field().querySelector('p[role="alert"]')?.textContent).toContain('Campo obrigatório');
  });

  it('hides error text when the value is a valid email', async () => {
    const control = new FormControl('', Validators.email);
    await mount(control);
    control.setValue('ok@teste.com');
    control.markAsTouched();
    fixture.detectChanges();
    expect(field().querySelector('p[role="alert"]')).toBeFalsy();
  });
});
