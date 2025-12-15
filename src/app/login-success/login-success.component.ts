import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-login-success',
  standalone: true,
  imports: [CommonModule],
  template: ``
})
export class LoginSuccessComponent implements OnInit {

  token: string | null = null;

  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;

    const user = {
      firstname: params.get('firstname') ?? "",
      lastname: params.get('lastname') ?? "",
      avatar: params.get('avatar') ?? ""
    };

    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('jwt', params.get('jwt') ?? "");

    this.router.navigate(['/home'], { replaceUrl: true });
  }
}
