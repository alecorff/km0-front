import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { GlobalService } from 'src/app/services/global.service';

@Component({
  selector: 'app-activity-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule, 
    MatDialogModule, 
    MatButtonModule, 
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './activity-dialog.component.html',
  styleUrl: './activity-dialog.component.css'
})
export class ActivityDialogComponent implements AfterViewInit {

  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  city: string = '';
  country: string = '';

  constructor(
    private globalService: GlobalService,
    public dialogRef: MatDialogRef<ActivityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngAfterViewInit() {
    if (this.data.polyline) {
      this.drawPolyline(this.data.polyline);
    }

    this.globalService.getCity(this.data.startLatitude, this.data.startLongitude).subscribe(res => {
      this.city = res.address.city || res.address.town || res.address.village || res.address.hamlet;
      this.country = res.address.country_code.toUpperCase();
    });
  }

  formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
  }

  openStrava() {
    window.open(`https://www.strava.com/activities/${this.data.activityId}`, '_blank');
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


}
