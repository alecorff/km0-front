import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterOutlet } from '@angular/router';
import { User, UserService } from 'src/app/services/user.service';
import { MatDialog } from '@angular/material/dialog';
import { SyncDialogComponent } from './sync-dialog/sync-dialog.component';
import { ActivityService } from 'src/app/services/activity.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoaderComponent } from '../loader/loader.component';
import { GlobalService } from 'src/app/services/global.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    RouterOutlet,
    MatToolbarModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatTooltipModule,
    MatSnackBarModule,
    LoaderComponent
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {

  user: User | null = null;

  isLoading: boolean = false;

  @ViewChild('sidenav') sidenav!: MatSidenav;

  constructor(
    private userService: UserService,
    private activityService: ActivityService,
    private translateService: TranslateService,
    private globalService: GlobalService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { 
    this.globalService.loading$.subscribe(val => this.isLoading = val);
  }

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') ?? '{}');

    // get last sync
    this.userService.getLastSync().subscribe(result => {
      if (this.user) {
        this.user.lastSync = result;
      }
    });
  }

  sync() {
    const dialogRef = this.dialog.open(SyncDialogComponent, {
      data: {
        lastsync: this.user?.lastSync
      },
      disableClose: false,
      panelClass: 'primary-dialog'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.isLoading = true;
        this.activityService.syncActivities(this.user?.lastSync).subscribe(result => {
          // On met à jour la date de dernière synchronisation
          if (this.user) {
            this.user.lastSync = result;
          }

          // success message
          this.snackBar.open(
            this.translateService.instant('i18n.page.menu.sync_message.success'), 
            this.translateService.instant('i18n.page.menu.sync_message.action'), 
            {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['app-snackbar']
            }
          );

          this.isLoading = false;
        })
      }
    });
  }

  getDisplayName() {
    if (!this.user) {
      return "-";
    }

    const { firstname, lastname } = this.user;

    if (firstname && lastname) {
      return `${firstname} ${lastname}`;
    }

    if (firstname) {
      return firstname;
    }

    if (lastname) {
      return lastname;
    }

    return "-";
  }

}
