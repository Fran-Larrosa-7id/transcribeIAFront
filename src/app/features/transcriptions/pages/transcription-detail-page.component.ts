import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, inject, PLATFORM_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, switchMap, takeWhile, timer } from 'rxjs';
import { TranscriptDownloadFormat, TranscriptionJob } from '../../../core/models/transcription.models';
import { TranscriptionService } from '../../../core/services/transcription.service';
import { formatDate, formatDuration, formatFileSize } from '../../../core/utils/formatters';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { TranscriptionStatusBadgeComponent } from '../../../shared/components/transcription-status-badge/transcription-status-badge.component';
import { TranscriptionStepperComponent } from '../../../shared/components/transcription-stepper/transcription-stepper.component';

@Component({
  selector: 'app-transcription-detail-page',
  imports: [
    RouterLink,
    PageHeaderComponent,
    ProgressBarComponent,
    TranscriptionStatusBadgeComponent,
    TranscriptionStepperComponent,
    LoadingStateComponent,
    EmptyStateComponent,
  ],
  template: `
    @if (job(); as currentJob) {
      <app-page-header
        eyebrow="Detalle"
        [title]="currentJob.title"
        description="Estado del trabajo, progreso y resultado de la transcripción."
        actionLabel="Volver al historial"
        actionLink="/transcriptions"
      />

      <div class="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <aside class="space-y-6">
          <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <h2 class="text-lg font-semibold text-slate-950">Información</h2>
                <p class="mt-1 text-sm text-slate-500">{{ currentJob.originalFilename }}</p>
              </div>
              <div class="shrink-0">
                <app-transcription-status-badge [status]="currentJob.status" />
              </div>
            </div>

            <dl class="mt-6 grid gap-4 text-sm">
              <div class="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <dt class="text-slate-500">Archivo</dt>
                <dd class="text-right font-medium text-slate-800">{{ formatFileSize(currentJob.fileSize) }}</dd>
              </div>
              <div class="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <dt class="text-slate-500">Duración</dt>
                <dd class="text-right font-medium text-slate-800">{{ formatDuration(currentJob.durationSeconds) }}</dd>
              </div>
              <div class="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <dt class="text-slate-500">Idioma</dt>
                <dd class="text-right font-medium text-slate-800">{{ languageLabel(currentJob.language) }}</dd>
              </div>
              <div class="flex justify-between gap-4 border-b border-slate-100 pb-3">
                <dt class="text-slate-500">Modelo</dt>
                <dd class="text-right font-medium text-slate-800">{{ currentJob.model === 'economy' ? 'Económico' : 'Alta precisión' }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt class="text-slate-500">Creada</dt>
                <dd class="text-right font-medium text-slate-800">{{ formatDate(currentJob.createdAt) }}</dd>
              </div>
            </dl>
          </section>

          <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="mb-4 flex items-center justify-between gap-4">
              <h2 class="text-base font-semibold text-slate-950">Progreso</h2>
              <span class="text-sm text-slate-500">{{ currentJob.progress }}%</span>
            </div>
            <app-progress-bar [progress]="currentJob.progress" label="Progreso general" />
            <p class="mt-4 text-sm leading-6 text-slate-600">
              El progreso se actualiza automáticamente. Podés cerrar esta pantalla y volver más tarde desde el historial.
            </p>
          </section>
        </aside>

        <section class="space-y-6">
          @if (actionMessage()) {
            <p class="rounded-lg bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700" role="status">{{ actionMessage() }}</p>
          }
          @if (errorMessage()) {
            <p class="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{{ errorMessage() }}</p>
          }

          @switch (currentJob.status) {
            @case ('completed') {
              <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div class="max-w-2xl">
                    <h2 class="text-lg font-semibold text-slate-950">Transcripción final</h2>
                    <p class="mt-2 text-sm leading-6 text-slate-600">
                      El trabajo finalizó correctamente. Ya podés revisar, copiar o descargar el resultado.
                    </p>
                  </div>
                  <button
                    type="button"
                    class="inline-flex shrink-0 justify-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    (click)="copy(currentJob.transcriptText ?? '')"
                  >
                    {{ copied() ? 'Copiado' : 'Copiar texto' }}
                  </button>
                </div>

                @if (currentJob.summary) {
                  <aside class="mt-6 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                    <h3 class="text-sm font-semibold text-indigo-950">Resumen</h3>
                    <p class="mt-2 text-sm leading-6 text-indigo-900">{{ summaryText(currentJob.summary) }}</p>
                  </aside>
                }

                <div class="mt-6 max-h-[34rem] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-800 shadow-inner whitespace-pre-line">
                  {{ transcriptText(currentJob.transcriptText) }}
                </div>

                <div class="mt-6">
                  <h3 class="text-sm font-semibold text-slate-950">Descargas</h3>
                  <div class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    @for (format of downloadFormats; track format) {
                      <button
                        type="button"
                        class="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold uppercase text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        [disabled]="isDownloading()"
                        (click)="download(currentJob.id, format)"
                      >
                        {{ format }}
                      </button>
                    }
                  </div>
                </div>
              </section>
            }
            @case ('failed') {
              <section class="rounded-2xl border border-rose-200 bg-rose-50 p-6">
                <h2 class="text-lg font-semibold text-rose-950">No pudimos completar la transcripción</h2>
                <p class="mt-2 text-sm leading-6 text-rose-800">{{ currentJob.errorMessage }}</p>
                <button
                  type="button"
                  class="mt-5 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                  (click)="retry(currentJob.id)"
                  [disabled]="isRetrying()"
                >
                  {{ isRetrying() ? 'Reintentando...' : 'Reintentar' }}
                </button>
              </section>
            }
            @default {
              <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 class="text-lg font-semibold text-slate-950">Procesamiento en curso</h2>
                <p class="mt-2 text-sm leading-6 text-slate-600">
                  El archivo ya fue recibido. Estamos procesando la transcripción en segundo plano.
                </p>
                <p class="mt-2 text-sm leading-6 text-slate-600">
                  Podés cerrar esta pantalla y volver más tarde desde el historial.
                </p>
                <div class="mt-6">
                  <app-transcription-stepper [status]="currentJob.status" [progress]="currentJob.progress" />
                </div>
              </section>
            }
          }
        </section>
      </div>
    } @else if (errorMessage()) {
      <section class="rounded-xl border border-rose-200 bg-rose-50 p-6">
        <h2 class="font-semibold text-rose-950">No pudimos cargar la transcripción</h2>
        <p class="mt-2 text-sm leading-6 text-rose-800">{{ errorMessage() }}</p>
        <a
          routerLink="/transcriptions"
          class="mt-4 inline-flex rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
        >
          Volver al historial
        </a>
      </section>
    } @else if (!isLoading()) {
      <app-empty-state
        title="Transcripción no encontrada"
        description="El trabajo solicitado no existe o fue removido."
        actionLabel="Volver al historial"
        actionLink="/transcriptions"
      />
    } @else {
      <app-loading-state label="Cargando transcripción..." />
    }
  `,
})
export class TranscriptionDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly transcriptionService = inject(TranscriptionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private pollingSubscription?: Subscription;

  protected readonly copied = signal(false);
  protected readonly isLoading = signal(true);
  protected readonly isRetrying = signal(false);
  protected readonly isDownloading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly actionMessage = signal('');
  protected readonly job = signal<TranscriptionJob | undefined>(undefined);
  protected readonly downloadFormats: TranscriptDownloadFormat[] = ['txt', 'docx', 'pdf', 'srt'];

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id');

      if (id) {
        this.loadJob(id);
      }
    });
  }

  protected async copy(text: string): Promise<void> {
    await this.transcriptionService.copyTranscript(text);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1600);
  }

  protected download(id: string, format: TranscriptDownloadFormat): void {
    this.actionMessage.set('');
    this.errorMessage.set('');

    if (format !== 'txt') {
      this.actionMessage.set('La exportación en este formato estará disponible pronto.');
      return;
    }

    this.isDownloading.set(true);
    this.transcriptionService
      .downloadTranscript(id, format)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.saveBlob(blob, this.downloadFilename());
          this.isDownloading.set(false);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.transcriptionService.getFriendlyErrorMessage(error));
          this.isDownloading.set(false);
        },
      });
  }

  protected retry(id: string): void {
    this.isRetrying.set(true);
    this.errorMessage.set('');
    this.actionMessage.set('');

    this.transcriptionService
      .retryTranscription(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (job) => {
          this.job.set(job);
          this.isRetrying.set(false);
          this.startPolling(job);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.transcriptionService.getFriendlyErrorMessage(error));
          this.isRetrying.set(false);
        },
      });
  }

  protected languageLabel(language: string): string {
    const labels: Record<string, string> = {
      auto: 'Automático',
      es: 'Español',
      en: 'Inglés',
      pt: 'Portugués',
    };

    return labels[language] ?? language;
  }

  protected readonly formatDate = formatDate;
  protected readonly formatDuration = formatDuration;
  protected readonly formatFileSize = formatFileSize;

  protected summaryText(summary: string): string {
    const normalized = summary.trim().toLowerCase();

    if (normalized.includes('mock') || normalized.includes('prueba')) {
      return 'Resumen generado en modo de prueba.';
    }

    return summary;
  }

  protected transcriptText(text: string | null | undefined): string {
    const fallback =
      'Esta es una transcripción de prueba generada automáticamente para validar el flujo de carga, procesamiento y descarga del archivo.';

    if (!text?.trim()) {
      return fallback;
    }

    return text.toLowerCase().includes('mock') ? fallback : text;
  }

  private loadJob(id: string): void {
    this.stopPolling();
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.actionMessage.set('');
    this.job.set(undefined);

    this.transcriptionService
      .getTranscriptionById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (job) => {
          this.job.set(job);
          this.isLoading.set(false);
          this.startPolling(job);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.transcriptionService.getFriendlyErrorMessage(error));
          this.isLoading.set(false);
        },
      });
  }

  private startPolling(job: TranscriptionJob): void {
    this.stopPolling();

    if (job.status === 'completed' || job.status === 'failed') {
      return;
    }

    this.pollingSubscription = timer(3000, 3000)
      .pipe(
        switchMap(() => this.transcriptionService.getTranscriptionStatus(job.id)),
        takeWhile((updatedJob) => updatedJob.status !== 'completed' && updatedJob.status !== 'failed', true),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updatedJob) => {
          this.job.set(updatedJob);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.transcriptionService.getFriendlyErrorMessage(error));
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

  private downloadFilename(): string {
    const title = this.job()?.title.trim() || 'transcription';
    return `${title.replace(/[^\w-]+/g, '-').replace(/-+/g, '-').toLowerCase()}.txt`;
  }

  private saveBlob(blob: Blob, filename: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const url = URL.createObjectURL(blob);
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
