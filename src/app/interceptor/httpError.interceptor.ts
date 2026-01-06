import { HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable, Injector } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { catchError, throwError } from "rxjs";

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {

    constructor(
        private injector: Injector,
        private router: Router,
        private snackBar: MatSnackBar
    ) { }

    intercept(req: HttpRequest<any>, next: HttpHandler) {
        return next.handle(req).pipe(
            catchError((error: HttpErrorResponse) => {

                console.log(error.error?.message);
                const key = error.error?.message;
                const translateService = this.injector.get(TranslateService);

                // On redirige sur la page d'accueil
                if (error.status === 403 || error.status === 404) {
                    this.snackBar.open(
                        translateService.instant('i18n.common.error_message.' + key),
                        translateService.instant('i18n.common.error_message.action'),
                        {
                            duration: 3000,
                            horizontalPosition: 'center',
                            verticalPosition: 'top',
                            panelClass: ['app-snackbar-error']
                        }
                    );

                    this.router.navigate(['/']);
                }

                // On reste sur la page actuelle
                if (error.status === 500) {
                    this.snackBar.open(
                        translateService.instant('i18n.common.error_message.' + key),
                        translateService.instant('i18n.common.error_message.action'),
                        {
                            duration: 3000,
                            horizontalPosition: 'center',
                            verticalPosition: 'top',
                            panelClass: ['app-snackbar-error']
                        }
                    );
                }

                return throwError(() => error);
            })
        );
    }
}
