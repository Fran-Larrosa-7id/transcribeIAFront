import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-slate-50 text-slate-950">
      <header class="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a routerLink="/" class="flex items-center gap-3 font-semibold text-slate-950" aria-label="Ir al inicio">
            <span class="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm">
              TA
            </span>
            <span class="text-lg">TranscribeAI</span>
          </a>

          <nav class="hidden items-center gap-1 md:flex" aria-label="Navegacion principal">
            @for (item of navItems; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-slate-100 text-slate-950"
                [routerLinkActiveOptions]="item.exact ? { exact: true } : { exact: false }"
                class="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
              >
                {{ item.label }}
              </a>
            }
          </nav>

          <div class="hidden md:block">
            <a
              routerLink="/transcriptions/new"
              class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Nueva transcripción
            </a>
          </div>

          <button
            type="button"
            class="rounded-lg border border-slate-200 p-2 text-slate-700 md:hidden"
            aria-label="Abrir menu"
            [attr.aria-expanded]="mobileMenuOpen()"
            (click)="toggleMobileMenu()"
          >
            <span class="block h-0.5 w-5 bg-current"></span>
            <span class="mt-1 block h-0.5 w-5 bg-current"></span>
            <span class="mt-1 block h-0.5 w-5 bg-current"></span>
          </button>
        </div>

        @if (mobileMenuOpen()) {
          <nav class="border-t border-slate-200 bg-white px-4 py-3 md:hidden" aria-label="Menu mobile">
            @for (item of navItems; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-slate-100 text-slate-950"
                [routerLinkActiveOptions]="item.exact ? { exact: true } : { exact: false }"
                class="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600"
                (click)="closeMobileMenu()"
              >
                {{ item.label }}
              </a>
            }
          </nav>
        }
      </header>

      <main class="mx-auto min-h-[calc(100vh-9rem)] max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <router-outlet />
      </main>

      <footer class="border-t border-slate-200 bg-white">
        <div class="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>TranscribeAI. Plataforma preparada para transcripciones largas con IA.</span>
          <span>Mock local, listo para conectar con NestJS.</span>
        </div>
      </footer>
    </div>
  `,
})
export class MainLayoutComponent {
  protected readonly mobileMenuOpen = signal(false);
  protected readonly navItems = [
    { label: 'Dashboard', path: '/', exact: true },
    { label: 'Historial', path: '/transcriptions', exact: true },
  ] as const;

  protected toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  protected closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
