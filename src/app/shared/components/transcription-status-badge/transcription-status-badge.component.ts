import { Component, computed, input } from '@angular/core';
import { TranscriptionStatus } from '../../../core/models/transcription.models';

interface StatusView {
  label: string;
  className: string;
}

@Component({
  selector: 'app-transcription-status-badge',
  template: `
    <span class="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset" [class]="view().className">
      <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"></span>
      {{ view().label }}
    </span>
  `,
})
export class TranscriptionStatusBadgeComponent {
  readonly status = input.required<TranscriptionStatus>();

  protected readonly view = computed<StatusView>(() => {
    const views: Record<TranscriptionStatus, StatusView> = {
      pending: { label: 'Pendiente', className: 'bg-slate-100 text-slate-700 ring-slate-200' },
      uploading: { label: 'Subiendo', className: 'bg-sky-50 text-sky-700 ring-sky-200' },
      processing_audio: { label: 'Procesando audio', className: 'bg-blue-50 text-blue-700 ring-blue-200' },
      transcribing: { label: 'Transcribiendo', className: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
      merging: { label: 'Uniendo texto', className: 'bg-violet-50 text-violet-700 ring-violet-200' },
      completed: { label: 'Finalizada', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
      failed: { label: 'Fallida', className: 'bg-rose-50 text-rose-700 ring-rose-200' },
    };

    return views[this.status()];
  });
}
