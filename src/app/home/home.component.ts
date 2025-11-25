import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

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
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  currentPrepa = {
    name: 'Marathon de Paris',
    date: new Date('2025-04-13'),
    totalWeeks: 12,
    weeksDone: 2,
  };

  nextSession = {
    day: 'Mardi',
    label: "100' EF"
  };

  weeksArray = Array.from({ length: this.currentPrepa.totalWeeks });

  currentIndex = 0;
  pastPrepas = [
    { name: "Ultra Marin - Le Raid", endDate: new Date("2024-06-26"), country: "FR", distance: 177, elevation: 2500 },
    { name: "Marathon Nantes", endDate: new Date("2025-04-27"), country: "FR", distance: 42.2 },
    { name: "Diagonale des Fous", endDate: new Date("2025-10-16"), country: "RE", distance: 165, elevation: 9500 },
    { name: "Ultra Trail Australia - UTA50", endDate: new Date("2026-05-16"), country: "AU", distance: 50, elevation: 2500 },
    { name: "Belle-Île en Trail", endDate: new Date("2026-09-19"), country: "FR", distance: 85 },
    { name: "Ultra Trail Mont-Blanc", endDate: new Date("2027-08-31"), country: "FR", distance: 172, elevation: 10000 }
  ];

  goToCurrentPrepa() {

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

}
