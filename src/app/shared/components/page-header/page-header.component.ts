import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  imports: [RouterLink],
  template: `
    <div class="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div class="max-w-3xl">
        @if (eyebrow()) {
          <p class="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-600">{{ eyebrow() }}</p>
        }
        <h1 class="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{{ title() }}</h1>
        @if (description()) {
          <p class="mt-3 text-base leading-7 text-slate-600">{{ description() }}</p>
        }
      </div>

      @if (actionLabel() && actionLink()) {
        <a
          [routerLink]="actionLink()"
          class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          {{ actionLabel() }}
        </a>
      }
    </div>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input('');
  readonly description = input('');
  readonly actionLabel = input('');
  readonly actionLink = input<string | unknown[] | null>(null);
}
