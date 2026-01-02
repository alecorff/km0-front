import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, Output } from '@angular/core';
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
export class NumericPickerComponent {

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

  }

  // ------------------------
  // Configuration des colonnes
  // ------------------------
  getColumns(): PickerColumn[] {
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
    const maxValue = this.getColumns().find(c => c.value === prop)?.max ?? Infinity;
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
