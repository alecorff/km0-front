import { AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';

@Component({
  selector: 'app-polyline-preview',
  standalone: true,
  imports: [],
  templateUrl: './polyline-preview.component.html',
  styleUrl: './polyline-preview.component.css'
})
export class PolylinePreviewComponent implements AfterViewInit, OnChanges {

  @Input() polyline!: string;

  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  ngAfterViewInit() {
    if (this.polyline) {
      this.drawPolyline(this.polyline);
    }
  }

  ngOnChanges() {
    if (this.canvasRef && this.polyline) {
      this.drawPolyline(this.polyline);
    }
  }

  drawPolyline(encoded: string) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    const scale = Math.min(
      width / (maxLng - minLng),
      height / (maxLat - minLat)
    ) * 0.9;

    const routeWidth = (maxLng - minLng) * scale;
    const routeHeight = (maxLat - minLat) * scale;

    const offsetX = (width - routeWidth) / 2;
    const offsetY = (height - routeHeight) / 2;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#7A6FF0';
    ctx.lineWidth = 1;
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
