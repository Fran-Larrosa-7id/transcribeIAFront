import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranscriptionJob } from '../../../core/models/transcription.models';
import { formatDate, formatDuration, formatFileSize } from '../../../core/utils/formatters';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { TranscriptionStatusBadgeComponent } from '../transcription-status-badge/transcription-status-badge.component';

@Component({
  selector: 'app-transcription-card',
  imports: [RouterLink, ProgressBarComponent, TranscriptionStatusBadgeComponent],
  template: `
    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-base font-semibold text-slate-950">{{ job().title }}</h2>
          <p class="mt-1 text-sm text-slate-500">{{ job().originalFilename }}</p>
        </div>
        <app-transcription-status-badge [status]="job().status" />
      </div>

      <dl class="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt class="text-slate-500">Fecha</dt>
          <dd class="mt-1 font-medium text-slate-800">{{ formatDate(job().createdAt) }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Duración</dt>
          <dd class="mt-1 font-medium text-slate-800">{{ formatDuration(job().durationSeconds) }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Archivo</dt>
          <dd class="mt-1 font-medium text-slate-800">{{ formatFileSize(job().fileSize) }}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Modelo</dt>
          <dd class="mt-1 font-medium text-slate-800">{{ job().model === 'economy' ? 'Económico' : 'Alta precisión' }}</dd>
        </div>
      </dl>

      <div class="mt-5">
        <app-progress-bar [progress]="job().progress" label="Avance" />
      </div>

      <a
        [routerLink]="['/transcriptions', job().id]"
        class="mt-5 inline-flex w-full justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
      >
        Ver detalle
      </a>
    </article>
  `,
})
export class TranscriptionCardComponent {
  readonly job = input.required<TranscriptionJob>();

  protected readonly formatDate = formatDate;
  protected readonly formatDuration = formatDuration;
  protected readonly formatFileSize = formatFileSize;
}
