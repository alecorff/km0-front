// user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TrainingPlanService {

  private baseUrl = 'http://localhost:8080/api/plan';

  constructor(private http: HttpClient) {}

  createTrainingPlan(payload: any) {
    const jwt = localStorage.getItem('jwt') ?? "";
    const headers = new HttpHeaders().set('Authorization', `Bearer ${jwt}`);

    return this.http.post(`${this.baseUrl}/createPlan`, payload, {
      headers: headers
    });
  }

  getAllPlans() {
    const jwt = localStorage.getItem('jwt') ?? "";
    const headers = new HttpHeaders().set('Authorization', `Bearer ${jwt}`);

    return this.http.get<any[]>(`${this.baseUrl}/getAllPlans`, {
        headers: headers
    });
  }

  getPlanById(planId: string) {
    const jwt = localStorage.getItem('jwt') ?? "";
    const headers = new HttpHeaders().set('Authorization', `Bearer ${jwt}`);

    let params = new HttpParams();
    params = params.set('planId', planId);

    return this.http.get<any[]>(`${this.baseUrl}/getPlanById`, {
        headers: headers,
        params: params
    });
  }
}
