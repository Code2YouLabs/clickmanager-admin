import { Component, ViewChild } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';

@Component({
  selector: 'app-blog-card',
  standalone: true,
  imports: [MaterialModule, DesignSystemIconsModule],
  templateUrl: './blog-card.component.html',
})
export class AppBlogCardComponent {
  constructor() {}
}
