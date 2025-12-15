import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-sync-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './sync-dialog.component.html',
  styleUrl: './sync-dialog.component.css'
})
export class SyncDialogComponent implements OnInit {

  formattedDate: string = '';
  formattedHour: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<SyncDialogComponent>
  ) { }

  ngOnInit() {
    // Format lastSync Date
    if (this.data.lastsync) {
      this.formatDate();
    }
  }

  formatDate() {
    const date = new Date(this.data.lastsync);

    // Extraction de la date au format DD/MM/YYYY
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    this.formattedDate = `${day}/${month}/${year}`;

    // Extraction de l'heure au format HH:mm
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    this.formattedHour = `${hours}:${minutes}`;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

}
