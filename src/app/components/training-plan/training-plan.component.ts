import { CommonModule } from '@angular/common';
import { Component, LOCALE_ID, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { ActivatedRoute } from '@angular/router';
import { TrainingPlanService } from 'src/app/services/training-plan.service';
import { ActivityService } from 'src/app/services/activity.service';
import { GlobalService } from 'src/app/services/global.service';
import { BehaviorSubject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ActivityDialogComponent } from './activity-dialog/activity-dialog.component';
import { MatBadgeModule } from '@angular/material/badge';
import { CreationPlannedActivityDialogComponent } from './creation-planned-activity-dialog/creation-planned-activity-dialog.component';

registerLocaleData(localeFr);

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  activity?: any;
  icon?: any;
  multi?: any;
}

@Component({
  selector: 'app-training-plan',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
  templateUrl: './training-plan.component.html',
  styleUrl: './training-plan.component.css'
})
export class TrainingPlanComponent implements OnInit {

  currentPlan: any = null;

  activities: any[] = [];
  plannedActivities: any[] = [];

  totalDistance: any;
  totalElevation: any;
  totalTime: any;

  selectedMonth = new Date();
  selectedDate: Date | null = null;

  weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  monthDays: CalendarDay[] = [];
  selectedWeek: CalendarDay[] = [];

  loading$ = new BehaviorSubject<boolean>(true);

  constructor(
    private route: ActivatedRoute,
    private trainingPlanService: TrainingPlanService,
    private activityService: ActivityService,
    private globalService: GlobalService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    const planId = this.route.snapshot.paramMap.get('id');

    Promise.resolve().then(() => {
      this.globalService.startLoading();
    });

    if (planId) {
      this.trainingPlanService.getPlanById(planId).subscribe(plan => {
        this.currentPlan = plan;

        this.loadActivitiesForPlan();
      });
    }
  }

  /**
   * Permet de récupérer les activités Strava liées à ce plan d'entrainement
   */
  loadActivitiesForPlan() {
    if (!this.currentPlan) {
      return;
    }

    this.activityService.getActivitiesForPlanPeriod(this.currentPlan.startDate).subscribe({
      next: (activities) => {
        this.activities = activities;

        this.totalDistance = activities.reduce((sum, a) => sum + (a.distance ?? 0), 0).toFixed(2);

        if (this.currentPlan.type === 'TRAIL') {
          this.totalElevation = activities.reduce((sum, a) => sum + (a.totalElevationGain ?? 0), 0);
        }

        const totalTimeSeconds = activities.reduce((sum, a) => sum + (a.movingTime ?? 0), 0);
        this.totalTime = this.formatSeconds(totalTimeSeconds);

        this.attachActivitiesToWeek();

        // On génère le mois courant
        this.generateMonth();
        this.selectedDate = new Date();
        this.extractWeek(this.selectedDate);
      },
      complete: () => {
        this.loading$.next(false);
        this.globalService.stopLoading();
      }
    });
  }

