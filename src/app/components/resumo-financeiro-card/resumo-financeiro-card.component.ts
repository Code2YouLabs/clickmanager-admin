import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { SectionCardComponent } from '../section-card/section-card.component';

@Component({
  selector: 'app-resumo-financeiro-card',
  standalone: true,
  imports: [CommonModule, SectionCardComponent],
  templateUrl: './resumo-financeiro-card.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./resumo-financeiro-card.component.scss']
})
export class ResumoFinanceiroCardComponent {
  @Input() titulo = 'Resumo financeiro';
  @Input() divider = true;
  @Input() total = 0;
  @Input() subtotal = 0;
  @Input() pago = 0;
  @Input() frete = 0;
  @Input() restaPagar = 0;
  @Input() desconto = 0;
  @Input() inativo = false;
}
