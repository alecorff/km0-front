import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, LOCALE_ID, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { ActivityService } from 'src/app/services/activity.service';
import { GlobalService } from 'src/app/services/global.service';
import { TrainingPlanService } from 'src/app/services/training-plan.service';
import { TrainingPlanResumeComponent } from '../common/training-plan-resume/training-plan-resume.component';
import { Chart } from 'chart.js/auto';
import { FormsModule } from '@angular/forms';
import { MetricType, STATS_METRICS } from 'src/app/enum/enum';
import { MatIconModule } from '@angular/material/icon';
import { ActivityDialogComponent } from '../common/activity-dialog/activity-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    FormsModule,
    MatIconModule,
    TrainingPlanResumeComponent
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.css'
})
export class StatsComponent implements OnInit {

  currentPlan: any = null;

  activities: any[] = [];

  loading$ = new BehaviorSubject<boolean>(true);

  @ViewChild('sessionsChart') chartRef!: ElementRef<HTMLCanvasElement>;

  showScale: boolean = true;
  currentScale: string = 'week';
  currentMetric: string = 'sessions';
  isMetricPanelOpen = false;
  statCategories: string[] = [];
  statByCategory: Record<string, MetricType[]> = {};
  @ViewChild('chartMetricWrapper') chartMetricWrapper!: ElementRef;
  chartInstance!: Chart;

  constructor(
    private route: ActivatedRoute,
    private activityService: ActivityService,
    public globalService: GlobalService,
    private trainingPlanService: TrainingPlanService,
    private dialog: MatDialog,
    private translateService: TranslateService
  ) { }

  ngOnInit() {
    const planId = this.route.snapshot.paramMap.get('id');

    Promise.resolve().then(() => {
      this.globalService.startLoading();
    });

    if (!planId) {
      this.loadAllActivities();
    } else {
      this.trainingPlanService.getPlanById(planId).subscribe(plan => {
        this.currentPlan = plan;
        this.loadActivitiesForPlan();
      });
    }

    // Mise à jour du graphe en fonction des filtres
    this.globalService.filteredActivities$.subscribe(activities => {
      this.activities = activities;
      this.updateChart();
    });
  }

  loadActivitiesForPlan() {
    if (!this.currentPlan) {
      return;
    }

    this.activityService.getActivitiesForPlanPeriod(this.currentPlan.startDate, this.currentPlan.endDate).subscribe({
      next: (result) => {
        this.activities = result;
      },
      complete: () => {
        this.loading$.next(false);
        this.globalService.stopLoading();
        this.buildStatByCategory();

        setTimeout(() => {
          const data = this.buildPeriodData();
          this.createChart(data.labels, data.values, data.meta);
        });
      }
    });
  }

  loadAllActivities() {
    this.activityService.getAllActivities().subscribe({
      next: (result) => {
        this.activities = result;
      },
      complete: () => {
        this.loading$.next(false);
        this.globalService.stopLoading();
        this.buildStatByCategory();

        setTimeout(() => {
          const data = this.buildPeriodData();
          this.createChart(data.labels, data.values, data.meta);
        });
      }
    });
  }

  /**
   * Construction des données par jour en enlevant les jours sans activités
   */
  buildDailyData() {
    if (!this.activities.length) {
      return { labels: [], values: [], meta: [] };
    }

    const sorted = [...this.activities].sort(
      (a, b) => new Date(a.startDateLocal).getTime() - new Date(b.startDateLocal).getTime()
    );

    const map: { [key: string]: number } = {};

    sorted.forEach(activity => {
      const date = new Date(activity.startDateLocal);
      const key = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!map[key]) map[key] = 0;

      switch (this.currentMetric) {
        case 'sessions':
          map[key] += 1;
          break;
        case 'distance':
          map[key] += activity.distance || 0;
          break;
        case 'elevation':
          map[key] += activity.totalElevationGain || 0;
          break;
        case 'time':
          map[key] += (activity.movingTime || 0) / 3600;
          break;
      }
    });

    const keys = Object.keys(map).sort();

