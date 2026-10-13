
import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { StatusLabelPipe } from 'src/app/pipes/status-label.pipe';

interface DialogOpcao {
  status: string;
  label: string;
  bloqueado?: boolean;
  motivo?: string;
}

@Component({
  selector: 'app-pedido-trocar-status-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    ReactiveFormsModule,
    StatusLabelPipe
],
  templateUrl: './pedido-trocar-status-dialog.component.html',
  styleUrls: ['./pedido-trocar-status-dialog.component.scss']
})
export class PedidoTrocarStatusDialogComponent {
  control = new FormControl<string | null>(null);

  constructor(
    private dialogRef: MatDialogRef<PedidoTrocarStatusDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { statusAtual: string; opcoes: DialogOpcao[] }
  ) {
    const primeiraDisponivel = (data.opcoes || []).find(o => !o.bloqueado)?.status || null;
    this.control.setValue(primeiraDisponivel);
  }

  salvar(): void {
    this.dialogRef.close({ status: this.control.value });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
