
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-manual-link',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, RouterModule],
  templateUrl: './manual-link.component.html',
  styleUrls: ['./manual-link.component.scss']
})
export class ManualLinkComponent {
  @Input() routerLink: any[] | string = '/page/ajuda';
  @Input() fragment: string | undefined = undefined;
  @Input() label: string = 'Ajuda';
  @Input() icon: string = 'help_outline';
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() onlyIcon: boolean = false;
  @Input() ariaLabel: string = 'Abrir manual';
}
