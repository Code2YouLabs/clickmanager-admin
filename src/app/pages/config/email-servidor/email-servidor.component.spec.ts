import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { EmailServidorComponent } from './email-servidor.component';
import { EmailServidorService } from './email-servidor.service';
import { ToastrService } from 'src/app/services/toastr.service';
import { AuthService } from 'src/app/services/auth.service';

describe('EmailServidorComponent (Design System pilot)', () => {
  let component: EmailServidorComponent;
  let html: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailServidorComponent],
      providers: [
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
        { provide: EmailServidorService, useValue: { obter: () => of(null), atualizar: () => of(undefined), testarEnvio: () => of(undefined) } },
        { provide: ToastrService, useValue: { success: jasmine.createSpy('success'), error: jasmine.createSpy('error'), warning: jasmine.createSpy('warning'), info: jasmine.createSpy('info') } },
        { provide: AuthService, useValue: { usuario$: of({ email: 'admin@clickmanager.com.br' }) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmailServidorComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
    html = fixture.nativeElement as HTMLElement;
  });

  it('renders the migrated Design System form controls', () => {
    expect(html.querySelectorAll('[data-slot="field"]').length).toBeGreaterThanOrEqual(5);
    expect(html.querySelectorAll('input[dsInput]').length).toBeGreaterThanOrEqual(5);
    expect(html.querySelector('[data-slot="checkbox"]')).toBeTruthy();
    expect(html.querySelectorAll('ds-button').length).toBeGreaterThanOrEqual(3);
  });

  it('starts with the SMTP defaults loaded', () => {
    expect(component.form.get('porta')?.value).toBe(587);
    expect(component.form.get('usarSsl')?.value).toBe(true);
    expect(html.querySelectorAll('[data-slot="button"]').length).toBeGreaterThanOrEqual(3);
  });

  it('tracks invalid state on the migrated fields', () => {
    component.form.get('host')?.setValue('');
    component.form.markAllAsTouched();
    expect(component.form.invalid).toBe(true);
    expect(component.invalid('host')).toBe(true);
  });
});