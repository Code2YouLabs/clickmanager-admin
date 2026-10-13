import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ds-field', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div data-slot="field" class="grid gap-1.5"><label class="text-sm font-medium" [attr.for]="htmlFor()">{{ label() }}@if (required()) { <span class="ml-1 text-destructive" aria-hidden="true">*</span> }</label><ng-content />@if (error()) { <p class="text-sm text-destructive" role="alert">{{ error() }}</p> } @else if (description()) { <p class="text-sm text-muted-foreground">{{ description() }}</p> }</div>`
})
export class DsFieldComponent { readonly label = input.required<string>(); readonly htmlFor = input<string>(); readonly description = input<string>(); readonly error = input<string>(); readonly required = input(false); }
