import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { LoginSuccessComponent } from './login-success/login-success.component';
import { HomeComponent } from './components/home/home.component';
import { LayoutComponent } from './components/layout/layout.component';
import { TrainingPlanComponent } from './components/training-plan/training-plan.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'home',
        component: HomeComponent
      },
      {
        path: 'plan/:id',
        component: TrainingPlanComponent
      }
    ]  
  },
  { path: 'login', component: LoginComponent },
  { path: 'loginSuccess', component: LoginSuccessComponent },
  { path: 'home', component: HomeComponent },
];