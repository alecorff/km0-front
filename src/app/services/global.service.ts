import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GlobalService {
  public loading$ = new BehaviorSubject<boolean>(false);

  startLoading() { this.loading$.next(true); }
  stopLoading() { this.loading$.next(false); }
}
