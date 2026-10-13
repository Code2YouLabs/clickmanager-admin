import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { InputTextareaComponent } from './input-textarea.component';

describe('InputTextareaComponent (Design System)', () => {
  let fixture: ComponentFixture<InputTextareaComponent>;

  async function mount(control: FormControl, maxlength?: number) {
    await TestBed.configureTestingModule({
      imports: [InputTextareaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputTextareaComponent);
    fixture.componentRef.setInput('control', control);
    fixture.componentRef.setInput('label', 'Observações');
    if (maxlength !== undefined) {
      fixture.componentRef.setInput('maxlength', maxlength);
    }
    fixture.detectChanges();
    return fixture;
  }

  function field() {
    return fixture.nativeElement.querySelector('[data-slot="field"]') as HTMLElement;
  }

  function textarea() {
    return fixture.nativeElement.querySelector('textarea[dsTextarea]') as HTMLTextAreaElement;
  }

  it('renders ds-field and dsTextarea and links label', async () => {
    await mount(new FormControl(''));
    expect(field()).toBeTruthy();
    expect(textarea()).toBeTruthy();
    const label = field().querySelector('label');
    expect(label?.textContent).toContain('Observações');
    expect(label?.getAttribute('for')).toBe(textarea().id);
  });

  it('applies maxLength validator from the maxlength input', async () => {
    const control = new FormControl('');
    await mount(control, 10);
    control.setValue('texto bem maior que dez caracteres');
    control.markAsTouched();
    fixture.detectChanges();
    expect(control.hasError('maxlength')).toBe(true);
    expect(field().querySelector('p[role="alert"]')?.textContent).toContain('Máximo de 10 caracteres');
  });

  it('shows required error when invalid and touched', async () => {
    const control = new FormControl('', Validators.required);
    await mount(control);
    control.markAsTouched();
    fixture.detectChanges();
    expect(field().querySelector('p[role="alert"]')?.textContent).toContain('Campo obrigatório');
  });
});
