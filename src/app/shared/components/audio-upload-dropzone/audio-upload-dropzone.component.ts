import { isPlatformBrowser } from '@angular/common';
import { Component, computed, ElementRef, inject, output, PLATFORM_ID, signal, viewChild } from '@angular/core';
import { FileUploadValue } from '../../../core/models/transcription.models';
import { formatDuration, formatFileSize } from '../../../core/utils/formatters';

const ALLOWED_EXTENSIONS = ['mp3', 'wav', 'm4a', 'ogg', 'webm', 'mp4'] as const;
const HEAVY_FILE_WARNING_BYTES = 800 * 1024 * 1024;

@Component({
  selector: 'app-audio-upload-dropzone',
  template: `
    <div
      class="rounded-xl border-2 border-dashed bg-white p-6 text-center transition"
      [class.border-indigo-400]="isDragging()"
      [class.bg-indigo-50]="isDragging()"
      [class.border-slate-300]="!isDragging()"
      tabindex="0"
      role="button"
      aria-label="Seleccionar archivo de audio"
      (click)="openFilePicker()"
      (keydown.enter)="openFilePicker()"
      (keydown.space)="openFilePicker(); $event.preventDefault()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <input
        #fileInput
        class="hidden"
        type="file"
        accept=".mp3,.wav,.m4a,.ogg,.webm,.mp4,audio/*,video/mp4"
        (change)="onFileInputChange($event)"
      />

      <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600" aria-hidden="true">
        <svg viewBox="0 0 24 24" class="h-7 w-7" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 16V4m0 0 4 4m-4-4-4 4" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M20 16.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2.5" stroke-linecap="round" />
        </svg>
      </div>

      <h2 class="mt-4 text-base font-semibold text-slate-950">Arrastra tu audio o seleccionalo</h2>
      <p class="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Formatos soportados: MP3, WAV, M4A, OGG, WEBM y MP4. El navegador solo selecciona el archivo; el procesamiento pesado se realizará en el backend.
      </p>
      <p class="mt-2 text-sm text-slate-500">Los audios largos pueden tardar varios minutos en procesarse.</p>

      @if (errorMessage()) {
        <p class="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700" role="alert">{{ errorMessage() }}</p>
      }

      @if (selectedFile()) {
        <div class="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-left">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="font-semibold text-slate-950">{{ selectedFile()?.name }}</p>
              <p class="mt-1 text-sm text-slate-500">
                {{ fileSizeLabel() }} · Duración: {{ durationLabel() }}
              </p>
            </div>
            <button
              type="button"
              class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
              (click)="clear($event)"
            >
              Quitar
            </button>
          </div>

          @if (heavyFileWarning()) {
            <p class="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Archivo grande detectado. Es válido para audios largos, pero la subida y el procesamiento pueden demorar.
            </p>
          }
        </div>
      }
    </div>
  `,
})
export class AudioUploadDropzoneComponent {
  readonly fileSelected = output<FileUploadValue | null>();

  private readonly platformId = inject(PLATFORM_ID);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly isDragging = signal(false);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly durationSeconds = signal<number | undefined>(undefined);
  protected readonly errorMessage = signal('');

  protected readonly fileSizeLabel = computed(() => {
    const file = this.selectedFile();
    return file ? formatFileSize(file.size) : '';
  });

  protected readonly durationLabel = computed(() => formatDuration(this.durationSeconds()));

  protected readonly heavyFileWarning = computed(() => {
    const file = this.selectedFile();
    const duration = this.durationSeconds();
    return Boolean(file && (file.size > HEAVY_FILE_WARNING_BYTES || (duration !== undefined && duration > 4 * 60 * 60)));
  });

  protected openFilePicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files.item(0);

    if (file) {
      void this.setFile(file);
    }
  }

  protected onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);

    if (file) {
      void this.setFile(file);
    }
  }

  protected clear(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.durationSeconds.set(undefined);
    this.errorMessage.set('');
    this.fileSelected.emit(null);

    const input = this.fileInput()?.nativeElement;
    if (input) {
      input.value = '';
    }
  }

  private async setFile(file: File): Promise<void> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (!extension || !ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number])) {
      this.errorMessage.set('Formato no soportado. Usa MP3, WAV, M4A, OGG, WEBM o MP4.');
      this.fileSelected.emit(null);
      return;
    }

    this.errorMessage.set('');
    this.selectedFile.set(file);
    const duration = await this.detectDuration(file);
    this.durationSeconds.set(duration);
    this.fileSelected.emit({ file, durationSeconds: duration });
  }

  private detectDuration(file: File): Promise<number | undefined> {
    if (!isPlatformBrowser(this.platformId) || typeof Audio === 'undefined') {
      return Promise.resolve(undefined);
    }

    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);

      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(Number.isFinite(audio.duration) ? audio.duration : undefined);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(undefined);
      };
      audio.src = url;
    });
  }
}
