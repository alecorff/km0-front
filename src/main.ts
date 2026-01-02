import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { HTTP_INTERCEPTORS, HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { importProvidersFrom } from '@angular/core';
import { HttpErrorInterceptor } from './app/interceptor/httpError.interceptor';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { FR_DATE_FORMATS, MondayDateAdapter } from './app/config/monday-date-adapter';

// Fonction pour créer le loader
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()), 
    provideAnimationsAsync(),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient]
        },
        defaultLanguage: 'fr'
      })
    ),
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: DateAdapter, useClass: MondayDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: FR_DATE_FORMATS }
  ],
}).catch(err => console.error(err));
