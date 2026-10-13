import { Component } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-profile-card',
  standalone: true,
  imports: [MaterialModule, DesignSystemIconsModule, MatProgressBarModule],
  templateUrl: './profile-card.component.html',
})
export class AppProfileCardComponent {}
