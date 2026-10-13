import { Directive, computed, input } from '@angular/core';

@Directive({ selector: 'input[dsInput]', standalone: true, host: { 'data-slot': 'input', '[class]': 'classes()', '[attr.aria-invalid]': 'invalid() || null' } })
export class DsInputDirective {
  readonly invalid = input(false); readonly className = input('');
  readonly classes = computed(() => `flex h-10 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-surface-foreground shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive ${this.className()}`);
}
