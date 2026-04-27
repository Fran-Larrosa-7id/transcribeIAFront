import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  template: `
    <div class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" aria-hidden="true"></div>
      <p class="mt-4 text-sm font-medium text-slate-700">{{ label() }}</p>
    </div>
  `,
})
export class LoadingStateComponent {
  readonly label = input('Cargando...');
}
