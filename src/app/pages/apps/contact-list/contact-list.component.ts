import { Component } from '@angular/core';
import { AppListingComponent } from 'src/app/pages/apps/contact-list/listing/listing.component';
import { MaterialModule } from 'src/app/material.module';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';

@Component({
  selector: 'app-contact-list',
  imports: [AppListingComponent, DesignSystemIconsModule, MaterialModule],
  templateUrl: './contact-list.component.html',
})
export class AppContactListComponent {}
