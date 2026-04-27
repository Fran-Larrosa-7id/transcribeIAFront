import { Routes } from '@angular/router';

export const transcriptionRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/transcription-list-page.component').then((m) => m.TranscriptionListPageComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/new-transcription-page.component').then((m) => m.NewTranscriptionPageComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/transcription-detail-page.component').then((m) => m.TranscriptionDetailPageComponent),
  },
];
