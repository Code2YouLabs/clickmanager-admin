import { Directive, computed, input } from '@angular/core';

@Directive({ selector: 'textarea[dsTextarea]', standalone: true, host: { 'data-slot': 'textarea', '[class]': 'classes()', '[attr.aria-invalid]': 'invalid() || null' } })
export class DsTextareaDirective {
  readonly invalid = input(false); readonly className = input('');
  readonly classes = computed(() => `flex min-h-24 w-full resize-y rounded-md border border-input bg-surface px-3 py-2 text-sm text-surface-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50 aria-invalid:border-destructive ${this.className()}`);
}
