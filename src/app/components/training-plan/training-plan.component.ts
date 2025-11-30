import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface CalendarDay {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  session?: any;
}

@Component({
  selector: 'app-training-plan',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './training-plan.component.html',
  styleUrl: './training-plan.component.css'
})
export class TrainingPlanComponent implements OnInit {

  currentPrepa = {
    name: 'Marathon de Paris',
    date: new Date('2025-04-13'),
    distance: 42,
    elevation: 200,
    totalDistance: 239,
    totalElevation: 3289,
    sessionsDone: 19,
    totalTime: '19h42',
  };

  nextSession = {
    day: 'Mardi',
    label: "100' EF"
  };

  selectedMonth = new Date();
  selectedDate: Date | null = null;

  weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  monthDays: CalendarDay[] = [];
  selectedWeek: CalendarDay[] = [];

  ngOnInit() {
    this.generateMonth();
    this.selectedDate = new Date();
    this.extractWeek(this.selectedDate);
  }

  /* ===== GÉNÉRATION DU MOIS ===== */
  generateMonth() {
    this.monthDays = [];

    const year = this.selectedMonth.getFullYear();
    const month = this.selectedMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const start = new Date(firstDay);
    start.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));

    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      this.monthDays.push({
        date: d,
        inMonth: d.getMonth() === month,
        isToday: this.isToday(d)
      });
    }
  }

  /** Retourne la semaine (lundi → dimanche) associée à une date */
  getWeek(date: Date): Date[] {
    const week: Date[] = [];
    const selected = new Date(date);

    const day = selected.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;

    const monday = new Date(selected);
    monday.setDate(selected.getDate() + mondayOffset);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d);
    }
    return week;
  }

  /* ===== SÉLECTION DE DATE ===== */
  selectDate(d: Date) {
    this.selectedDate = new Date(d);
    this.extractWeek(d);
  }

  isSelectedDate(d: Date) {
    return this.selectedDate &&
           d.toDateString() === this.selectedDate.toDateString();
  }

  /* ===== EXTRAIRE LA SEMAINE ===== */
  extractWeek(date: Date) {
    const selected = new Date(date);
    const monday = new Date(selected);
    monday.setDate(selected.getDate() - ((selected.getDay() + 6) % 7));

    this.selectedWeek = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      this.selectedWeek.push({
        date: d,
        inMonth: true,
        isToday: this.isToday(d)
      });
    }
  }

  /* ===== NAVIGATION MOIS ===== */
  nextMonth() {
    this.selectedMonth = new Date(
      this.selectedMonth.getFullYear(),
      this.selectedMonth.getMonth() + 1,
      1
    );
    this.generateMonth();
  }

  previousMonth() {
    this.selectedMonth = new Date(
      this.selectedMonth.getFullYear(),
      this.selectedMonth.getMonth() - 1,
      1
    );
    this.generateMonth();
  }

  isToday(date: Date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  /* ===== OUVRIR UN JOUR (affichage séance future / passée) ===== */
  openDay(day: CalendarDay) {
    console.log("Jour cliqué :", day);

    // ici tu ouvriras un dialog
    // si date > today → création future
    // si date < today → afficher séance passée
  }

}
