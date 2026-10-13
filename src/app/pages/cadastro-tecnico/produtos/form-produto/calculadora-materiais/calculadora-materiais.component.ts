
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-calculadora-materiais',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './calculadora-materiais.component.html',
  styleUrls: ['./calculadora-materiais.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalculadoraMateriaisComponent {
  @Input() produtoId?: number;
}
