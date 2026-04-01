import { Routes } from '@angular/router';
import { LoginSuccessComponent } from './login-success/login-success.component';
import { HomeComponent } from './components/home/home.component';
import { LayoutComponent } from './components/layout/layout.component';
import { TrainingPlanComponent } from './components/training-plan/training-plan.component';
import { SearchComponent } from './components/search/search.component';
import { AuthGuard } from './guard/auth.guard';
import { LandingComponent } from './components/landing/landing.component';
import { StatsComponent } from './components/stats/stats.component';
import { LayoutFiltersComponent } from './components/layout-filters/layout-filters.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent
  },
  {
    path: 'loginSuccess',
    component: LoginSuccessComponent
  },
  {
    path: '',
    component: LayoutComponent,
    canActivateChild: [AuthGuard],
    children: [
      {
        path: 'home',
        component: HomeComponent
      },
      {
        path: 'plan/:id',
        component: TrainingPlanComponent
      },
      {
        path: '',
        component: LayoutFiltersComponent,
        children: [
          {
            path: 'search',
            component: SearchComponent
          },
          {
            path: 'search/:id',
            component: SearchComponent
          },
          {
            path: 'stats',
            component: StatsComponent
          },
          {
            path: 'stats/:id',
            component: StatsComponent
          }
        ]
      },
    ]
  }
];
