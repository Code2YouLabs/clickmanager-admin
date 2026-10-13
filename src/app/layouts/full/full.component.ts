import { BreakpointObserver, MediaMatcher } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { MaterialModule } from 'src/app/material.module';
import { CoreService } from 'src/app/services/core.service';
import { AppSettings } from 'src/app/config';
import { NavService } from '../../services/nav.service';
import { AppNavItemComponent } from './vertical/sidebar/nav-item/nav-item.component';
import { SidebarComponent } from './vertical/sidebar/sidebar.component';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { DesignSystemIconsModule } from 'src/app/shared/design-system-icons.module';
import { HeaderComponent } from './vertical/header/header.component';
import { AppBreadcrumbComponent } from './shared/breadcrumb/breadcrumb.component';
import { navItems } from './vertical/sidebar/sidebar-data';
import { NavItem } from './vertical/sidebar/nav-item/nav-item';
import { AdminDisplayModeService } from 'src/app/services/admin-display-mode.service';
import { AuthService } from 'src/app/services/auth.service';
import { BillingStateService } from 'src/app/pages/billing/services/billing-state.service';

const MOBILE_VIEW = 'screen and (max-width: 768px)';
const TABLET_VIEW = 'screen and (min-width: 769px) and (max-width: 1024px)';
const MONITOR_VIEW = 'screen and (min-width: 1024px)';
const BELOWMONITOR = 'screen and (max-width: 1023px)';

@Component({
  selector: 'app-full',
  standalone: true,
  imports: [
    RouterModule,
    AppNavItemComponent,
    MaterialModule,
    CommonModule,
    SidebarComponent,
    NgScrollbarModule,
    DesignSystemIconsModule,
    HeaderComponent,
    AppBreadcrumbComponent
  ],
  templateUrl: './full.component.html',
  styleUrls: ['./full.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FullComponent {
  @ViewChild('leftsidenav')
  public sidenav!: MatSidenav;

  @ViewChild('content', { static: true })
  content!: MatSidenavContent;

  options = this.settings.getOptions();
  resView = false;
  navItemsFiltrados: NavItem[] = [];

  private layoutChangesSubscription = Subscription.EMPTY;
  private readonly menuChangesSubscription = new Subscription();
  private isMobileScreen = false;
  private isContentWidthFixed = true;
  private htmlElement!: HTMLHtmlElement;

  get isOver(): boolean {
    return this.isMobileScreen;
  }

  get modoPainelAtivo(): boolean {
    return this.displayModeService.painelAtivo && this.router.url.startsWith('/dashboard');
  }

  constructor(
    private settings: CoreService,
    private mediaMatcher: MediaMatcher,
    private router: Router,
    private breakpointObserver: BreakpointObserver,
    private navService: NavService,
    private displayModeService: AdminDisplayModeService,
    private authService: AuthService,
    private billingState: BillingStateService
  ) {
    this.htmlElement = document.querySelector('html')!;
    this.layoutChangesSubscription = this.breakpointObserver
      .observe([MOBILE_VIEW, TABLET_VIEW, MONITOR_VIEW, BELOWMONITOR])
      .pipe(distinctUntilChanged())
      .subscribe((state) => {
        this.options.sidenavOpened = true;
        this.isMobileScreen = state.breakpoints[BELOWMONITOR];
        if (this.options.sidenavCollapsed === false) {
          this.options.sidenavCollapsed = state.breakpoints[TABLET_VIEW];
        }
        this.isContentWidthFixed = state.breakpoints[MONITOR_VIEW];
        this.resView = state.breakpoints[BELOWMONITOR];
      });

    this.receiveOptions(this.options);
    this.atualizarMenu();

    this.menuChangesSubscription.add(this.billingState.billing$.subscribe(() => this.atualizarMenu()));
    this.menuChangesSubscription.add(this.authService.usuario$.subscribe(() => this.atualizarMenu()));

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.content?.scrollTo({ top: 0 });
      });
  }

  ngOnDestroy() {
    this.layoutChangesSubscription.unsubscribe();
    this.menuChangesSubscription.unsubscribe();
  }

  toggleCollapsed() {
    this.isContentWidthFixed = false;
    this.options.sidenavCollapsed = !this.options.sidenavCollapsed;
    this.resetCollapsedState();
  }

  resetCollapsedState(timer = 400) {
    setTimeout(() => this.settings.setOptions(this.options), timer);
  }

  onSidenavClosedStart() {
    this.isContentWidthFixed = false;
  }

  onSidenavOpenedChange(isOpened: boolean) {
    this.options.sidenavOpened = isOpened;
    this.settings.setOptions(this.options);
  }

  receiveOptions(options: AppSettings): void {
    this.options = options;
    this.toggleDarkTheme(options);
  }

  toggleDarkTheme(options: AppSettings) {
    if (options.theme === 'dark') {
      this.htmlElement.classList.add('dark-theme');
      this.htmlElement.classList.remove('light-theme');
    } else {
      this.htmlElement.classList.remove('dark-theme');
      this.htmlElement.classList.add('light-theme');
    }
  }

  private atualizarMenu(): void {
    this.navItemsFiltrados = this.filtrarNavItems(navItems);
  }

  private filtrarNavItems(items: NavItem[]): NavItem[] {
    return items
      .map(item => {
        const children = item.children ? this.filtrarNavItems(item.children) : undefined;
        return { ...item, ...(children ? { children } : {}) };
      })
      .filter(item => this.podeExibirItem(item));
  }

  private podeExibirItem(item: NavItem): boolean {
    if (item.children?.length) return true;
    if (item.featureKey) {
      const permissoes = item.requiredPermission?.length ? item.requiredPermission : [undefined];
      return permissoes.some(permissao => this.authService.podeAcessarFuncionalidade(item.featureKey!, permissao));
    }
    if (item.requiredPermission?.length) {
      return this.authService.temAlgumaPermissao(item.requiredPermission);
    }
    return true;
  }
}
