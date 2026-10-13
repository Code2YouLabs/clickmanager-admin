import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr.service';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  const required = route.data?.['requiredPermission'] as string[] | string | undefined;
  const requiredList = Array.isArray(required) ? required : required ? [required] : [];

  if (!requiredList.length) return true;

  const hasPermission = requiredList.some((p) => auth.temPermissao(p));
  if (hasPermission) return true;

  toastr.warning('Você não possui permissão para acessar esta configuração.');
  return router.createUrlTree(['/dashboard']);
};
