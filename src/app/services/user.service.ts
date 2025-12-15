// user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
  athleteId: number;
  firstname: string;
  lastname: string;
  avatar: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: string;
  lastSync: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private baseUrl = 'http://localhost:8080/api/user';

  constructor(private http: HttpClient) {}

  getLastSync(): Observable<string> {
    const jwt = localStorage.getItem('jwt') ?? "";
    const headers = new HttpHeaders().set('Authorization', `Bearer ${jwt}`);

    return this.http.get<string>(`${this.baseUrl}/lastSync`, { 
      headers: headers
    });
  }
}
