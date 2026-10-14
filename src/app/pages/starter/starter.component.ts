import { Component, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';
import { MaterialModule } from '../../material.module';

@Component({
    selector: 'app-starter',
    imports: [MaterialModule],
    templateUrl: './starter.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    encapsulation: ViewEncapsulation.None
})
export class StarterComponent {}
