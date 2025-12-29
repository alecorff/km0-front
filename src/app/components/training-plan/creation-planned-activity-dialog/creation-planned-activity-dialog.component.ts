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
    this.steps.push(this.createStep());
  }

  addRepetition(): void {
    this.steps.push(this.createRepetition());
  }

  removeStep(index: number): void {
    this.steps.removeAt(index);
  }

  removeRepetitionStep(repeatCtrl: AbstractControl, stepIndex: number): void {
    const steps = repeatCtrl.get('steps') as FormArray;
    steps.removeAt(stepIndex);
  }

  addStepToRepetition(repeatCtrl: AbstractControl): void {
    const steps = repeatCtrl.get('steps') as FormArray;
    steps.push(this.createStep());
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


  /* -------------------- SUBMIT -------------------- */
  submit() {

  }

}