import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-training-plan-resume',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatIconModule
  ],
  templateUrl: './training-plan-resume.component.html',
  styleUrl: './training-plan-resume.component.css'
})
export class TrainingPlanResumeComponent implements OnInit {

  @Input() currentPlan!: any;
  @Input() activities: any[] = [];

  totalDistance: any;
  totalElevation: any;
  totalTime: any;

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
    this.computeTotals();
  }

  /**
   * Permet de calculer les temps totaux du plan d'entrainement
   */
  computeTotals() {
    this.totalDistance = this.activities
      .reduce((sum, a) => sum + (a.distance ?? 0), 0)
      .toFixed(2);

    if (this.currentPlan?.type === 'TRAIL') {
      this.totalElevation = this.activities
        .reduce((sum, a) => sum + (a.totalElevationGain ?? 0), 0);
    }

    const totalTimeSeconds = this.activities
      .reduce((sum, a) => sum + (a.movingTime ?? 0), 0);

    this.totalTime = this.formatSeconds(totalTimeSeconds);
  }

  /**
   * Permet de convertir le temps total d'activité en secondes en HH:mm:ss
   */
  private formatSeconds(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:` +
      `${minutes.toString().padStart(2, '0')}:` +
      `${seconds.toString().padStart(2, '0')}`;
  }

  navigateToPlan() {
    this.router.navigate([`/plan/${this.currentPlan.planId}`]);
  }

}