  /**
   * Permet de convertir le temps total d'activité en secondes en HH:mm:ss
   */
  private formatSeconds(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:` +
      `${minutes.toString().padStart(2, '0')}:` +
      `${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Ajouter les activités réelles à la semaine en cours
   */
  private attachActivitiesToWeek() {
    if (!this.activities?.length) {
      return;
    }

    this.selectedWeek.forEach(day => {
      const activitiesForDay = this.activities.filter(a => {
        const activityDate = new Date(a.startDateLocal);
        return activityDate.toDateString() === day.date.toDateString();
      });

      if (activitiesForDay.length === 1) {
        day.activity = activitiesForDay[0];
      } else if (activitiesForDay.length > 1) {
        day.activity = activitiesForDay;
      } else {
        day.activity = null;
      }
    });
  }

  /* ===== GÉNÉRATION DU MOIS ===== */
  generateMonth() {
    this.monthDays = [];

    const year = this.selectedMonth.getFullYear();
    const month = this.selectedMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));

    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      this.monthDays.push({
        date: d,
        inMonth: d.getMonth() === month,
        isToday: this.isToday(d),
        icon: this.getDayIcon(d),
        multi: this.isMultipleActivities(d)
      });
    }
  }

  /** Retourne la semaine (lundi → dimanche) associée à une date */
  getWeek(date: Date): Date[] {
    const week: Date[] = [];
    const selected = new Date(date);

    const day = selected.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;

    const monday = new Date(selected);
    monday.setDate(selected.getDate() + mondayOffset);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d);
    }
    return week;
  }

  /* ===== SÉLECTION DE DATE ===== */
  selectDate(d: Date) {
    if (this.isOutsidePlan(d)) {
      return;
    }

    this.selectedDate = new Date(d);
    this.extractWeek(d);
  }

  isSelectedDate(d: Date) {
    return this.selectedDate &&
      d.toDateString() === this.selectedDate.toDateString();
  }

  /* ===== EXTRAIRE LA SEMAINE ===== */
  extractWeek(date: Date) {
    const selected = new Date(date);
    const monday = new Date(selected);
    monday.setDate(selected.getDate() - ((selected.getDay() + 6) % 7));

    this.selectedWeek = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      this.selectedWeek.push({
        date: d,
        inMonth: true,
        isToday: this.isToday(d)
      });
    }
    this.attachActivitiesToWeek();
  }

  /* ===== NAVIGATION MOIS ===== */
  nextMonth() {
    this.selectedMonth = new Date(
      this.selectedMonth.getFullYear(),
      this.selectedMonth.getMonth() + 1,
      1
    );
    this.generateMonth();
  }

  canGoToNextMonth(): boolean {
    if (!this.currentPlan.startDate) {
      return true;
    }

    // Mois courant + 1
    const nextMonth = new Date(
      this.selectedMonth.getFullYear(),
      this.selectedMonth.getMonth() + 1,
      1
    );

    // Début du mois du plan
    const end = new Date(this.currentPlan.endDate);
    const endMonth = new Date(
      end.getFullYear(),
      end.getMonth(),
      1
    );

    return nextMonth <= endMonth;
  }

  previousMonth() {
    this.selectedMonth = new Date(
      this.selectedMonth.getFullYear(),
      this.selectedMonth.getMonth() - 1,
      1
    );
    this.generateMonth();
  }

  canGoToPreviousMonth(): boolean {
    if (!this.currentPlan.startDate) {
      return true;
    }

    // Mois courant - 1
    const prevMonth = new Date(
      this.selectedMonth.getFullYear(),
      this.selectedMonth.getMonth() - 1,
      1
    );

    // Début du mois du plan
    const start = new Date(this.currentPlan.startDate);
    const startMonth = new Date(
      start.getFullYear(),
      start.getMonth(),
      1
    );

    return prevMonth >= startMonth;
  }

  isToday(date: Date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  isOutsidePlan(date: Date): boolean {
    if (!this.currentPlan) {
      return false;
    }

    const d = new Date(date);
    const start = new Date(this.currentPlan.startDate);
    const end = new Date(this.currentPlan.endDate);

    if (d.getFullYear() < start.getFullYear() ||
      (d.getFullYear() === start.getFullYear() && d.getMonth() < start.getMonth()) ||
      (d.getFullYear() === start.getFullYear() && d.getMonth() === start.getMonth() && d.getDate() < start.getDate())
    ) {
      return true;
    }

    if (d.getFullYear() > end.getFullYear() ||
      (d.getFullYear() === end.getFullYear() && d.getMonth() > end.getMonth()) ||
      (d.getFullYear() === end.getFullYear() && d.getMonth() === end.getMonth() && d.getDate() > end.getDate())
    ) {
      return true;
    }

    return false;
  }

  /* ===== OUVRIR UN JOUR (affichage séance future / passée) ===== */
  openDay(day: CalendarDay) {
    console.log("Jour cliqué :", day);

    if (day.activity) {
      // ouvrir dialog avec l'activité
      this.dialog.open(ActivityDialogComponent, {
        data: day.activity,
        width: '100%',
        maxWidth: '600px',
        height: '600px'
      });
    } else if (day.date >= new Date()) {
      // futur → planification
      //this.planActivity(day.date);
    }
  }

  /**
   * Méthode pour savoir si le jour courant est spécial
   */
  getDayIcon(date: Date): string {
    // Séance réelle
    const activities = this.getActivitiesForDate(date);
    if (activities.length > 0) {
      const firstActivity = activities[0];
      return firstActivity.sportType === 'TrailRun' ? 'TRAIL' : 'RUN';
    }

    // Séance planifiée
    if (this.hasPlannedSession(date)) {
      return 'PLANNED';
    }

    // Jour de course
    if (this.isRaceDay(date)) {
      return 'RACE';
    }

    // Jour de départ
    if (this.isStartDay(date)) {
      return 'START';
    }

    return 'NONE';
  }

  isStartDay(date: Date): boolean {
    if (!this.currentPlan?.startDate) return false;
    return date.toDateString() === new Date(this.currentPlan.startDate).toDateString();
  }

  isRaceDay(date: Date): boolean {
    if (!this.currentPlan?.endDate) return false;
    return date.toDateString() === new Date(this.currentPlan.endDate).toDateString();
  }


  getActivitiesForDate(date: Date) {
    return this.activities.filter(a =>
      new Date(a.startDateLocal).toDateString() === date.toDateString()
    );
  }


  hasPlannedSession(date: Date): boolean {
    // return this.plannedSessions.some(p =>
    //   new Date(p.date).toDateString() === date.toDateString()
    // );
    return false
  }

  isMultipleActivities(d: Date): any {
    const activitiesForDay = this.activities.filter(a => {
      const activityDate = new Date(a.startDateLocal);
      return activityDate.toDateString() === d.toDateString();
    });

    return activitiesForDay.length > 1 ? activitiesForDay.length : null;
  }

  planSession() {
    const dialogRef = this.dialog.open(CreationPlannedActivityDialogComponent, {
      data: this.currentPlan,
      disableClose: false,
      width: '100%',
      maxWidth: '600px',
      height: '600px',
      panelClass: 'primary-dialog'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.globalService.startLoading();
        // eregistrement de la séance planifiée

        // success message

        this.globalService.stopLoading();
      }
    });
  }

}
