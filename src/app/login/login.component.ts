import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  tokenResponse: string | null = null;

  constructor(private authService: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.tokenResponse = params['tokenResponse'];
      if (this.tokenResponse) {
        this.authService.getUserInfo(this.tokenResponse).subscribe(userInfo => {
          console.log('User Info:', userInfo);
        });
      }
    });
  }

  login() {
    this.authService.login();
  }
}
