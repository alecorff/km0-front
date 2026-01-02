import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { DateAdapter, MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { Country } from 'src/app/enum/enum';
import { TrainingPlanService } from 'src/app/services/training-plan.service';

@Component({
  selector: 'app-creation-plan-dialog',
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
    MatDividerModule
  ],
  providers: [{ provide: MAT_DATE_LOCALE, useValue: 'ja-JP' }, provideNativeDateAdapter()],
  templateUrl: './creation-plan-dialog.component.html',
  styleUrl: './creation-plan-dialog.component.css'
})
export class CreatePlanDialogComponent implements OnInit {

  private readonly _adapter = inject<DateAdapter<unknown, unknown>>(DateAdapter);
  private readonly _locale = signal(inject<unknown>(MAT_DATE_LOCALE));

  form!: FormGroup;

  trainingTypes = [
    { value: 'RUNNING', label: this.translateService.instant('i18n.page.home.create_dialog.fields.trainingTypes.running') },
    { value: 'TRAIL', label: this.translateService.instant('i18n.page.home.create_dialog.fields.trainingTypes.trail') },
    { value: 'FITNESS', label: this.translateService.instant('i18n.page.home.create_dialog.fields.trainingTypes.fitness') },
    { value: 'OTHER', label: this.translateService.instant('i18n.page.home.create_dialog.fields.trainingTypes.other') }
  ];

  fitnessGoals = [
    this.translateService.instant('i18n.page.home.create_dialog.fields.fitnessGoals.resumeActivity'),
    this.translateService.instant('i18n.page.home.create_dialog.fields.fitnessGoals.improveEndurance'),
    this.translateService.instant('i18n.page.home.create_dialog.fields.fitnessGoals.stayActive'),
    this.translateService.instant('i18n.page.home.create_dialog.fields.fitnessGoals.loseWeight')
  ];

  countries = Object.entries(Country).map(([code, label]) => ({
    code,
    label,
    flag: `assets/images/flag/${code}.png`
  })).sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  Country: any = Country;

  constructor(
    private fb: FormBuilder, 
    private translateService: TranslateService,
    private dialogRef: MatDialogRef<CreatePlanDialogComponent>,
    private trainingPlanService: TrainingPlanService
  ) { }

  ngOnInit(): void {
    this._locale.set('fr');
    this._adapter.setLocale(this._locale());

    this.form = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],

      // Champs conditionnels
      distanceKm: [null],
      elevationGain: [null],
      goal: [''],
      fitnessGoal: [''],
      country: [null]
    });

    this.handleTypeChanges();
  }

  /**
   * Permet d'ajouter de nouveaux Validators dynamiquement
   */
  private handleTypeChanges(): void {
    this.form.get('type')!.valueChanges.subscribe(type => {
      this.resetConditionalFields();

      if (type === 'RUNNING' || type === 'TRAIL') {
        this.form.get('distanceKm')!.setValidators([Validators.required, Validators.min(1)]);
      }

      if (type === 'TRAIL') {
        this.form.get('elevationGain')!.setValidators([Validators.required, Validators.min(0)]);
      }

      if (type === 'FITNESS') {
        this.form.get('fitnessGoal')!.setValidators(Validators.required);
      }

      this.form.updateValueAndValidity();
    });
  }

  /**
   * Permet de réinitialiser les Validators des champs conditionnels
   */
  private resetConditionalFields(): void {
    [
      'distanceKm',
      'elevationGain',
      'raceDate',
      'targetTime',
      'fitnessGoal'
    ].forEach(field => {
      const control = this.form.get(field);
      control?.clearValidators();
      control?.reset();
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;

    const startDate = [value.startDate.getFullYear(), String(value.startDate.getMonth() + 1).padStart(2, '0'), String(value.startDate.getDate()).padStart(2, '0')].join('-');
    const endDate = [value.endDate.getFullYear(), String(value.endDate.getMonth() + 1).padStart(2, '0'), String(value.endDate.getDate()).padStart(2, '0')].join('-');

    const payload: any = {
      name: value.name,
      type: value.type,
      location: value.country ?? null,
      goal: value.goal ?? null,
      fitnessGoal: value.fitnessGoal ?? null,

      distanceKm:
        value.type === 'RUNNING' || value.type === 'TRAIL'
          ? value.distanceKm
          : null,

      elevationGain:
        value.type === 'TRAIL'
          ? value.elevationGain
          : null,

      startDate: startDate,
      endDate: endDate
    };

    this.trainingPlanService.createTrainingPlan(payload).subscribe({
      next: (response) => {
        this.dialogRef.close(response);
      },
      error: (err) => {
        console.error('Erreur lors de la création du plan', err);
      }
    });
  }


}
