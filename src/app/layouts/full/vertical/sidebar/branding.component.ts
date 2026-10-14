import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CoreService } from 'src/app/services/core.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-branding',
  imports: [RouterModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <a [routerLink]="['/']" class="logodark">
      <img
        src="./assets/images/logos/logoClickManager.png"
        class="align-middle m-2"
        alt="logo"
      />
    </a> 

    <a [routerLink]="['/']" class="logolight">
      <img
        src="./assets/images/logos/logo-light.svg"
        class="align-middle m-2"
        alt="logo"
      />
    </a>
  `,
})
export class BrandingComponent {
  options = this.settings.getOptions();
  constructor(private settings: CoreService) {}
}
