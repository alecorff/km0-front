import { CommonModule } from '@angular/common';
import { Component, LOCALE_ID, OnInit } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CreatePlanDialogComponent } from './creation-plan-dialog/creation-plan-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TrainingPlanService } from 'src/app/services/training-plan.service';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { GlobalService } from 'src/app/services/global.service';

registerLocaleData(localeFr);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule
  ],
  providers: [{ provide: LOCALE_ID, useValue: 'fr-FR' }],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  currentPrepa: any = null;
  weeksArray: any[] = [];
  pastPrepas: any[] = [];

  currentIndex = 0;

  nextSession = {
    day: 'Mardi',
    label: "100' EF"
  };

  constructor(
    private trainingPlanService: TrainingPlanService,
    private translateService: TranslateService,
    private globalService: GlobalService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    // get all prepas
    this.trainingPlanService.getAllPlans().subscribe(result => {
      this.globalService.startLoading();
      const today = new Date();

      const plans = result;
      plans.forEach(plan => {
        const start = new Date(plan.startDate);
        const end = new Date(plan.endDate);

        const isCurrent = today >= start && today <= end;
        if (isCurrent) {
          this.currentPrepa = plan;
          
          // calcul de l'avancement
          this.computeWeeks(plan);

          this.weeksArray = Array.from({ length: this.currentPrepa?.totalWeeks });
        } else {
          this.pastPrepas.push(plan);
        }
      });
      this.globalService.stopLoading();
    });
  }

  goToCurrentPrepa() {
    this.router.navigate([`/plan`]);
  }

  createPlan() {
    const dialogRef = this.dialog.open(CreatePlanDialogComponent, {
      data: {
      },
      disableClose: false,
      panelClass: 'primary-dialog'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.globalService.startLoading();
        // ajout du plan d'entrainement
        const start = new Date(result.startDate);
        const end = new Date(result.endDate);
        const today = new Date();
        const isCurrent = today >= start && today <= end;
        if (isCurrent) {
          this.currentPrepa = result;
          this.computeWeeks(this.currentPrepa);
          this.weeksArray = Array.from({ length: this.currentPrepa?.totalWeeks });
        } else {
          this.pastPrepas.push(result);
        }
        
        // success message
        this.snackBar.open(
          this.translateService.instant('i18n.page.home.create_dialog.successMessage.success'),
          this.translateService.instant('i18n.page.home.create_dialog.successMessage.action'),
          {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['app-snackbar']
          }
        );

        this.globalService.stopLoading();
      }
    });
  }

  nextSlide() {
    if (this.currentIndex < this.pastPrepas.length - 1) {
      this.currentIndex++;
    }
  }

  prevSlide() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  goToSlide(i: number) {
    this.currentIndex = i;
  }

  private computeWeeks(plan: any): void {
    const startDate = new Date(plan.startDate);
    const endDate = new Date(plan.endDate);
    const today = new Date();

    const startWeek = this.getStartOfWeek(startDate);
    const endWeek = this.getStartOfWeek(endDate);
    const todayWeek = this.getStartOfWeek(today);

    const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;

    // total de semaines calendaires
    const totalWeeks =
      Math.floor((endWeek.getTime() - startWeek.getTime()) / MS_PER_WEEK) + 1;

    // semaines écoulées
    let weeksDone =
      Math.floor((todayWeek.getTime() - startWeek.getTime()) / MS_PER_WEEK) + 1;

    // bornes
    weeksDone = Math.max(0, Math.min(weeksDone, totalWeeks));

    plan.totalWeeks = totalWeeks;
    plan.weeksDone = weeksDone;
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
