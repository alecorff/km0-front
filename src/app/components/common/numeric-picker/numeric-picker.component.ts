import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, Output, QueryList, ViewChildren } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface PickerColumn {
  value: keyof NumericPickerComponent;
  label: string;
  step: number;
  max?: number;
  separator?: string;
}

@Component({
  selector: 'app-numeric-picker',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ],
  templateUrl: './numeric-picker.component.html',
  styleUrls: ['./numeric-picker.component.css']
})
export class NumericPickerComponent implements AfterViewInit {

  type: string;

  km = 0;
  meters = 0;
  hour = 0;
  min = 0;
  sec = 0;
  minPace = 0;
  secPace = 0;

  distance!: number;
  time!: number;
  pace!: number;

  columns: PickerColumn[] = [];

  isMobile = window.matchMedia('(max-width: 768px)').matches;

  @ViewChildren('scrollPicker') scrollPickers!: QueryList<ElementRef<HTMLElement>>;

  constructor(
    private dialogRef: MatDialogRef<NumericPickerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private translateService: TranslateService
  ) {
    
    this.type = data.type;

    // Initialisation selon la valeur existante
    if (data.value != null) {
      if (this.type === 'distance') {
        this.km = Math.floor(data.value);
        this.meters = Math.round((data.value - this.km) * 100);
      } else if (this.type === 'time') {
        this.hour = Math.floor(data.value / 3600);
        this.min = Math.floor((data.value % 3600) / 60);
        this.sec = data.value % 60;
      } else if (this.type === 'pace') {
        this.minPace = Math.floor(data.value / 60);
        this.secPace = data.value % 60;
      }
      this.emitValue();
    }

    this.columns = this.buildColumns();
  }

  ngAfterViewInit() {
    if (this.isMobile) {
      setTimeout(() => this.syncScrollPositions());
    }
  }

  // ------------------------
  // Configuration des colonnes
  // ------------------------
  buildColumns(): PickerColumn[] {
    switch (this.type) {
      case 'distance': return [
        { value: 'km', label: this.translateService.instant('i18n.page.numeric_picker.metrics.kilometers'), step: 1, separator: ',' },
        { value: 'meters', label: this.translateService.instant('i18n.page.numeric_picker.metrics.meters'), step: 5, max: 99 }
      ];
      case 'time': return [
        { value: 'hour', label: this.translateService.instant('i18n.page.numeric_picker.metrics.hour'), step: 1, separator: ':' },
        { value: 'min', label: this.translateService.instant('i18n.page.numeric_picker.metrics.min'), step: 1, max: 59, separator: ':' },
        { value: 'sec', label: this.translateService.instant('i18n.page.numeric_picker.metrics.sec'), step: 1, max: 59 }
      ];
      case 'pace': return [
        { value: 'minPace', label: this.translateService.instant('i18n.page.numeric_picker.metrics.min'), step: 1, max: 59, separator: ':' },
        { value: 'secPace', label: this.translateService.instant('i18n.page.numeric_picker.metrics.sec'), step: 1, max: 59 }
      ];
      default: return [];
    }
  }

  getValue(prop: keyof NumericPickerComponent): number {
    return (this as any)[prop] ?? 0;
  }

  // ------------------------
  // Mise à jour des valeurs
  // ------------------------
  updateValue(prop: keyof NumericPickerComponent, delta: number) {
    const maxValue = this.columns.find(c => c.value === prop)?.max ?? Infinity;
    const newValue = Math.min(Math.max(0, (this[prop] as number) + delta), maxValue);
    (this as any)[prop] = newValue;
    this.emitValue();
  }

  private emitValue() {
    if (this.type === 'distance') {
      this.distance = this.km + this.meters / 100;
    } else if (this.type === 'time') {
      this.time = this.hour * 3600 + this.min * 60 + this.sec;
    } else if (this.type === 'pace') {
      this.pace = this.minPace * 60 + this.secPace;
    }
  }

  // --------------------------
  // Gestion de la saisie input
  // --------------------------
  onInputChange(prop: keyof NumericPickerComponent, event: Event) {
    const input = event.target as HTMLInputElement;
    let value = Number(input.value);

    if (isNaN(value)) {
      value = 0;
    }

    const maxValue = this.columns.find(c => c.value === prop)?.max ?? Infinity;

    value = Math.min(Math.max(0, value), maxValue);

    (this as any)[prop] = value;
    this.emitValue();
  }


  // ------------------------
  // Gestion du scroll mobile
  // ------------------------
  syncScrollPositions() {
    const itemHeight = 32;
    const containerHeight = 96;
    const centerOffset = containerHeight / 2 - itemHeight / 2;

    this.scrollPickers.forEach((picker, index) => {
      const col = this.columns[index];
      const value = this.getValue(col.value);

      const scrollIndex = value / col.step;
      const scrollTop = scrollIndex * itemHeight - centerOffset;

      picker.nativeElement.scrollTop = scrollTop;
    });
  }

  getScrollValues(col: PickerColumn): number[] {
    const max = col.max ?? 99;
    const step = col.step ?? 1;

    const values: number[] = [];
    for (let i = 0; i <= max; i += step) {
      values.push(i);
    }
    return values;
  }

  onScroll(prop: keyof NumericPickerComponent, event: Event, col: PickerColumn) {
    const container = event.target as HTMLElement;

    const itemHeight = 32;
    const containerHeight = 96;

    const centerOffset = containerHeight / 2 - itemHeight / 2;

    const index = Math.round((container.scrollTop + centerOffset) / itemHeight);

    const maxIndex = Math.floor((col.max ?? 99) / col.step);
    const safeIndex = Math.max(0, Math.min(index, maxIndex));

    const value = safeIndex * col.step;
    (this as any)[prop] = value;

    this.emitValue();
  }


  // -------------
  // Submit button
  // -------------
  submit() {
    if (this.type === 'distance') {
      this.dialogRef.close(this.distance);
    } else if (this.type === 'time') {
      this.dialogRef.close(this.time);
    } else if (this.type === 'pace') {
      this.dialogRef.close(this.pace);
    }
  }
}
