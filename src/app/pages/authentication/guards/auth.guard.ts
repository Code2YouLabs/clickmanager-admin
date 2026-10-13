import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../../../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router, private authService: AuthService) {}

  canActivate(): Observable<boolean | UrlTree> {
    const token = this.authService.getToken();
    if (token && !this.authService.isAccessTokenExpired(token)) {
      return of(true);
    }

    return of(this.router.createUrlTree(['/login']));
  }
}
