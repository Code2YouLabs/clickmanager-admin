
import { Component, Input } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-tabs-section-card',
  standalone: true,
  imports: [MatTabsModule],
  templateUrl: './tabs-section-card.component.html',
  styleUrls: ['./tabs-section-card.component.scss']
})
export class TabsSectionCardComponent {
  @Input() stretchTabs = false;
  @Input() alignTabs: 'start' | 'center' | 'end' = 'start';
  @Input() animationDuration = '300ms';
}
