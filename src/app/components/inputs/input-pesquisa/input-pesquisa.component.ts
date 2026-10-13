import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-input-pesquisa',
  standalone: true,
  templateUrl: './input-pesquisa.component.html',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputPesquisaComponent {
  @Input() placeholder = 'Digite para pesquisar...';
  @Input() showLabel = true;
  @Output() valorAlterado = new EventEmitter<string>();

  pesquisaControl = new FormControl('');

  constructor() {
    this.pesquisaControl.valueChanges
      .pipe(debounceTime(400))
      .subscribe(valor => this.valorAlterado.emit(valor ?? undefined));
  }
  
}
