import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink],
  template: `
    <section class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-indigo-50 text-indigo-600" aria-hidden="true">
        <svg viewBox="0 0 24 24" class="h-6 w-6" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
      </div>
      <h2 class="mt-4 text-lg font-semibold text-slate-950">{{ title() }}</h2>
      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{{ description() }}</p>
      @if (actionLabel() && actionLink()) {
        <a [routerLink]="actionLink()" class="mt-6 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          {{ actionLabel() }}
        </a>
      }
    </section>
  `,
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly actionLabel = input('');
  readonly actionLink = input<string | unknown[] | null>(null);
}
