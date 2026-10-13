import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminDisplayModeService {
  private readonly painelSubject = new BehaviorSubject<boolean>(false);
  readonly painel$ = this.painelSubject.asObservable();

  constructor() {
    document.addEventListener('fullscreenchange', () => {
      this.setPainelAtivo(Boolean(document.fullscreenElement));
    });
  }

  get painelAtivo(): boolean {
    return this.painelSubject.value;
  }

  setPainelAtivo(ativo: boolean): void {
    this.painelSubject.next(ativo);
    document.body.classList.toggle('admin-panel-mode', ativo);
  }
}
