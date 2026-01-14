import { CommonModule } from '@angular/common';
import { Component, LOCALE_ID, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
import { Country, TRAINING_SESSION_TYPES } from 'src/app/enum/enum';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSelectModule } from '@angular/material/select';
import { ScrollingModule } from '@angular/cdk/scrolling';

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
    MatBadgeModule,
    MatSelectModule,
    ScrollingModule,
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

  activityTypes = [
    { label: 'run', value: 'Run', checked: false },
    { label: 'trail', value: 'TrailRun', checked: false }
  ];

  minDate!: Date;
  maxDate!: Date;
  
  readonly MAX_DISTANCE = 100;
  readonly DEFAULT_MIN_DISTANCE = 10;
  readonly DEFAULT_MAX_DISTANCE = 30;
  minDistance: number = this.DEFAULT_MIN_DISTANCE;
  maxDistance: number = this.DEFAULT_MAX_DISTANCE;

  readonly MAX_ELEVATION = 3000;
  readonly DEFAULT_MIN_ELEVATION = 100;
  readonly DEFAULT_MAX_ELEVATION = 500;
  minElevation: number = this.DEFAULT_MIN_ELEVATION;
  maxElevation: number = this.DEFAULT_MAX_ELEVATION;

  readonly MAX_DURATION = 600;
  readonly DEFAULT_MIN_DURATION = 60;
  readonly DEFAULT_MAX_DURATION = 360;
  minDuration: number = this.DEFAULT_MIN_DURATION;
  maxDuration: number = this.DEFAULT_MAX_DURATION;

  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;

  Country: any = Country;
  selectedCountries: string[] = [];
  selectedCities: string[] = [];
  allCountries: string[] = [];
  allCities: string[] = [];
  filteredCities: string[] = [];

  showAllTags = false;
  selectedTags: string[] = [];
  allTags = TRAINING_SESSION_TYPES.map(t => t.code);

  activities: any[] = [];
  filteredActivities: any[] = [];

  openedMobileFilter: 'activityType' | 'tags' | 'distance' | 'elevation' | 'duration' | 'date' | 'location' | null = null;

  loading$ = new BehaviorSubject<boolean>(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private activityService: ActivityService,
    public globalService: GlobalService,
    private trainingPlanService: TrainingPlanService,
    private translateService: TranslateService
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
        this.extractLocationsFromActivities();
      },
      complete: () => {
        this.loading$.next(false);
        this.globalService.stopLoading();
      }
    });
  }

  private extractLocationsFromActivities() {
    const countries = new Set<string>();
    const cities = new Set<string>();

    this.activities.forEach(activity => {
      if (activity.country) {
        countries.add(activity.country);
      }
      if (activity.city) {
        cities.add(activity.city);
      }
    });

    this.allCountries = Array.from(countries).sort();
    this.allCities = Array.from(cities).sort();
    this.filteredCities = [...this.allCities];
  }

  onSearch() {
    this.applyFilters();
  }

  goToTrainingPlan() {
    this.router.navigate([`/plan/${this.currentPlan.planId}`]);
  }

  toggleTag(code: string): void {
    if (this.selectedTags.includes(code)) {
      this.selectedTags = this.selectedTags.filter(t => t !== code);
    } else {
      this.selectedTags = [...this.selectedTags, code];
    }

    this.applyFilters();
  }

  isTagSelected(code: string): boolean {
    return this.selectedTags.includes(code);
  }


  /* -------------------- FORMAT SLIDER VALUES -------------------- */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const h = Math.floor(minutes / 60);
    const m = (minutes % 60).toString().padStart(2, '0');

    let formatted = m === '00' ? `${h}h` : `${h}h${m}`;

    if (minutes === this.MAX_DURATION) {
      formatted += '+';
    }
    return formatted;
  }

  formatElevation(meters: number): string {
    let formatted = `${meters}m`;
    if (meters === this.MAX_ELEVATION) {
      formatted += '+';
    }
    return formatted;
  }

  formatDistance(km: number): string {
    let formatted = `${km}km`;
    if (km === this.MAX_DISTANCE) {
      formatted += '+';
    }
    return formatted;
  }

  /* -------------------- FILTERS LOGIC -------------------- */
  onDateRangeChange(): void {
    if (this.selectedStartDate && this.selectedEndDate) {
      this.applyFilters();
    }
  }

  applyFilters(): void {
    let result = [...this.activities];

    // Filtre par recherche texte
    if (this.query) {
      const q = this.query.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q)
      );
    }

    // Filtre par type d'activité
    const selectedTypes = this.activityTypes
      .filter(t => t.checked)
      .map(t => t.value);

    if (selectedTypes.length > 0) {
      result = result.filter(a =>
        selectedTypes.includes(a.sportType)
      );
    }

    // Filtre par tag
    if (this.selectedTags.length > 0) {
      result = result.filter(a =>
        a.sessionType && this.selectedTags.includes(a.sessionType)
      );
    }

    // Filtre par distance
    if (this.isDistanceFilterActive) {
      result = result.filter(a => {
        if (this.maxDistance === this.MAX_DISTANCE) {
          // Cas "100km et +"
          return a.distance >= this.minDistance;
        }
        return (
          a.distance >= this.minDistance &&
          a.distance <= this.maxDistance
        );
      });
    }

    // Filtre par dénivelé
    if (this.isElevationFilterActive) {
      result = result.filter(a => {
        if (this.maxElevation === this.MAX_ELEVATION) {
          // Cas "3000m et +"
          return a.totalElevationGain >= this.minElevation;
        }
        return (
          a.totalElevationGain >= this.minElevation &&
          a.totalElevationGain <= this.maxElevation
        );
      });
    }

    // Filtre par temps d'activité
    if (this.isDurationFilterActive) {
      result = result.filter(a => {
        if (this.maxDuration === this.MAX_ELEVATION) {
          // Cas "10h et +"
          return a.movingTime >= this.minDuration*60;
        }
        return (
          a.movingTime >= this.minDuration*60 &&
          a.movingTime <= this.maxDuration*60
        );
      });
    }

    // Filtre par date
    if (this.isDateFilterActive) {
      const start = this.startOfDay(this.selectedStartDate!);
      const end = this.endOfDay(this.selectedEndDate!);

      result = result.filter(a => {
        const activityDate = new Date(a.startDateLocal);
        return activityDate >= start && activityDate <= end;
      });
    }

    // Filtre par lieu (pays / ville)
    if (this.isLocationFilterActive) {
      result = result.filter(a => {
        if (this.selectedCountries.length > 0 && !this.selectedCountries.includes(a.country)) {
          return false;
        }

        if (this.selectedCities.length > 0 && !this.selectedCities.includes(a.city)) {
          return false;
        }

        return true;
      });
    }

    // Tri
    this.filteredActivities = result.sort(
      (a, b) =>
        new Date(b.startDateLocal).getTime() -
        new Date(a.startDateLocal).getTime()
    );
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private endOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  get selectedActivityTypesCount(): number {
    return this.activityTypes.filter(t => t.checked).length;
  }

  get typeFilterBadge(): string {
    return this.activityTypes.filter(type => type.checked).map(type => type.label).join(', ');
  }

  get selectedTagsCount(): number {
    return this.selectedTags.length;
  }

  get tagsFilterBadge(): string {
    const count = this.selectedTags.length;
    const displayedTags = count > 3 ? this.selectedTags.slice(0, 3) : this.selectedTags;
    const translatedTags = displayedTags.map(
      tag => this.translateService.instant(`i18n.session_type.label.${tag}`)
    );

    const suffix = count > 3 ? ', ...' : '';

    return `${count} · ${translatedTags.join(', ')}${suffix}`;
  }

  get isDistanceFilterActive(): boolean {
    return (
      this.minDistance !== this.DEFAULT_MIN_DISTANCE || this.maxDistance !== this.DEFAULT_MAX_DISTANCE
    );
  }

  get distanceFilterBadge(): string {
    return `${this.formatDistance(this.minDistance)} - ${this.formatDistance(this.maxDistance)}`;
  }

  get isElevationFilterActive(): boolean {
    return (
      this.minElevation !== this.DEFAULT_MIN_ELEVATION || this.maxElevation !== this.DEFAULT_MAX_ELEVATION
    );
  }

  get elevationFilterBadge(): string {
    return `${this.formatElevation(this.minElevation)} - ${this.formatElevation(this.maxElevation)}`;
  }

  get isDurationFilterActive(): boolean {
    return (
      this.minDuration !== this.DEFAULT_MIN_DURATION || this.maxDuration !== this.DEFAULT_MAX_DURATION
    );
  }

  get durationFilterBadge(): string {
    return `${this.formatDuration(this.minDuration)} - ${this.formatDuration(this.maxDuration)}`;
  }

  get isDateFilterActive(): boolean {
    return !!this.selectedStartDate && !!this.selectedEndDate;
  }

  get dateFilterBadge(): string {
    const start = this.selectedStartDate?.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'});
    const end = this.selectedEndDate?.toLocaleDateString('fr-FR', {day: '2-digit', month: '2-digit', year: 'numeric'});
    return `${start} - ${end}`;
  }

  get isLocationFilterActive(): boolean {
    return this.selectedCountries.length > 0 || this.selectedCities.length > 0;
  }

  get selectedLocationCount(): number {
    return this.selectedCountries.length + this.selectedCities.length;
  }

  get countryFilterBadge(): string {
    const count = this.selectedCountries.length;
    const displayedCountries = count > 3 ? this.selectedCountries.slice(0, 3) : this.selectedCountries;
    
    const translatedCountries = displayedCountries.map(
      country => Country[country as keyof typeof Country] ?? country
    );
    
    const suffix = count > 3 ? ', ...' : '';
    return `${count} · ${translatedCountries.join(', ')}${suffix}`;
  }

  get cityFilterBadge(): string {
    const count = this.selectedCities.length;
    const displayedCities = count > 3 ? this.selectedCities.slice(0, 3) : this.selectedCities;   
    const suffix = count > 3 ? ', ...' : '';
    return `${count} · ${displayedCities.join(', ')}${suffix}`;
  }

  resetFilters() {
    // Filtre par recherche texte
    this.query = '';

    // Filtre par type d'activité
    this.activityTypes.forEach(activity => {
      activity.checked = false;
    });

    // Filtre par tag
    this.selectedTags = [];

    // Filtre par distance
    this.minDistance = this.DEFAULT_MIN_DISTANCE; 
    this.maxDistance = this.DEFAULT_MAX_DISTANCE;

    // Filtre par dénivelé
    this.minElevation = this.DEFAULT_MIN_ELEVATION; 
    this.maxElevation = this.DEFAULT_MAX_ELEVATION;

    // Filtre par temps d'activité
    this.minDuration = this.DEFAULT_MIN_DURATION; 
    this.maxDuration = this.DEFAULT_MAX_DURATION;

    // Filtre par date
    this.selectedStartDate = null;
    this.selectedEndDate = null;

    // Filtre par lieu (pays / ville)
    this.selectedCountries = [];
    this.selectedCities = [];

    this.applyFilters();
  }

  resetFilterActivityType() {
    this.activityTypes.forEach(activity => {
      activity.checked = false;
    });
    this.applyFilters();
  }

  resetFilterTags() {
    this.selectedTags = [];
    this.applyFilters();
  }

  resetFilterDistance() {
    this.minDistance = this.DEFAULT_MIN_DISTANCE; 
    this.maxDistance = this.DEFAULT_MAX_DISTANCE;
    this.applyFilters();
  }

  resetFilterElevation() {
    this.minElevation = this.DEFAULT_MIN_ELEVATION; 
    this.maxElevation = this.DEFAULT_MAX_ELEVATION;
    this.applyFilters();
  }

  resetFilterDuration() {
    this.minDuration = this.DEFAULT_MIN_DURATION; 
    this.maxDuration = this.DEFAULT_MAX_DURATION;
    this.applyFilters();
  }

  resetFilterDate() {
    this.selectedStartDate = null;
    this.selectedEndDate = null;
    this.applyFilters();
  }

  resetFilterCountry() {
    this.selectedCountries = [];
    this.applyFilters();
  }

  resetFilterCity() {
    this.selectedCities = [];
    this.applyFilters();
  }

  openMobileFilter(type: typeof this.openedMobileFilter): void {
    this.openedMobileFilter =
      this.openedMobileFilter === type ? null : type;
  }

  closeMobileFilter(): void {
    this.openedMobileFilter = null;
  }

  hasAnyFilterActive(): boolean {
    return (
      this.selectedActivityTypesCount > 0 ||
      this.selectedTagsCount > 0 ||
      this.isDistanceFilterActive ||
      this.isElevationFilterActive ||
      this.isDurationFilterActive ||
      this.isDateFilterActive ||
      this.isLocationFilterActive
    );
  }


  openStrava(activityId: any) {
    window.open(`https://www.strava.com/activities/${activityId}`, '_blank');
  }

}
