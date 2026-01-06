import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { MatRadioModule } from '@angular/material/radio';

@Component({
  selector: 'app-link-activity-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    ReactiveFormsModule,
    MatRadioModule
  ],
  templateUrl: './link-activity-dialog.component.html',
  styleUrl: './link-activity-dialog.component.css'
})
export class LinkActivityDialogComponent implements OnInit {

  plannedActivitiesAroundDate: any[] = [];
  hasSelectedActivity = false;
  plannedActivity: any;

  constructor(
    public dialogRef: MatDialogRef<LinkActivityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    this.plannedActivitiesAroundDate = (this.data.plannedActivitiesAroundDate as any[])
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }


  onRadioChange(plannedActivity: any) {
    this.hasSelectedActivity = true;
    this.plannedActivity = plannedActivity;
  }

  submit() {
    if (!this.hasSelectedActivity) {
      return;
    }

    this.dialogRef.close(this.plannedActivity);
  }

}
