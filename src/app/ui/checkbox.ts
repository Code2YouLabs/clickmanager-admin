import { ChangeDetectionStrategy, Component, computed, forwardRef, input, linkedSignal, output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ds-checkbox', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DsCheckboxComponent), multi: true }],
  template: `<label class="inline-flex items-center gap-2 text-sm"><input data-slot="checkbox" type="checkbox" class="size-4 rounded border border-input accent-primary focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" [checked]="currentChecked()" [disabled]="effectiveDisabled()" [attr.aria-invalid]="invalid() || null" (change)="changed($event)" (blur)="touched()" /><ng-content /></label>`
})
export class DsCheckboxComponent implements ControlValueAccessor {
  readonly checked = input(false); readonly disabled = input(false); readonly invalid = input(false); readonly checkedChange = output<boolean>();
  readonly currentChecked = linkedSignal(() => this.checked());
  private readonly formDisabled = signal(false); readonly effectiveDisabled = computed(() => this.disabled() || this.formDisabled());
  private onChange: (checked: boolean) => void = () => {}; private onTouched: () => void = () => {};
  writeValue(value: unknown) { this.currentChecked.set(value === true); }
  registerOnChange(fn: (checked: boolean) => void) { this.onChange = fn; }
  registerOnTouched(fn: () => void) { this.onTouched = fn; }
  setDisabledState(disabled: boolean) { this.formDisabled.set(disabled); }
  changed(event: Event) { if (this.effectiveDisabled()) return; const checked = (event.target as HTMLInputElement).checked; this.currentChecked.set(checked); this.onChange(checked); this.checkedChange.emit(checked); }
  touched() { this.onTouched(); }
}
