import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  template: `
    <div class="space-y-2">
      <div class="flex items-center justify-between gap-3 text-sm">
        <span class="font-medium text-slate-700">{{ label() }}</span>
        <span class="tabular-nums text-slate-500">{{ normalizedProgress() }}%</span>
      </div>
      <div class="h-2.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" [attr.aria-valuenow]="normalizedProgress()" aria-valuemin="0" aria-valuemax="100">
        <div class="h-full rounded-full bg-indigo-600 transition-all duration-500 ease-out" [style.width.%]="normalizedProgress()"></div>
      </div>
    </div>
  `,
})
export class ProgressBarComponent {
  readonly progress = input.required<number>();
  readonly label = input('Progreso');

  protected readonly normalizedProgress = computed(() => Math.max(0, Math.min(100, Math.round(this.progress()))));
}
