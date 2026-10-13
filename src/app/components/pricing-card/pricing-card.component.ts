import { CommonModule, CurrencyPipe, NgIf, NgFor } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { PlanoPublico } from 'src/app/types/plano-publico.type';

@Component({
  selector: 'app-pricing-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, DesignSystemIconsModule, CurrencyPipe, NgIf, NgFor],
  templateUrl: './pricing-card.component.html',
  styleUrls: ['./pricing-card.component.scss']
})
export class PricingCardComponent {
  @Input() plano!: PlanoPublico;
  @Input() popular: boolean = false;
  @Input() imgSrc?: string;
  @Input() ativo: boolean = false;
  @Input() mostrarAnual: boolean = false;
  @Input() selecionarTexto: string = 'Escolher plano';
  @Output() escolher = new EventEmitter<PlanoPublico>();

  preco(plano: PlanoPublico): number {
    const cents = plano.preco_centavos ?? (plano as any).precoCentavos ?? 0;
    return Number.isFinite(cents) ? cents / 100 : 0;
  }

  precoAnual(plano: PlanoPublico): number {
    return this.preco(plano) * 12;
  }

  get valorExibicao(): number | null {
    const valor = this.mostrarAnual ? this.precoAnual(this.plano) : this.preco(this.plano);
    return Number.isFinite(valor) ? valor : null;
  }

  getBeneficios(plano: PlanoPublico): string[] {
    const beneficios = plano.beneficios_json;
    if (!beneficios) return [];
    if (Array.isArray(beneficios)) return beneficios as string[];
    try {
      const parsed = JSON.parse(beneficios);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  onEscolher(): void {
    this.escolher.emit(this.plano);
  }

  get beneficios(): string[] {
    return this.getBeneficios(this.plano);
  }

  get isFree(): boolean {
    return !this.preco(this.plano);
  }

  get vantagem(): string | null {
    const raw = this.plano?.vantagem ?? (this.plano as any)?.vantagem;
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed.length ? trimmed : null;
  }

  get destaqueLabel(): string | null {
    const raw = this.plano?.destaque ?? (this.plano as any)?.destaque;
    if (!raw || typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    return trimmed.length ? trimmed : null;
  }

  get isDestaque(): boolean {
    return !!this.destaqueLabel;
  }
}
