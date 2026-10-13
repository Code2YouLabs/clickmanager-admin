import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ToastrService } from 'src/app/services/toastr.service';
import { AuthService } from '../services/auth.service';

export const featureModuleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const featureKey = route.data?.['featureKey'] as string | undefined;
  const requiredPermission = route.data?.['requiredPermission'] as string[] | string | undefined;
  const requiredList = Array.isArray(requiredPermission)
    ? requiredPermission
    : requiredPermission
      ? [requiredPermission]
      : [];

  if (!featureKey) {
    return true;
  }

  const hasAccess = requiredList.length
    ? requiredList.some(permission => auth.podeAcessarFuncionalidade(featureKey, permission))
    : auth.podeAcessarFuncionalidade(featureKey);

  if (hasAccess) {
    return true;
  }

  toastr.info('Este módulo não está ativo no seu plano atual.');
  return router.createUrlTree(['/billing/pagamento'], {
    queryParams: { modulo: featureKey }
  });
};
