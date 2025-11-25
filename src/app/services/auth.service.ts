import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private backendUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  login() {
    window.location.href = `${this.backendUrl}/oauth2/authorization/strava`;
  }

  getUserInfo(tokenResponse: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/loginSuccess?tokenResponse=${tokenResponse}`);
  }
}
