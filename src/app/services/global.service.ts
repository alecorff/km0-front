import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class GlobalService {

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  readonly apiUrl = environment.apiUrl;

  constructor() {}

  startLoading() {
    this.loadingSubject.next(true);
  }

  stopLoading() {
    this.loadingSubject.next(false);
  } 

  formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
  }

}
