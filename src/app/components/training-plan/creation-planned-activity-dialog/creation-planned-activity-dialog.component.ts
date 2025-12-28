import { CommonModule } from '@angular/common';
import { Component, Inject, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { TRAINING_SESSION_TYPES, TrainingSessionType } from 'src/app/enum/enum';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NumericPickerComponent } from '../../common/numeric-picker/numeric-picker.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatMenuModule } from '@angular/material/menu';
import { DurationPipe } from '../../common/pipe/duration.pipe';
import { PacePipe } from '../../common/pipe/pace.pipe';


@Component({
  selector: 'app-creation-planned-activity-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatDialogModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatInputModule,
    MatDividerModule,
    MatIconModule,
    MatCheckboxModule,
    MatMenuModule,
    NumericPickerComponent,
    DurationPipe,
    PacePipe
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'ja-JP' }, provideNativeDateAdapter()],
  templateUrl: './creation-planned-activity-dialog.component.html',
  styleUrl: './creation-planned-activity-dialog.component.css'
})
export class CreationPlannedActivityDialogComponent implements OnInit {

  private readonly _adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);
  private readonly _locale = signal(inject<unknown>(MAT_DATE_LOCALE));

  form!: FormGroup;
  today = new Date();

  currentPlanType!:  'RUNNING' | 'TRAIL' | 'FITNESS' | 'OTHER';
  filteredSessionTypes: Record<string, TrainingSessionType[]> = {};

  stepsForm!: FormArray;

  plannedDistance!: number;
  plannedTime!: number;
  plannedPace!: number;

  constructor(
      private fb: FormBuilder, 
      private dialogRef: MatDialogRef<CreationPlannedActivityDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data: any,
      private dialog: MatDialog
    ) { 
      this.stepsForm = this.fb.array([this.createStep()]);
    }
  
    ngOnInit(): void {
      this._locale.set('fr');
      this._adapter.setLocale(this._locale());
  
      this.form = this.fb.group({
        name: ['', Validators.required],
        date: ['', Validators.required],
        sessionType: ['', Validators.required],
        defineContent: [false],
        plannedTime: [null],
        plannedDistance: [null],
        plannedPace: [null]
      });

      this.loadSessionTypes();
    }

    /* -------------------- SESSION TYPES -------------------- */
    loadSessionTypes() {
      this.currentPlanType = this.data.type;
      const sessions = TRAINING_SESSION_TYPES.filter(session =>
        session.allowedPlans.includes(this.currentPlanType)
      );

      this.filteredSessionTypes = sessions.reduce((acc, session) => {
        if (!acc[session.category]) {
          acc[session.category] = [];
        }
        acc[session.category].push(session);
        return acc;
      }, {} as Record<string, typeof sessions>);
    }

    get categories(): string[] {
      return Object.keys(this.filteredSessionTypes);
    }

    /* -------------------- STEPS -------------------- */
    createStep(isRepetition = false, repetitionCount = 2): FormGroup {
      return this.fb.group({
        type: ['distance'],
        distance: [''],
        time: [''],
        pace: [''],
        isRepetition: [isRepetition],
        repetitionCount: [repetitionCount]
      });
    }

    get steps(): FormArray {
      return this.stepsForm;
    }

    get stepGroups(): FormGroup[] {
      return this.steps.controls as FormGroup[];
    }


    addStep(): void {
      this.steps.push(this.createStep());
    }

    removeStep(index: number): void {
      if (index < 0 || index >= this.steps.length) {
        return;
      }

      this.steps.removeAt(index);
    }

    // addRepetition(): void {
    //   this.steps.push(this.createStep());
    //   this.steps.push(this.createStep());
    // }

    addRepetition(): void {
      const repetitionGroup = this.fb.group({
        repetitionCount: [2],
        steps: this.fb.array([
          this.createStep(true),
          this.createStep(true)
        ])
      });

      this.steps.push(repetitionGroup);
    }

    drop(event: CdkDragDrop<FormGroup[]>): void {
      moveItemInArray(this.steps.controls, event.previousIndex, event.currentIndex);
    }

    pickNumericValue(step: any, type: string) {
      if (type !== 'pace') {
        step.get('type')?.setValue(type);
      }
      
      const dialogRef = this.dialog.open(NumericPickerComponent, {
        data: type,
        disableClose: false,
        panelClass: 'primary-dialog'
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result) {
          if (type === "distance") {
            step.get('distance')?.setValue(result);
          } else if (type === "time") {
            step.get('time')?.setValue(result);
          } else if (type === "pace") {
            step.get('pace')?.setValue(result);
          }
        }
      });
    }

    /* -------------------- SUBMIT -------------------- */
    submit() {

    }

}
