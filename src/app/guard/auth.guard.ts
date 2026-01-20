import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';

export const AuthGuard: CanActivateChildFn = async (next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> => {

  const authService = inject(AuthService);
  const router = inject(Router);
  const translateService = inject(TranslateService);
  const snackBar = inject(MatSnackBar);

  // Vérification de la session
  const isValid = await authService.hasValidSession();

  if (isValid) {
    return true;
  }

  // Session invalide
  const message = await firstValueFrom(translateService.get('i18n.common.error_message.session_lost'));
  const action = await firstValueFrom(translateService.get('i18n.common.error_message.action'));

  snackBar.open(message, action, {
    duration: 3000,
    horizontalPosition: 'center',
    verticalPosition: 'top',
    panelClass: ['app-snackbar-error']
  });

  router.navigate(['/login']);
  return false;
};
