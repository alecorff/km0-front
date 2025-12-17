// user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  private baseUrl = 'http://localhost:8080/api/activity';

  constructor(private http: HttpClient) {}

  syncActivities(lastSync: any): Observable<string> {
    const jwt = localStorage.getItem('jwt') ?? "";
    const headers = new HttpHeaders().set('Authorization', `Bearer ${jwt}`);

    let params = new HttpParams();
    if (lastSync !== null && lastSync !== undefined) {
        params = params.set('lastSync', lastSync.toString());
    }

    return this.http.get<string>(`${this.baseUrl}/syncActivities`, {
        headers: headers, 
        params: params
    });
  }

  getActivitiesForPlanPeriod(startDate: Date): Observable<any[]> {
    const jwt = localStorage.getItem('jwt') ?? "";
    const headers = new HttpHeaders().set('Authorization', `Bearer ${jwt}`);

    let params = new HttpParams();
    params = params.set('startDate', startDate.toString());

    return this.http.get<any[]>(`${this.baseUrl}/getActivitiesForPlanPeriod`, {
        headers: headers, 
        params: params
    });
  }
}
