import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
  standalone: true
})
export class DurationPipe implements PipeTransform {

  transform(seconds: number | null | undefined): string {
    if (seconds == null || seconds < 0) {
      return '—';
    }

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const pad = (value: number) => value.toString().padStart(2, '0');

    return h > 0
      ? `${pad(h)}h${pad(m)}m${pad(s)}s`
      : `${pad(m)}m${pad(s)}s`;
  }
}
