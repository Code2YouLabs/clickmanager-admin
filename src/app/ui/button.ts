import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

const variants: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-foreground hover:opacity-90', secondary: 'bg-secondary text-secondary-foreground hover:opacity-85', outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground', ghost: 'hover:bg-accent hover:text-accent-foreground', destructive: 'bg-destructive text-destructive-foreground hover:opacity-90', link: 'text-primary underline-offset-4 hover:underline'
};
const sizes: Record<ButtonSize, string> = { sm: 'h-8 px-3 text-sm', default: 'h-10 px-4', lg: 'h-11 px-6', icon: 'size-10' };

@Component({
  selector: 'ds-button', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button data-slot="button" [attr.type]="type()" [class]="classes()" [disabled]="disabled() || loading()" [attr.aria-busy]="loading() || null" (click)="pressed.emit()">@if (loading()) { <span aria-hidden="true" class="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"></span> }<ng-content /></button>`
})
export class DsButtonComponent {
  readonly variant = input<ButtonVariant>('default'); readonly size = input<ButtonSize>('default'); readonly type = input<'button' | 'submit' | 'reset'>('button'); readonly disabled = input(false); readonly loading = input(false); readonly className = input(''); readonly pressed = output<void>();
  readonly classes = computed(() => `inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${variants[this.variant()]} ${sizes[this.size()]} ${this.className()}`);
}
