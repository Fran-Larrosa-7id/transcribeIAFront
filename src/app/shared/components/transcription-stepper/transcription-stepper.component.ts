import { Component, computed, input } from '@angular/core';
import { TranscriptionStatus } from '../../../core/models/transcription.models';

interface StepItem {
  label: string;
  threshold: number;
}

@Component({
  selector: 'app-transcription-stepper',
  template: `
    <ol class="grid gap-3 sm:grid-cols-5">
      @for (step of steps; track step.label; let index = $index) {
        <li class="rounded-xl border p-4 transition" [class]="stepClass(step.threshold)">
          <div class="flex items-center gap-3 sm:block">
            <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold" [class]="bubbleClass(step.threshold)">
              {{ index + 1 }}
            </span>
            <span class="text-sm font-semibold text-slate-800 sm:mt-3 sm:block">{{ step.label }}</span>
          </div>
        </li>
      }
    </ol>
  `,
})
export class TranscriptionStepperComponent {
  readonly status = input.required<TranscriptionStatus>();
  readonly progress = input.required<number>();

  protected readonly steps: StepItem[] = [
    { label: 'Archivo recibido', threshold: 8 },
    { label: 'Audio procesado', threshold: 24 },
    { label: 'Transcribiendo', threshold: 46 },
    { label: 'Uniendo texto', threshold: 82 },
    { label: 'Finalizado', threshold: 100 },
  ];

  private readonly isFailed = computed(() => this.status() === 'failed');

  protected stepClass(threshold: number): string {
    if (this.isFailed()) {
      return 'border-rose-200 bg-rose-50';
    }

    return this.progress() >= threshold ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white';
  }

  protected bubbleClass(threshold: number): string {
    if (this.isFailed()) {
      return 'bg-rose-600 text-white';
    }

    return this.progress() >= threshold ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500';
  }
}
