import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, Input, OnChanges, OnInit, SimpleChanges
} from '@angular/core';

import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-input-multi-select',
  standalone: true,
  templateUrl: './input-multi-select-component.html',
  styleUrls: ['./input-multi-select-component.scss'],
  imports: [ReactiveFormsModule, MatCardModule, MatListModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputMultiSelectComponent implements OnInit, OnChanges {
  @Input() control!: FormControl;
  @Input() label = 'Selecionar';

  /** SEMPRE passe um novo array ao atualizar (options = [...dados]) */
  @Input() options: { id: any; nome: string }[] = [];

  /** Layout */
  @Input() cardMinHeight = 220;  // px
  @Input() listHeight = 180;     // px  -> área que terá overflow: auto

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (!this.control) throw new Error('FormControl obrigatório para <app-input-multi-select>');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      this.options = [...(this.options ?? [])]; // garante repaint com OnPush
      this.cdr.markForCheck();
    }
  }

  get isRequired(): boolean {
    return this.control?.validator?.({} as any)?.['required'] ?? false;
  }

  trackById(_: number, o: { id: any }) { return o.id; }

  errorMessage(): string {
    return this.control?.hasError('required') ? 'Campo obrigatório' : 'Seleção inválida';
  }
}
