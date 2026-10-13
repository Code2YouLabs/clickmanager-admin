import { Component } from '@angular/core';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { MaterialModule } from 'src/app/material.module';
import { ListingComponent } from './listing/listing.component';

@Component({
    selector: 'app-email',
    templateUrl: './email.component.html',
    imports: [MaterialModule, DesignSystemIconsModule, ListingComponent]
})
export class AppEmailComponent {
  constructor() {}
}
