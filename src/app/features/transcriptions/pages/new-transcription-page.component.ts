import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  CreateTranscriptionPayload,
  FileUploadValue,
  TranscriptionLanguage,
  TranscriptionModel,
} from '../../../core/models/transcription.models';
import { TranscriptionService } from '../../../core/services/transcription.service';
import { AudioUploadDropzoneComponent } from '../../../shared/components/audio-upload-dropzone/audio-upload-dropzone.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-new-transcription-page',
  imports: [ReactiveFormsModule, PageHeaderComponent, AudioUploadDropzoneComponent, ProgressBarComponent],
  template: `
    <app-page-header
      eyebrow="Nuevo trabajo"
      title="Crear transcripción"
      description="Seleccioná el archivo y la configuración. El backend recibirá el audio y procesará la transcripción en segundo plano."
    />

    <form class="grid gap-6 lg:grid-cols-[1fr_0.75fr]" [formGroup]="form" (ngSubmit)="submit()">
      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="grid gap-5">
          <div>
            <label for="title" class="block text-sm font-semibold text-slate-800">Título de la transcripción</label>
            <input
              id="title"
              type="text"
              formControlName="title"
              class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500"
              placeholder="Ej: Entrevista con cliente"
            />
            @if (titleInvalid()) {
              <p class="mt-2 text-sm text-rose-600">El título es obligatorio.</p>
            }
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label for="language" class="block text-sm font-semibold text-slate-800">Idioma</label>
              <select id="language" formControlName="language" class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 shadow-sm">
                <option value="auto">Automático</option>
                <option value="es">Español</option>
                <option value="en">Inglés</option>
                <option value="pt">Portugués</option>
              </select>
            </div>

            <div>
              <label for="model" class="block text-sm font-semibold text-slate-800">Modelo</label>
              <select id="model" formControlName="model" class="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 shadow-sm">
                <option value="economy">Económico</option>
                <option value="high_accuracy">Alta precisión</option>
              </select>
            </div>
          </div>

          <div class="grid gap-3">
            <label class="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
              <input type="checkbox" formControlName="fixPunctuation" class="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600" />
              <span>
                <span class="block text-sm font-semibold text-slate-800">Corregir puntuación automáticamente</span>
                <span class="mt-1 block text-sm text-slate-500">Mejora la legibilidad del texto final.</span>
              </span>
            </label>

            <label class="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
              <input type="checkbox" formControlName="generateSummary" class="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600" />
              <span>
                <span class="block text-sm font-semibold text-slate-800">Generar resumen</span>
                <span class="mt-1 block text-sm text-slate-500">Incluye una síntesis editable cuando el trabajo finalice.</span>
              </span>
            </label>
          </div>
        </div>
      </section>

      <aside class="space-y-6">
        <app-audio-upload-dropzone (fileSelected)="onFileSelected($event)" />
        @if (fileMissing()) {
          <p class="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">Seleccioná un archivo de audio para continuar.</p>
        }
        @if (errorMessage()) {
          <p class="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" role="alert">{{ errorMessage() }}</p>
        }

        <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 class="font-semibold text-slate-950">Antes de crear</h2>
          <p class="mt-2 text-sm leading-6 text-slate-600">
            Podés subir audios de 4 horas o más. La subida prepara el trabajo; la transcripción continuará en segundo plano.
          </p>

          @if (isSubmitting()) {
            <div class="mt-5 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
              <app-progress-bar [progress]="uploadProgress()" [label]="uploadLabel()" />
              <p class="mt-3 text-sm text-indigo-900">
                Este progreso corresponde solo a la carga del archivo al backend.
              </p>
            </div>
          }

          <button
            type="submit"
            class="mt-5 inline-flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            [disabled]="isSubmitting()"
          >
            {{ isSubmitting() ? 'Subiendo archivo...' : 'Crear transcripción' }}
          </button>
        </div>
      </aside>
    </form>
  `,
})
export class NewTranscriptionPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly transcriptionService = inject(TranscriptionService);

  protected readonly selectedFile = signal<FileUploadValue | null>(null);
  protected readonly attemptedSubmit = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly uploadProgress = signal(0);
  protected readonly uploadLabel = computed(() =>
    this.uploadProgress() >= 100 ? 'Archivo recibido' : 'Subiendo archivo...',
  );

  protected readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    language: this.fb.control<TranscriptionLanguage>('auto'),
    model: this.fb.control<TranscriptionModel>('economy'),
    fixPunctuation: true,
    generateSummary: true,
  });

  protected readonly titleInvalid = computed(() => {
    const control = this.form.controls.title;
    return control.invalid && (control.touched || this.attemptedSubmit());
  });

  protected readonly fileMissing = computed(() => this.attemptedSubmit() && !this.selectedFile());

  protected onFileSelected(value: FileUploadValue | null): void {
    this.selectedFile.set(value);
  }

  protected submit(): void {
    this.attemptedSubmit.set(true);
    this.errorMessage.set('');
    this.uploadProgress.set(0);
    this.form.markAllAsTouched();

    const upload = this.selectedFile();
    if (this.form.invalid || !upload) {
      return;
    }

    this.isSubmitting.set(true);
    const payload: CreateTranscriptionPayload = {
      ...this.form.getRawValue(),
      file: upload.file,
    };

    this.transcriptionService
      .createTranscriptionWithUploadProgress(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          if (event.type === 'uploading') {
            this.uploadProgress.set(event.progress);
            return;
          }

          this.uploadProgress.set(100);
          void this.router.navigate(['/transcriptions', event.job.id]);
        },
        error: (error: unknown) => {
          this.errorMessage.set(this.transcriptionService.getFriendlyErrorMessage(error));
          this.isSubmitting.set(false);
          this.uploadProgress.set(0);
        },
      });
  }
}
