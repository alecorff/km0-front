import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, Inject, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GlobalService } from 'src/app/services/global.service';
import { PlannedActivityService } from 'src/app/services/planned-activity.service';
import { LinkActivityDialogComponent } from '../../training-plan/link-activity-dialog/link-activity-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TRAINING_SESSION_TYPES, TrainingSessionType } from 'src/app/enum/enum';
import { MatMenuModule } from '@angular/material/menu';
import { ActivityService } from 'src/app/services/activity.service';

@Component({
  selector: 'app-activity-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatMenuModule
  ],
  templateUrl: './activity-dialog.component.html',
  styleUrl: './activity-dialog.component.css'
})
export class ActivityDialogComponent implements AfterViewInit {

  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  activities: any[] = [];
  currentIndex = 0;
  currentActivity!: any;

  city: string = '';
  country: string = '';

  plannedActivitiesAroundDate: any[] = [];

  sessionTypeCategories: string[] = [];
  sessionTypesByCategory: Record<string, TrainingSessionType[]> = {};
  isEditingSessionType = false;
  @ViewChild('sessionTagWrapper') sessionTagWrapper!: ElementRef;

  isLoading: boolean = false;

  constructor(
    public globalService: GlobalService,
    private plannedActivityService: PlannedActivityService,
    private activityService: ActivityService,
    private translateService: TranslateService,
    public dialogRef: MatDialogRef<ActivityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.activities = Array.isArray(data.activity) ? data.activity : [data.activity];

    this.activities.sort(
      (a, b) =>
        new Date(a.startDateLocal).getTime() -
        new Date(b.startDateLocal).getTime()
    );

    this.currentIndex = 0;
    this.currentActivity = this.activities[this.currentIndex];

    if (this.data.plannedActivities && !this.currentActivity.sessionType) {
      this.getPlannedActivitiesAroundDate();
    }
  }

  ngAfterViewInit() {
    this.loadActivity();
    this.buildSessionTypesByCategory();
  }

  next() {
    if (this.currentIndex < this.activities.length - 1) {
      this.currentIndex++;
      this.currentActivity = this.activities[this.currentIndex];
      this.loadActivity();
    }
  }

  previous() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.currentActivity = this.activities[this.currentIndex];
      this.loadActivity();
    }
  }

  private loadActivity() {
    if (this.currentActivity.polyline) {
      this.drawPolyline(this.currentActivity.polyline);
    }

    this.globalService.getCity(this.currentActivity.startLatitude, this.currentActivity.startLongitude).subscribe(res => {
      this.city = res.address.city || res.address.town || res.address.village || res.address.hamlet;
      this.country = res.address.country_code.toUpperCase();
    });
  }

  getPlannedActivitiesAroundDate() {
    const ref = new Date(this.currentActivity.startDateLocal);
    const rangeDays = 1;

    const toDayNumber = (d: Date) =>
      d.getFullYear() * 10000 +
      (d.getMonth() + 1) * 100 +
      d.getDate();

    const addDays = (d: Date, days: number) => {
      const copy = new Date(d);
      copy.setDate(copy.getDate() + days);
      return copy;
    };

    const startDay = toDayNumber(addDays(ref, -rangeDays));
    const endDay = toDayNumber(addDays(ref, rangeDays));

    this.plannedActivitiesAroundDate = this.data.plannedActivities.filter((p: any) => {
      const day = toDayNumber(new Date(p.scheduledDate));
      return (day >= startDay && day <= endDay && p.status === 'PLANNED' && !p.activityId);
    })
  }

  openStrava() {
    window.open(`https://www.strava.com/activities/${this.currentActivity.activityId}`, '_blank');
  }

  drawPolyline(encoded: string) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas (retina safe)
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const points = this.decodePolyline(encoded);

    const lats = points.map(p => p[0]);
    const lngs = points.map(p => p[1]);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const width = rect.width;
    const height = rect.height;

    const scaleX = width / (maxLng - minLng);
    const scaleY = height / (maxLat - minLat);
    const scale = Math.min(scaleX, scaleY) * 0.9;

    const routeWidth = (maxLng - minLng) * scale;
    const routeHeight = (maxLat - minLat) * scale;

    const offsetX = (width - routeWidth) / 2;
    const offsetY = (height - routeHeight) / 2;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#7A6FF0';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    points.forEach(([lat, lng], i) => {
      const x = offsetX + (lng - minLng) * scale;
      const y = offsetY + (maxLat - lat) * scale;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }


  decodePolyline(encoded: string): [number, number][] {
    let index = 0;
    let lat = 0;
    let lng = 0;
    const coordinates: [number, number][] = [];

    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      coordinates.push([lat / 1e5, lng / 1e5]);
    }

    return coordinates;
  }

  linkActivity() {
    const dialogRef = this.dialog.open(LinkActivityDialogComponent, {
      data: {
        plannedActivitiesAroundDate: this.plannedActivitiesAroundDate
      },
      disableClose: false,
      width: '100%',
      maxWidth: '400px',
      height: '400px',
      panelClass: 'primary-dialog'
    });

    dialogRef.afterClosed().subscribe((plannedActivity) => {
      if (plannedActivity) {
        this.globalService.startLoading();
        // enregistrement
        this.plannedActivityService.linkPlannedActivity(this.currentActivity.activityId, plannedActivity).subscribe(() => {
          this.currentActivity.sessionType = plannedActivity.sessionType;
        })

        // success message
        this.snackBar.open(
          this.translateService.instant('i18n.page.link_activity_dialog.message.success'),
          this.translateService.instant('i18n.page.link_activity_dialog.message.action'),
          {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['app-snackbar-info']
          }
        );

        this.globalService.stopLoading();
      }
    });
  }

  buildSessionTypesByCategory(): void {
    const map: Record<string, TrainingSessionType[]> = {};

    for (const type of TRAINING_SESSION_TYPES) {
      if (!map[type.category]) {
        map[type.category] = [];
      }
      map[type.category].push(type);
    }

    this.sessionTypesByCategory = map;
    this.sessionTypeCategories = Object.keys(map);
  }

  toggleSessionTypeEdit(): void {
    this.isEditingSessionType = !this.isEditingSessionType;
  }

  onSessionTypeSelect(code: string): void {
    if (code === this.currentActivity.sessionType) {
      this.isEditingSessionType = false;
      return;
    }

    const previousType = this.currentActivity.sessionType;
    this.currentActivity.sessionType = code;
    this.isEditingSessionType = false;

    this.activityService.updateSessionType(this.currentActivity.activityId, code).subscribe({
      next: () => {
        // success message
        this.snackBar.open(
          this.translateService.instant('i18n.page.activity_dialog.tag.message.success'),
          this.translateService.instant('i18n.page.activity_dialog.tag.message.action'),
          {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['app-snackbar-info']
          }
        );
      },
      error: () => {
        // Revenir en arrière si erreur
        this.currentActivity.sessionType = previousType;
      }
    });;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.isEditingSessionType) {
      return;
    }
    const clickedInside = this.sessionTagWrapper.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.isEditingSessionType = false;
    }
  }
}