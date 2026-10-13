import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ToastrService {
  constructor(private readonly snackBar: MatSnackBar) {}

  success(message: string, title?: string): void {
    this.open(message, title, 'success');
  }

  error(message: string, title?: string): void {
    this.open(message, title, 'error');
  }

  warning(message: string, title?: string): void {
    this.open(message, title, 'warning');
  }

  info(message: string, title?: string): void {
    this.open(message, title, 'info');
  }

  private open(message: string, title: string | undefined, panelClass: string): void {
    this.snackBar.open(title ? `${title}: ${message}` : message, 'Fechar', {
      duration: 4500,
      panelClass: [`app-toast-${panelClass}`],
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }
}
