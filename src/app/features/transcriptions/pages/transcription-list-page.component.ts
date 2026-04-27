import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, map, startWith, Subscription, switchMap, takeWhile, tap, timer } from 'rxjs';
import { TranscriptionJob, TranscriptionStatus } from '../../../core/models/transcription.models';
import { TranscriptionService } from '../../../core/services/transcription.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { TranscriptionCardComponent } from '../../../shared/components/transcription-card/transcription-card.component';

type StatusFilter = TranscriptionStatus | 'all';

const ACTIVE_STATUSES: readonly TranscriptionStatus[] = [
  'pending',
  'uploading',
  'processing_audio',
  'transcribing',
  'merging',
];

function hasActiveJobs(jobs: TranscriptionJob[]): boolean {
  return jobs.some((job) => ACTIVE_STATUSES.includes(job.status));
}

@Component({
  selector: 'app-transcription-list-page',
  imports: [ReactiveFormsModule, PageHeaderComponent, TranscriptionCardComponent, EmptyStateComponent, LoadingStateComponent],
  template: `
    <app-page-header
      eyebrow="Historial"
      title="Transcripciones"
      description="Consulta trabajos recientes, filtra por estado y vuelve a cualquier resultado cuando lo necesites."
      actionLabel="Nueva transcripción"
      actionLink="/transcriptions/new"
    />

    <section class="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
      <label class="block">
        <span class="text-sm font-semibold text-slate-800">Buscar por título</span>
        <input
          type="search"
          [formControl]="searchControl"
          class="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-950 shadow-sm"
          placeholder="Ej: reunión mensual"
        />
      </label>
      <label class="block">
        <span class="text-sm font-semibold text-slate-800">Estado</span>
        <select [formControl]="statusControl" class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 shadow-sm">
          <option value="all">Todos</option>
          @for (status of statuses; track status.value) {
            <option [value]="status.value">{{ status.label }}</option>
          }
        </select>
      </label>
    </section>

    @if (isLoading()) {
      <app-loading-state label="Cargando transcripciones..." />
    } @else if (errorMessage()) {
      <section class="rounded-xl border border-rose-200 bg-rose-50 p-6">
        <h2 class="font-semibold text-rose-950">No pudimos cargar el historial</h2>
        <p class="mt-2 text-sm leading-6 text-rose-800">{{ errorMessage() }}</p>
        <button
          type="button"
          class="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
          (click)="loadTranscriptions()"
        >
          Reintentar
        </button>
      </section>
    } @else if (filteredJobs().length > 0) {
      <section class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        @for (job of filteredJobs(); track job.id) {
          <app-transcription-card [job]="job" />
        }
      </section>
    } @else {
      <app-empty-state
        title="No hay transcripciones para mostrar"
        description="Cambiá los filtros o creá una nueva transcripción para iniciar el flujo."
        actionLabel="Nueva transcripción"
        actionLink="/transcriptions/new"
      />
    }
  `,
})
export class TranscriptionListPageComponent {
  private readonly transcriptionService = inject(TranscriptionService);
  private readonly destroyRef = inject(DestroyRef);
  private pollingSubscription?: Subscription;

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  protected readonly statusControl = new FormControl<StatusFilter>('all', { nonNullable: true });
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  private readonly jobs = signal<TranscriptionJob[]>([]);

  private readonly filters = toSignal(
    combineLatest([
      this.searchControl.valueChanges.pipe(startWith(this.searchControl.value)),
      this.statusControl.valueChanges.pipe(startWith(this.statusControl.value)),
    ]).pipe(map(([search, status]) => ({ search: search.trim().toLowerCase(), status }))),
    { initialValue: { search: '', status: 'all' as StatusFilter } },
  );

  protected readonly filteredJobs = computed(() => {
    const filters = this.filters();

    return this.jobs().filter((job) => {
      const matchesSearch = job.title.toLowerCase().includes(filters.search);
      const matchesStatus = filters.status === 'all' || job.status === filters.status;
      return matchesSearch && matchesStatus;
    });
  });

  protected readonly statuses: Array<{ value: TranscriptionStatus; label: string }> = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'uploading', label: 'Subiendo' },
    { value: 'processing_audio', label: 'Procesando audio' },
    { value: 'transcribing', label: 'Transcribiendo' },
    { value: 'merging', label: 'Uniendo texto' },
    { value: 'completed', label: 'Finalizada' },
    { value: 'failed', label: 'Fallida' },
  ];

  constructor() {
    this.loadTranscriptions();
  }

  protected loadTranscriptions(): void {
    this.stopPolling();
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.pollingSubscription = timer(0, 3000)
      .pipe(
        switchMap(() => this.transcriptionService.getTranscriptions()),
        tap((jobs) => {
          this.jobs.set(jobs);
          this.isLoading.set(false);
          this.errorMessage.set('');
        }),
        takeWhile((jobs) => hasActiveJobs(jobs), true),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: (error: unknown) => {
          this.errorMessage.set(this.transcriptionService.getFriendlyErrorMessage(error));
          this.isLoading.set(false);
          this.stopPolling();
        },
        complete: () => {
          this.stopPolling();
        },
      });
  }

  private stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = undefined;
  }
}
