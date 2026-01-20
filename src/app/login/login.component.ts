import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  tokenResponse: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
  }

  login() {
    this.authService.login();
  }
}
