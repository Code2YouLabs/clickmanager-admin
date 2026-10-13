import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy
} from '@angular/core';

import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatAutocompleteModule,
  MatAutocompleteTrigger
} from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';

@Component({
  selector: 'app-auto-complete',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule
],
  templateUrl: './auto-complete.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutoCompleteComponent implements OnInit {
  
  @Input() control!: FormControl;
  @Input() placeholder = 'Buscar...';
  @Input() buscarFn!: (termo: string) => Observable<any[]>;
  @Input() label = '';
  @Input() displayWith: (item: any) => string = () => '';
  @Input() minimoCaracteres = 1;
  @Input() multiplo = false;
  @Output() selecionado = new EventEmitter<any>();

  @ViewChild(MatAutocompleteTrigger) trigger!: MatAutocompleteTrigger;

  opcoesFiltradas: any[] = [];
  private reabrirBloqueado = false;
  buscaExecutada = false;
  private onChange = (_: any) => {};

  ngOnInit(): void {
    if (!this.control) {
      throw new Error('O FormControl é obrigatório para <app-auto-complete-id>');
    }
  
    this.control.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((valor: any) => {
          if (typeof valor !== 'string') return of([]);
          if (this.minimoCaracteres > 0 && valor.length < this.minimoCaracteres) return of([]);
          return this.buscarFn(valor);
        })
      )
      .subscribe(opcoes => {
        this.buscaExecutada = true;
        this.opcoesFiltradas = opcoes;
      
        if (this.trigger.panelOpen) {
          this.trigger.closePanel();
          setTimeout(() => this.trigger.openPanel(), 0);
        } else if (opcoes.length > 0) {
          setTimeout(() => this.trigger.openPanel(), 0);
        }
      });
  }

  aoSelecionar(item: any): void {
    if (!this.multiplo) {
      this.reabrirBloqueado = true;
      this.control.setValue(item, { emitEvent: false });
      this.selecionado.emit(item);
      this.onChange(item.id);

      setTimeout(() => {
        this.reabrirBloqueado = false;
      }, 300);
    }
  }

  abrirOpcoes(): void {
    if (this.reabrirBloqueado) return;
  
    this.buscaExecutada = false;
  
    if (this.minimoCaracteres === 0) {
      this.buscarFn('').subscribe(opcoes => {
        this.opcoesFiltradas = opcoes;
        this.buscaExecutada = true;
        setTimeout(() => this.trigger.openPanel(), 0);
      });
    }
  }

  updateErrorMessage(): void {
    this.control.markAsTouched();
  }

  errorMessage(): string {
    if (this.control.hasError('required')) {
      return 'Campo obrigatório';
    }
    return 'Valor inválido';
  }

  get isRequired(): boolean {
    return this.control?.validator?.({} as any)?.['required'] ?? false;
  }

  writeValue(valor: any): void {}

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.control.disable() : this.control.enable();
  }
}
