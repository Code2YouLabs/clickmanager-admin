import { Component, ViewChild } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';

@Component({
  selector: 'app-latest-deals',
  standalone: true,
  imports: [MaterialModule, DesignSystemIconsModule],
  templateUrl: './latest-deals.component.html',
})
export class AppLatestDealsComponent {
  constructor() {}
}
