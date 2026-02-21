import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatButtonModule
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit {

  isLoggedIn : boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  async ngOnInit() {
    this.isLoggedIn = await this.authService.hasValidSession();
  }

  login() {
    if (this.isLoggedIn) {
      return this.router.navigate(['/home']);
    }

    return this.authService.login();
  }

}
