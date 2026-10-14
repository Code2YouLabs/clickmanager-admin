import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { StatusLabelPipe } from 'src/app/pipes/status-label.pipe';

type StatusConfig = { icon: string; label: string; className: string };

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule, MatIconModule, StatusLabelPipe],
  templateUrl: './status-badge.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./status-badge.component.scss']
})
export class StatusBadgeComponent {
  @Input() status: string | null | undefined;

  private readonly map: Record<string, StatusConfig> = {
    ATIVO: { icon: 'check_circle', label: 'ATIVO', className: 'chip-pronto' },
    AFASTADO: { icon: 'pause_circle', label: 'AFASTADO', className: 'chip-aguardando' },
    DESLIGADO: { icon: 'block', label: 'DESLIGADO', className: 'chip-cancelado' },
    RASCUNHO: { icon: 'edit', label: 'RASCUNHO', className: 'chip-rascunho' },
    PENDENTE: { icon: 'schedule', label: 'PENDENTE', className: 'chip-pendente' },
    ORCAMENTO: { icon: 'assignment', label: 'ORCAMENTO', className: 'chip-orcamento' },
    AGUARDANDO_PAGAMENTO: { icon: 'credit_card', label: 'AGUARDANDO_PAGAMENTO', className: 'chip-aguardando' },
    EM_PRODUCAO: { icon: 'lock', label: 'EM_PRODUCAO', className: 'chip-producao' },
    PRONTO: { icon: 'check_circle', label: 'PRONTO', className: 'chip-pronto' },
    ENTREGUE: { icon: 'local_shipping', label: 'ENTREGUE', className: 'chip-entregue' },
    CANCELADO: { icon: 'close', label: 'CANCELADO', className: 'chip-cancelado' },
    ABERTO: { icon: 'schedule', label: 'ABERTO', className: 'chip-pendente' },
    FECHADO: { icon: 'task_alt', label: 'FECHADO', className: 'chip-producao' },
    PARCIAL: { icon: 'payments', label: 'PARCIAL', className: 'chip-aguardando' },
    PAGO: { icon: 'check_circle', label: 'PAGO', className: 'chip-pronto' },
    EM_ANALISE: { icon: 'manage_search', label: 'EM_ANALISE', className: 'chip-analise' },
    AGUARDANDO_CLIENTE: { icon: 'hourglass_empty', label: 'AGUARDANDO_CLIENTE', className: 'chip-aguardando' },
    RESPONDIDO: { icon: 'chat_bubble', label: 'RESPONDIDO', className: 'chip-orcamento' },
    RESOLVIDO: { icon: 'verified', label: 'RESOLVIDO', className: 'chip-pronto' },
  };

  get config(): StatusConfig {
    const key = (this.status || '').toUpperCase();
    return this.map[key] || { icon: 'info', label: this.status || '—', className: 'chip-default' };
  }
}
