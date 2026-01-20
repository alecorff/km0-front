import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { GlobalService } from './global.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private backendUrl = `${this.globalService.apiUrl}`;
  private baseUrl = `${this.globalService.apiUrl}/api/auth`;

  constructor(
    private http: HttpClient,
    private globalService: GlobalService
  ) { }

  login() {
    window.location.href = `${this.backendUrl}/oauth2/authorization/strava`;
  }

  async hasValidSession(): Promise<boolean> {
    const jwt = localStorage.getItem('jwt') ?? '';
    if (!jwt) return false;

    const headers = { Authorization: `Bearer ${jwt}` };

    try {
      return await firstValueFrom(this.http.get<boolean>(`${this.baseUrl}/hasValidSession`, { headers }));
    } catch (err) {
      return false;
    }
  }
}
