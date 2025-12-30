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
import { DragDropModule } from '@angular/cdk/drag-drop';
import { StepInfoComponent } from './step-info/step-info.component';


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
    StepInfoComponent,
    DurationPipe,
    PacePipe,
    DragDropModule
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
  maxDate!: Date;

  currentPlanType!: 'RUNNING' | 'TRAIL' | 'FITNESS' | 'OTHER';
  filteredSessionTypes: Record<string, TrainingSessionType[]> = {};

  stepsForm!: FormArray;

  repetitionCounts = Array.from({ length: 50 }, (_, i) => i + 1);

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

    this.maxDate = this.data.endDate;

    this.form = this.fb.group({
      name: ['', Validators.required],
      date: ['', Validators.required],
      sessionType: ['', Validators.required],
      defineContent: [false],
      steps: this.fb.array([]),
      plannedTime: [null],
      plannedDistance: [null],
      plannedPace: [null]
    });

    this.loadSessionTypes();
    this.addStep();
    this.watchStepsArray();
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
  get steps(): FormArray {
    return this.form.get('steps') as FormArray;
  }

  createStep(): FormGroup {
    return this.fb.group({
      kind: ['step'],
      type: ['distance'],
      distance: [null],
      time: [null],
      pace: [null]
    });
  }

  createRepetition(): FormGroup {
    return this.fb.group({
      kind: ['repeat'],
      type: ['distance'],
      repetitionCount: [2],
      steps: this.fb.array([
        this.createStep(),
        this.createStep()
      ])
    });
  }

  addStep(): void {
    const step = this.createStep();
    this.steps.push(step);
    this.watchStep(step);
    this.triggerOverviewRecompute();
  }

  addRepetition(): void {
    const repetition = this.createRepetition();
    this.steps.push(repetition);
    this.watchRepetition(repetition);
    this.triggerOverviewRecompute();
  }

  addStepToRepetition(repeatCtrl: AbstractControl): void {
    const steps = repeatCtrl.get('steps') as FormArray;
    const step = this.createStep();
    steps.push(step);
    this.watchStep(step);
    this.triggerOverviewRecompute();
  }

  removeStep(index: number): void {
    this.steps.removeAt(index);
    this.triggerOverviewRecompute();
  }

  removeRepetitionStep(repeatCtrl: AbstractControl, stepIndex: number): void {
    const steps = repeatCtrl.get('steps') as FormArray;
    steps.removeAt(stepIndex);
    this.triggerOverviewRecompute();
  }

  dropMain(event: CdkDragDrop<AbstractControl[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.steps.controls, event.previousIndex, event.currentIndex);
      return;
    }

    const moved = event.previousContainer.data[event.previousIndex];
    event.previousContainer.data.splice(event.previousIndex, 1);
    this.steps.insert(event.currentIndex, moved);
  }

  dropIntoRepetition(repeatCtrl: AbstractControl, event: CdkDragDrop<AbstractControl[]>) {
    const target = repeatCtrl.get('steps') as FormArray;
    if (event.previousContainer === event.container) {
      moveItemInArray(target.controls, event.previousIndex, event.currentIndex);
      return;
    }

    const moved = event.previousContainer.data[event.previousIndex];
    event.previousContainer.data.splice(event.previousIndex, 1);
    target.insert(event.currentIndex, moved);
  }


  getRepetitionSteps(ctrl: AbstractControl): FormArray {
    return ctrl.get('steps') as FormArray;
  }

  getRepetitionStepGroups(ctrl: AbstractControl): FormGroup[] {
    const steps = ctrl.get('steps');
    return steps instanceof FormArray
      ? (steps.controls as FormGroup[])
      : [];
  }

  asFormGroup(ctrl: AbstractControl): FormGroup {
    return ctrl as FormGroup;
  }

  pickNumericValue(step: AbstractControl, type: 'distance' | 'time' | 'pace'): void {
    const group = step as FormGroup;

    if (type !== 'pace') {
      group.get('type')?.setValue(type);
    }

    const dialogRef = this.dialog.open(NumericPickerComponent, {
      data: type
    });

    dialogRef.afterClosed().subscribe(value => {
      if (value != null) {
        group.get(type)?.setValue(value);
      }
    });
  }

  /* -------------------- CALCUL DE L'APERÇU -------------------- */
  private computeStep(step: FormGroup): { distance: number; time: number } | null {
    const type = step.get('type')?.value;
    const distance = step.get('distance')?.value;
    const time = step.get('time')?.value;
    const pace = step.get('pace')?.value;

    if (!pace) {
      return null;
    }

    // pace = minutes / km
    if (type === 'distance' && distance != null) {
      const computedTime = distance * pace;
      return { distance, time: computedTime };
    }

    if (type === 'time' && time != null) {
      const computedDistance = time / pace;
      return { distance: computedDistance, time };
    }

    return null;
  }

  private computeRepetition(repeatCtrl: FormGroup): { distance: number; time: number } {
    const repetitionCount = repeatCtrl.get('repetitionCount')?.value ?? 1;
    const steps = repeatCtrl.get('steps') as FormArray;

    let totalDistance = 0;
    let totalTime = 0;

    steps.controls.forEach(ctrl => {
      const result = this.computeStep(ctrl as FormGroup);
      if (result) {
        totalDistance += result.distance;
        totalTime += result.time;
      }
    });

    return {
      distance: totalDistance * repetitionCount,
      time: totalTime * repetitionCount
    };
  }

  private recomputeOverview(): void {
    let totalDistance = 0;
    let totalTime = 0;

    this.steps.controls.forEach(ctrl => {
      const group = ctrl as FormGroup;

      if (group.get('kind')?.value === 'step') {
        const result = this.computeStep(group);
        if (result) {
          totalDistance += result.distance;
          totalTime += result.time;
        }
      }

      if (group.get('kind')?.value === 'repeat') {
        const result = this.computeRepetition(group);
        totalDistance += result.distance;
        totalTime += result.time;
      }
    });

    this.form.patchValue(
      {
        plannedDistance: totalDistance > 0 ? +totalDistance.toFixed(2) : null,
        plannedTime: totalTime > 0 ? Math.round(totalTime) : null
      },
      { emitEvent: false }
    );
  }

  private triggerOverviewRecompute(): void {
    this.recomputeOverview();
  }

  // on s'abonne aux changements dans les étapes pour calculer la distance et le temps estimés
  private watchStepsArray(): void {
    this.steps.controls.forEach(ctrl => {
      const group = ctrl as FormGroup;

      if (group.get('kind')?.value === 'step') {
        this.watchStep(group);
      }

      if (group.get('kind')?.value === 'repeat') {
        this.watchRepetition(group);
      }
    });
  }

  private watchStep(step: FormGroup): void {
    step.valueChanges.subscribe(() => {
      this.triggerOverviewRecompute();
    });
  }

  private watchRepetition(repeatCtrl: FormGroup): void {
    const steps = repeatCtrl.get('steps') as FormArray;

    // Changement du nombre de répétitions
    repeatCtrl.get('repetitionCount')?.valueChanges.subscribe(() => {
      this.triggerOverviewRecompute();
    });

    // Steps internes
    steps.controls.forEach(ctrl => {
      this.watchStep(ctrl as FormGroup);
    });
  }




  /* -------------------- SUBMIT -------------------- */
  submit() {
    if (this.form.invalid) return;

    const date: Date = this.form.get('date')?.value;
    const scheduledDate = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');

    const payload = {
      planId: this.data.planId,
      scheduledDate: scheduledDate,
      name: this.form.get('name')?.value,
      plannedDistanceKm: this.form.get('plannedDistance')?.value,
      plannedDurationMin: this.form.get('plannedTime')?.value,
      sessionType: this.form.get('sessionType')?.value,
      stepsJson: JSON.stringify(this.steps.value),
      status: 'PLANNED'
    };
    this.dialogRef.close(payload);
  }

}