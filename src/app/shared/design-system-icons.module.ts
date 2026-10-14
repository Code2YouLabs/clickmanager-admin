import { Component, Input, NgModule, ChangeDetectionStrategy, isDevMode } from '@angular/core';
import { TablerIconComponent, type TablerIcon } from '@tabler/icons-angular';
import { ADMIN_TABLER_ICONS } from './admin-tabler-icons';

// Compatibility bridge for existing standalone imports and <i-tabler name="…">.
// Tabler owns the SVG rendering; this adapter only resolves validated names.
@Component({
  selector: 'i-tabler',
  standalone: true,
  imports: [TablerIconComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host {
      display: inline-block;
      width: 24px;
      height: 24px;
      vertical-align: middle;
      flex-shrink: 0;
    }
  `],
  template: `
    @if (definition) {
      <tabler-icon
        [icon]="definition"
        [style.width.%]="100"
        [style.height.%]="100"
        [style.display]="'block'"
        [svgAttributes]="{ 'aria-hidden': 'true' }"
      />
    }
  `,
})
export class DesignSystemIconComponent {
  definition: TablerIcon | undefined;
  private iconName = '';

  @Input()
  set name(value: string) {
    this.iconName = value;
    this.definition = ADMIN_TABLER_ICONS.get(value);
    if (!this.definition && isDevMode()) {
      console.warn(`[ClickManager icons] Unknown Tabler icon "${value}". Run npm run check:icons and npm run icons:sync.`);
    }
  }

  get name(): string {
    return this.iconName;
  }
}

@NgModule({
  imports: [DesignSystemIconComponent],
  exports: [DesignSystemIconComponent],
})
export class DesignSystemIconsModule {}
