import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { LoginSuccessComponent } from './login-success/login-success.component';
import { HomeComponent } from './home/home.component';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'home',
        component: HomeComponent
      }
    ]  
  },
  { path: 'login', component: LoginComponent },
  { path: 'loginSuccess', component: LoginSuccessComponent },
  { path: 'home', component: HomeComponent },
];