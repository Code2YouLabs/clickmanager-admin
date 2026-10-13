import { Component } from '@angular/core';
import { MaterialModule } from '../../../material.module';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-new-goals',
  standalone: true,
  imports: [MaterialModule, DesignSystemIconsModule, MatProgressBarModule],
  templateUrl: './new-goals.component.html',
})
export class AppNewGoalsComponent {}
