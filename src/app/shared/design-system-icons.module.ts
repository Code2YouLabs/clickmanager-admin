import { Component, Input, NgModule } from '@angular/core';
import { getIcon, IconName } from '@code2youlabs/icons';

const aliases: Record<string, IconName> = {
  'alert-circle': 'alertCircle',
  check: 'check',
  'chevron-down': 'chevronDown',
  'chevron-left': 'chevronLeft',
  'chevron-right': 'chevronRight',
  'circle-check': 'circleCheck',
  eye: 'eye',
  'eye-off': 'eyeOff',
  'info-circle': 'infoCircle',
  loader: 'loader',
  search: 'search',
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
