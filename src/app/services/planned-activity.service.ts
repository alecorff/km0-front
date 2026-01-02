// user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlannedActivityService {

  private baseUrl = 'http://localhost:8080/api/planned-activity';

  constructor(private http: HttpClient) {}

  savePlannedActivity(payload: any) {
    const jwt = localStorage.getItem('jwt') ?? "";
    const headers = new HttpHeaders().set('Authorization', `Bearer ${jwt}`);

    return this.http.post(`${this.baseUrl}/create`, payload, {
      headers: headers
    });
  }

  updatePlannedActivity(payload: any) {
    const jwt = localStorage.getItem('jwt') ?? '';
    const headers = new HttpHeaders().set('Authorization', `Bearer ${jwt}`);

    return this.http.put(`${this.baseUrl}/update/${payload.id}`, payload, { 
        headers: headers 
      });
  }


  getPlannedActivitiesForPlan(planId: string) {
    const jwt = localStorage.getItem('jwt') ?? "";
    const headers = new HttpHeaders().set('Authorization', `Bearer ${jwt}`);

    let params = new HttpParams();
    params = params.set('planId', planId);

    return this.http.get<any[]>(`${this.baseUrl}/getPlannedActivitiesForPlan`, {
        headers: headers, 
        params: params
    });
  }

}
