import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard-page.component').then((m) => m.DashboardPageComponent),
  },
  {
    path: 'transcriptions',
    loadChildren: () =>
      import('./features/transcriptions/transcriptions.routes').then((m) => m.transcriptionRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
