import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';

@Component({
  selector: 'app-error',
  standalone: true,
  imports: [RouterModule, MaterialModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './error.component.html',
})
export class AppErrorComponent {}
