import { CommonModule } from '@angular/common';
import { Component, LOCALE_ID, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { ActivityService } from 'src/app/services/activity.service';
import { GlobalService } from 'src/app/services/global.service';
import { TrainingPlanService } from 'src/app/services/training-plan.service';
import { PolylinePreviewComponent } from '../common/polyline-preview/polyline-preview.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TRAINING_SESSION_TYPES } from 'src/app/enum/enum';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    MatDividerModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSliderModule,
    MatDatepickerModule,
    PolylinePreviewComponent
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit {

  currentPlan: any = null;

  query = '';
  activeFilter: 'all' | 'distance' | 'elevation' | 'difficulty' = 'all';

  minDate!: Date;
  maxDate!: Date;
  minDuration: number = 60;
  maxDuration: number = 360;
  readonly MAX_DURATION = 600;

  showAllTags = false;
  selectedTags: string[] = [];
  allTags = TRAINING_SESSION_TYPES.map(t => t.code);

  activities: any[] = [];
  filteredActivities: any[] = [];

  loading$ = new BehaviorSubject<boolean>(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activityService: ActivityService,
    public globalService: GlobalService,
    private trainingPlanService: TrainingPlanService
  ) { }

  ngOnInit() {
    const planId = this.route.snapshot.paramMap.get('id');

    Promise.resolve().then(() => {
      this.globalService.startLoading();
    });

    if (!planId) {
      this.router.navigate(['/'], { queryParams: { code: 404 } });
      return;
    }

    this.trainingPlanService.getPlanById(planId).subscribe(plan => {
      this.currentPlan = plan;

      this.minDate = this.currentPlan.startDate;
      this.maxDate = this.currentPlan.endDate;

      this.loadActivitiesForPlan();
    });
  }

  loadActivitiesForPlan() {
    if (!this.currentPlan) {
      return;
    }

    this.activityService.getActivitiesForPlanPeriod(this.currentPlan.startDate).subscribe({
      next: (result) => {
        console.log(result)
        this.activities = result;
      },
      complete: () => {
        this.loading$.next(false);
        this.globalService.stopLoading();
      }
    });
  }

  onSearch() {
    const q = this.query.toLowerCase();

    this.filteredActivities = this.activities.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q)
    ).sort((a, b) => new Date(b.startDateLocal).getTime() - new Date(a.startDateLocal).getTime());
  }

  setFilter(filter: any) {
    this.activeFilter = filter;
    // logique de filtre à enrichir plus tard
  }

  goToTrainingPlan() {
    this.router.navigate([`/plan/${this.currentPlan.planId}`]);
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    let formatted = m === 0 ? `${h}h` : `${h}h${m}`;

    if (minutes === this.MAX_DURATION) {
      formatted += '+';
    }
    return formatted;
  }

  toggleTag(code: string): void {
    if (this.selectedTags.includes(code)) {
      this.selectedTags = this.selectedTags.filter(t => t !== code);
    } else {
      this.selectedTags = [...this.selectedTags, code];
    }
  }

  isTagSelected(code: string): boolean {
    return this.selectedTags.includes(code);
  }

}
