import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-login-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login-success.component.html',
  styleUrl: './login-success.component.css'
})
export class LoginSuccessComponent implements OnInit {

  token: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Récupère le paramètre de requête
    this.route.queryParams.subscribe(params => {
      this.token = params['tokenResponse'];
    });
  }
}
