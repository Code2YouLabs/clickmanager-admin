import { Component } from '@angular/core';

import { MaterialModule } from '../../../material.module';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { NgScrollbarModule } from 'ngx-scrollbar';

@Component({
  selector: 'app-upcoming-schedules',
  standalone: true,
  imports: [MaterialModule, DesignSystemIconsModule, NgScrollbarModule],
  templateUrl: './upcoming-schedules.component.html',
})
export class AppUpcomingSchedulesComponent {
  constructor() {}
}
