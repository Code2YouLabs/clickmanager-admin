import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-input-documento',
  standalone: true,
  templateUrl: './input-documento.component.html',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputDocumentoComponent implements OnInit, AfterViewInit {
  @Input() control!: FormControl;
  @Input() label: string = 'CPF ou CNPJ';
  @Input() placeholder: string = '';

  @ViewChild('input') inputRef!: ElementRef<HTMLInputElement>;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.control) throw new Error('FormControl é obrigatório');

    const validators = this.control.validator ? [this.control.validator] : [];
    this.control.setValidators([
      ...validators,
      this.documentoValidoValidator()
    ]);
    this.control.updateValueAndValidity();

    this.control.valueChanges
      .pipe(debounceTime(50))
      .subscribe(value => {
        const raw = value?.replace(/\D/g, '') ?? '';
        const formatado = this.formatarDocumento(raw);
        if (this.inputRef?.nativeElement) {
          this.inputRef.nativeElement.value = formatado;
        }
      });
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
    const valorAtual = this.control.value;

    if (valorAtual) {
      const formatado = this.formatarDocumento(valorAtual);

      this.control.setValue(valorAtual.replace(/\D/g, ''), { emitEvent: false });
      this.inputRef.nativeElement.value = formatado;
    }
  }

  formatarDocumento(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 11) {
      return digits
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1-$2');
    } else {
      return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valorAtual = this.control.value ?? '';
    const raw = input.value.replace(/\D/g, '');

    if (valorAtual !== raw) {
      this.control.setValue(raw, { emitEvent: false });
    }

    input.value = this.formatarDocumento(raw);
  }

  documentoValidoValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const raw = control.value?.replace(/\D/g, '');
      if (!raw) return null;

      return raw.length !== 11 && raw.length !== 14
        ? { documentoInvalido: true }
        : null;
    };
  }

  get isRequired(): boolean {
    return !!this.control?.validator?.({} as AbstractControl)?.['required'];
  }

  errorMessage(): string {
    if (this.control.hasError('required')) return 'Campo obrigatório';
    if (this.control.hasError('documentoInvalido')) return 'CPF ou CNPJ inválido';
    return '';
  }
}
