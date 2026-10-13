import { Component } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';

@Component({
  selector: 'app-top-cards',
  standalone: true,
  imports: [MaterialModule, DesignSystemIconsModule],
  templateUrl: './top-cards.component.html',
})
export class AppTopCardsComponent {}