    return {
      labels: keys,
      values: keys.map(k => map[k]),
      meta: keys.map(k => ({
        date: new Date(k)
      }))
    };
  }


  /**
   * Construction activité par activité
   */
  buildActivitySeries() {
    if (!this.activities.length) {
      return { labels: [], values: [], meta: [] };
    }

    // tri par date (important pour une courbe propre)
    const sorted = [...this.activities].sort(
      (a, b) => new Date(a.startDateLocal).getTime() - new Date(b.startDateLocal).getTime()
    );

    const values: number[] = [];
    const meta: any[] = [];

    sorted.forEach(activity => {
      let value: number | null = null;

      switch (this.currentMetric) {
        case 'heartrate':
          value = activity.averageHeartrate;
          break;

        case 'cadence':
          value = activity.averageCadence;
          break;

        case 'pace':
          if (activity.distance && activity.movingTime) {
            value = activity.movingTime / activity.distance;
          }
          break;
      }

      if (value !== null && value !== undefined) {
        values.push(value);
        meta.push({
          activity,
          date: new Date(activity.startDateLocal)
        });
      }
    });

    return {
      labels: values.map((_, i) => i.toString()),
      values,
      meta
    };
  }

  /**
   * Construction des données en tenant compte de l'échelle
   */
  buildPeriodData() {
    const periods: { [key: string]: number } = {};
    if (!this.activities.length) {
      return { labels: [], values: [], meta: [] };
    }

    const startDate = this.currentPlan
    ? new Date(this.currentPlan.startDate)
    : new Date(Math.min(...this.activities.map(a => new Date(a.startDateLocal).getTime())));

    const today = new Date();

    let current = new Date(startDate);
    const currentKey = this.getPeriodKey(today);

    // Génération des périodes
    while (true) {
      const key = this.getPeriodKey(current);
      periods[key] = 0;

      if (key === currentKey) break;

      this.incrementDate(current);
    }

    // Remplissage
    this.activities.forEach(activity => {
      const date = new Date(activity.startDateLocal);
      const key = this.getPeriodKey(date);

      if (!(key in periods)) return;

      switch (this.currentMetric) {
        case 'sessions':
          periods[key] += 1;
          break;

        case 'distance':
          periods[key] += activity.distance || 0;
          break;

        case 'elevation':
          periods[key] += activity.totalElevationGain || 0;
          break;

        case 'time':
          periods[key] += (activity.movingTime || 0) / 3600;
          break;
      }
    });

    // Tri
    const sortedKeys = Object.keys(periods).sort((a, b) => this.sortPeriodKeys(a, b));

    return {
      labels: sortedKeys,
      values: sortedKeys.map(k => periods[k]),
      meta: sortedKeys.map(k => this.buildMetaFromKey(k))
    };
  }

  getPeriodKey(date: Date): string {
    switch (this.currentScale) {
      case 'day':
        return date.toISOString().split('T')[0];

      case 'week':
        return this.getYearWeek(date);

      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      case 'year':
        return `${date.getFullYear()}`;

      default:
        return '';
    }
  }

  incrementDate(date: Date) {
    switch (this.currentScale) {
      case 'day':
        date.setDate(date.getDate() + 1);
        break;

      case 'week':
        date.setDate(date.getDate() + 7);
        break;

      case 'month':
        date.setMonth(date.getMonth() + 1);
        break;

      case 'year':
        date.setFullYear(date.getFullYear() + 1);
        break;
    }
  }

  sortPeriodKeys(a: string, b: string): number {
    return new Date(a).getTime() - new Date(b).getTime();
  }

  buildMetaFromKey(key: string) {
    switch (this.currentScale) {
      case 'day': {
        const date = new Date(key);
        return { start: date, end: date };
      }

      case 'week': {
        const [year, week] = key.split('-W').map(Number);
        return this.getIsoWeekRange(year, week);
      }

      case 'month': {
        const [year, month] = key.split('-').map(Number);
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);
        return { start, end };
      }

      case 'year': {
        const year = Number(key);
        return {
          start: new Date(year, 0, 1),
          end: new Date(year, 11, 31)
        };
      }
    }
    return;
  }

  getIsoWeekRange(year: number, week: number) {
    const simple = new Date(Date.UTC(year, 0, 4));
    const dayOfWeek = simple.getUTCDay() || 7;
    const monday = new Date(simple);
    monday.setUTCDate(simple.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    return { start: monday, end: sunday };
  }

  getYearWeek(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);

    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    const year = d.getUTCFullYear();

    return `${year}-W${String(weekNo).padStart(2, '0')}`;
  }

  createChart(labels: string[], data: number[], meta: any[]) {
    const ctx = this.chartRef?.nativeElement.getContext('2d');
    if (!ctx) return;
    const height = this.chartRef.nativeElement.clientHeight;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
    gradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)');

    // Calcul dynamique du max
    const maxData = Math.max(...data);
    const suggestedMax = Math.ceil(maxData * 1.01);
    const mid = suggestedMax / 2;

    // Ligne verticale au hover
    const verticalLinePlugin = {
      id: 'verticalLine',
      afterDraw: (chart: any) => {
        if (chart.tooltip?._active?.length) {
          const ctx = chart.ctx;
          const activePoint = chart.tooltip._active[0];

          const x = activePoint.element.x;
          const topY = chart.scales.y.top;
          const bottomY = chart.scales.y.bottom;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x, topY);
          ctx.lineTo(x, bottomY);
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(226, 223, 237, 0.2)';
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.restore();
        }
      }
    };

    // Message si aucune donnée
    const emptyDataPlugin = {
      id: 'emptyData',
      afterDraw: (chart: any) => {
        const data = chart.data.datasets[0].data;

        // Vérifie si aucune donnée ou que des 0
        const isEmpty = !data.length || data.every((v: number) => v === 0);

        if (!isEmpty) return;

        const { ctx, chartArea } = chart;

        if (!chartArea) return;

        const { left, right, top, bottom } = chartArea;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#c4b5fd';

        ctx.fillText(
          this.translateService.instant('i18n.page.stats.no_data'),
          (left + right) / 2,
          (top + bottom) / 2
        );

        ctx.restore();
      }
    };

    // Permet de savoir si on est sur une activité ou sur une concaténation d'activité
    const getActivityFromElements = (elements: any[]) => {
      if (!elements.length) return null;

      const index = elements[0].index;
      return meta[index]?.activity || null;
    };

    this.chartInstance = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '',
          data,
          tension: 0.3,
          fill: true,
          backgroundColor: gradient,
          borderColor: '#8b5cf6',
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#8b5cf6',
          pointBorderWidth: 0,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest',
          intersect: true
        },
        hover: {
          mode: 'nearest',
          intersect: true
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            displayColors: false,
            backgroundColor: '#2e2a45',
            titleColor: '#ffffff',
            bodyColor: '#c4b5fd',
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              title: (context) => {
                const index = context[0].dataIndex;
                const m = meta[index];

                // ----- MÉTRIQUES PAR ACTIVITÉ -----
                if (['heartrate', 'cadence', 'pace'].includes(this.currentMetric)) {
                  return m.date.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });
                }

                // ----- ÉCHELLE JOUR -----
                if (this.currentScale === 'day') {
                  return m.date.toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  });
                }

                // ----- ÉCHELLE SEMAINE / MOIS / ANNÉE -----
                const startYear = m.start.getFullYear();
                const endYear = m.end.getFullYear();

                // ----- SEMAINE -----
                if (this.currentScale === 'week') {
                  const formatDate = (d: Date, withYear = false) =>
                  d.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: 'short',
                    ...(withYear ? { year: 'numeric' } : {})
                  });

                  if (startYear === endYear) {
                    return `${formatDate(m.start)} → ${formatDate(m.end)} ${startYear}`;
                  } else {
                    return `${formatDate(m.start, true)} → ${formatDate(m.end, true)}`;
                  }
                }
                // ----- MOIS -----
                if (this.currentScale === 'month') {
                  return m.start.toLocaleDateString('fr-FR', {
                    month: 'short',
                    year: 'numeric'
                  });
                }
                // ----- ANNÉE -----
                if (this.currentScale === 'year') {
                  return m.start.getFullYear().toString();
                }
              },
              label: (context) => {
                const value = context.raw as number;
                switch (this.currentMetric) {
                  case 'distance':
                    return `${value.toFixed(2)} km`;
                  case 'elevation':
                    return `${context.raw} m`;
                  case 'time':
                    return this.formatHours(value);
                  case 'heartrate':
                    return `${Math.round(value)} bpm`;
                  case 'cadence':
                    return `${Math.round(value)} ppm`;
                  case 'pace':
                    const min = Math.floor(value / 60);
                    const sec = Math.round(value % 60).toString().padStart(2, '0');
                    return `${min}'${sec}/km`;

                  default:
                    return `${context.raw} séance(s)`;
                }
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              display: false
            },
            grid: {
              display: false
            },
            border: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            suggestedMin: 0,
            suggestedMax: suggestedMax,
            ticks: {
              callback: (value) => {
                const v = value as number;

                // ----- MÉTRIQUES PAR ACTIVITÉ -----
                if (['heartrate', 'cadence', 'pace'].includes(this.currentMetric)) {
                  switch (this.currentMetric) {
                    case 'heartrate':
                      return `${Math.round(v)} bpm`;

                    case 'cadence':
                      return `${Math.round(v)} ppm`;

                    case 'pace':
                      const min = Math.floor(v / 60);
                      const sec = Math.round(v % 60).toString().padStart(2, '0');
                      return `${min}'${sec}/km`;
                  }
                }

                // ----- VOLUME -----
                if (v === 0 || v === mid || v === suggestedMax) {
                  switch (this.currentMetric) {
                    case 'distance':
                      return `${Math.round(v)} km`;

                    case 'elevation':
                      return `${v} m`;

                    case 'time':
                      return this.formatHours(v);

                    default:
                      return `${v}`;
                  }
                }
                return '';
              },
              stepSize: mid,
              color: '#c4b5fd'
            },
            grid: {
              color: 'rgba(255,255,255,0.05)'
            },
            border: {
              display: false
            }
          }
        },
        onHover: (event, elements) => {
          const canvas = event.native?.target as HTMLCanvasElement;

          if (canvas) {
            canvas.style.cursor = getActivityFromElements(elements) ? 'pointer' : 'default';
          }
        },
        onClick: (event, elements) => {
          const activity = getActivityFromElements(elements);
          if (!activity) return;

          this.openActivity(activity);
        }
      },
      plugins: [verticalLinePlugin, emptyDataPlugin]
    });
  }

  updateChart() {
    let data;

    if (['heartrate', 'cadence', 'pace'].includes(this.currentMetric)) {
      this.showScale = false;
      data = this.buildActivitySeries();
    } else if (this.currentScale === 'day') {
      this.showScale = true;
      data = this.buildDailyData();
    } else {
      this.showScale = true;
      data = this.buildPeriodData();
    }

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.createChart(data.labels, data.values, data.meta);
  }

  formatHours(value: number): string {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    const minutesStr = String(minutes).padStart(2, '0');

    if (hours > 0 && minutes > 0) {
      return `${hours} h ${minutesStr} min`;
    } else if (hours > 0) {
      return `${hours} h`;
    } else {
      return `${minutesStr} min`;
    }
  }

  /* -------------------- SELECT METRIC LOGIC -------------------- */
  buildStatByCategory(): void {
    const map: Record<string, MetricType[]> = {};

    for (const stat of STATS_METRICS) {
      if (!map[stat.category]) {
        map[stat.category] = [];
      }
      map[stat.category].push(stat);
    }

    this.statByCategory = map;
    this.statCategories = Object.keys(map);
  }

  get currentMetricLabel() {
    for (const cat of Object.values(this.statByCategory)) {
      const found = cat.find((m: any) => m.code === this.currentMetric);
      if (found) return found.code;
    }
    return '';
  }

  toggleMetricPanel() {
    this.isMetricPanelOpen = !this.isMetricPanelOpen;
  }

  selectMetric(code: string) {
    this.currentMetric = code;
    this.isMetricPanelOpen = false;

    this.updateChart();
  }

  /* -------------------- SELECT SCALE LOGIC -------------------- */
  setScale(scale: string) {
    this.currentScale = scale;

    this.updateChart();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isMetricPanelOpen) {
      return;
    }
    const clickedInside = this.chartMetricWrapper.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.isMetricPanelOpen = false;
    }
  }

  openActivity(activity: any) {
    this.dialog.open(ActivityDialogComponent, {
      data: {
        activity: activity
      },
      width: '100%',
      maxWidth: '600px',
      height: '600px'
    });
  }
}
