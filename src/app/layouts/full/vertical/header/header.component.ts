import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';

import { RouterModule } from '@angular/router';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { MaterialModule } from 'src/app/material.module';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterModule, DesignSystemIconsModule, MaterialModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() showToggle = true;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();
  private readonly fullscreenChangeHandler = () => {
    this.emTelaCheia = Boolean(document.fullscreenElement);
  };

  emTelaCheia = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.emTelaCheia = Boolean(document.fullscreenElement);
    document.addEventListener('fullscreenchange', this.fullscreenChangeHandler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);
  }

  get usuarioNome(): string {
    return this.authService.getUsuarioNome() || 'Admin';
  }

  recarregarPagina(): void {
    window.location.reload();
  }

  alternarTelaCheia(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
      return;
    }

    document.documentElement.requestFullscreen().catch(() => undefined);
  }

  logout(): void {
    this.authService.logout();
  }
}
