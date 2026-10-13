
import { Component, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { InputTelefoneComponent } from 'src/app/components/inputs/input-telefone/input-telefone.component';
import { ToastrService } from 'src/app/services/toastr.service';

export interface DialogFolhaWhatsappData {
  funcionarioNome: string;
  competencia: string;
  mensagem: string;
  telefone?: string;
}

@Component({
  selector: 'app-dialog-folha-whatsapp',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatIconModule, InputTelefoneComponent],
  templateUrl: './dialog-folha-whatsapp.component.html',
  styleUrl: './dialog-folha-whatsapp.component.scss'
})
export class DialogFolhaWhatsappComponent {
  form = this.fb.group({
    telefone: [this.data.telefone || '']
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: DialogFolhaWhatsappData,
    private readonly fb: FormBuilder,
    private readonly toastr: ToastrService
  ) {}

  get telefoneControl(): any {
    return this.form.get('telefone') as any;
  }

  abrirWhatsApp(): void {
    this.telefoneControl.markAsTouched();
    if (this.form.invalid) {
      this.toastr.error('Informe um telefone válido para enviar no WhatsApp.');
      return;
    }

    const phone = this.toE164BR(this.telefoneControl.value || '');
    if (!phone) {
      this.toastr.error('Informe um telefone válido para enviar no WhatsApp.');
      return;
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(this.data.mensagem)}`;
    window.open(url, '_blank');
  }

  copiar(): void {
    if (!this.data.mensagem) return;
    navigator.clipboard
      .writeText(this.data.mensagem)
      .then(() => this.toastr.success('Mensagem copiada!'))
      .catch(() => this.toastr.error('Não foi possível copiar.'));
  }

  private toE164BR(raw: string): string {
    if (!raw) return '';
    let digits = raw.replace(/\D+/g, '');
    if (digits.startsWith('55')) return digits;
    if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
    if (digits.length === 10 || digits.length === 11) return '55' + digits;
    if (digits.length === 13 && digits.startsWith('550')) return '55' + digits.slice(2);
    if (!digits.startsWith('55')) digits = '55' + digits;
    return digits;
  }
}
