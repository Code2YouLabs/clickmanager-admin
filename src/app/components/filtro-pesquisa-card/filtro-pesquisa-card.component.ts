
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { SectionCardComponent } from '../section-card/section-card.component';
import { InputPesquisaComponent } from '../inputs/input-pesquisa/input-pesquisa.component';

@Component({
  selector: 'app-filtro-pesquisa-card',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    SectionCardComponent,
    InputPesquisaComponent
],
  templateUrl: './filtro-pesquisa-card.component.html',
  styleUrls: ['./filtro-pesquisa-card.component.scss']
})
export class FiltroPesquisaCardComponent {
  @Input() titulo = 'Pesquisar';
  @Input() placeholder = 'Digite para pesquisar...';
  @Input() statusOptions: string[] = [];
  @Input() statusSelecionado = 'TODOS';
  @Input() mostrarStatus = true;

  @Output() pesquisar = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<string>();

  onPesquisar(valor: string) {
    this.pesquisar.emit(valor);
  }

  onStatusChange(valor: string) {
    this.statusChange.emit(valor);
  }
}
