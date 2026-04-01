import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ActivityDialogComponent } from '../common/activity-dialog/activity-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PolylinePreviewComponent } from '../common/polyline-preview/polyline-preview.component';
import { GlobalService } from 'src/app/services/global.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    PolylinePreviewComponent
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent implements OnInit {

  isMobile: boolean = false;
  filteredActivities: any[] = [];

  constructor(
    public globalService: GlobalService,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.globalService.filteredActivities$.subscribe(activities => {
      this.filteredActivities = activities;
    });
  }

  openActivity(activity: any) {
      this.dialog.open(ActivityDialogComponent, {
        data: {
          activity: activity
        },
        width: '100%',
        maxWidth: '600px',
        height: '600px'
      });
    }

}
