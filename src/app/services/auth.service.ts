import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GlobalService } from './global.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  private backendUrl = `${this.globalService.apiUrl}`;

  constructor(
    private http: HttpClient,
    private globalService: GlobalService
  ) {}

  login() {
    window.location.href = `${this.backendUrl}/oauth2/authorization/strava`;
  }

  getUserInfo(tokenResponse: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/loginSuccess?tokenResponse=${tokenResponse}`);
  }
}
