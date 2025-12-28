import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pace',
  standalone: true
})
export class PacePipe implements PipeTransform {

  transform(secondsPerKm: number | null | undefined): string {
    if (secondsPerKm == null || secondsPerKm <= 0) {
      return '—';
    }

    const minutes = Math.floor(secondsPerKm / 60);
    const seconds = Math.round(secondsPerKm % 60);

    const pad = (value: number) => value.toString().padStart(2, '0');

    return `${minutes}'${pad(seconds)}''`;
  }
}
