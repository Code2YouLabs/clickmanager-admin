import { Component, Input } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

/**
 * Card genérico para seções da aplicação.
 * - Aceita título e subtítulo opcionais.
 * - Mantém paddings e hierarquia visual consistentes.
 * - Usa projeção de conteúdo para corpo e ações.
 *
 * Uso:
 * <app-section-card titulo="Itens" subtitulo="Adicione produtos">
 *   <!-- conteúdo -->
 * </app-section-card>
 *
 * <app-section-card titulo="Pagamentos">
 *   <div actions> <!-- conteúdo alinhado à direita no header --> </div>
 *   <!-- corpo -->
 * </app-section-card>
 */
@Component({
  selector: 'app-section-card',
  standalone: true,
  imports: [MatCardModule, MatDividerModule],
  templateUrl: './section-card.component.html',
  styleUrls: ['./section-card.component.scss'],
})
export class SectionCardComponent {
  @Input() titulo: string = '';
  @Input() subtitulo?: string;
  @Input() divider: boolean = false;

  get showDivider(): boolean {
    return !!this.titulo?.trim() && this.divider;
  }
}
