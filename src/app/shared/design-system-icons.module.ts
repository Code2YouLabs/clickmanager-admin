import { Component, Input, NgModule } from '@angular/core';
import { getIcon, IconName } from '@code2youlabs/icons';

const aliases: Record<string, IconName> = {
  'alert-circle': 'alertCircle',
  'bell-ringing': 'loader',
  browser: 'circleCheck',
  building: 'infoCircle',
  calculator: 'loader',
  check: 'check',
  'chart-bar': 'search',
  'chart-funnel': 'search',
  'chevron-down': 'chevronDown',
  'chevron-left': 'chevronLeft',
  'chevron-right': 'chevronRight',
  'circle-check': 'circleCheck',
  'credit-card': 'eye',
  eye: 'eye',
  'eye-off': 'eyeOff',
  'layout-dashboard': 'circleCheck',
  lifebuoy: 'alertCircle',
  mail: 'x',
  'info-circle': 'infoCircle',
  loader: 'loader',
  point: 'chevronRight',
  'receipt-2': 'eyeOff',
  search: 'search',
  sparkles: 'check',
  ticket: 'check',
  timeline: 'chevronRight',
  'world-www': 'chevronDown',
  x: 'x',
};

@Component({
  selector: 'i-tabler',
  standalone: true,
  template: `
    <svg
      [attr.aria-hidden]="'true'"
      [attr.width]="24"
      [attr.height]="24"
      [attr.viewBox]="definition.viewBox"
      [attr.fill]="'none'"
      [attr.stroke]="'currentColor'"
      [attr.stroke-width]="2"
      [attr.stroke-linecap]="'round'"
      [attr.stroke-linejoin]="'round'"
      role="img"
    >
      @for (path of definition.paths; track path) {
        <path [attr.d]="path"></path>
      }
    </svg>
  `,
})
export class DesignSystemIconComponent {
  @Input() name = '';

  get definition() {
    return getIcon(aliases[this.name] ?? 'infoCircle');
  }
}

@NgModule({
  imports: [DesignSystemIconComponent],
  exports: [DesignSystemIconComponent],
})
export class DesignSystemIconsModule {}
