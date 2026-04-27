import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpEventType } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { filter, map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateTranscriptionPayload,
  CreateTranscriptionUploadEvent,
  TranscriptionJobStatus,
  TranscriptDownloadFormat,
  TranscriptionJob,
} from '../models/transcription.models';

@Injectable({ providedIn: 'root' })
export class TranscriptionService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly apiUrl = environment.apiUrl;

  createTranscription(payload: CreateTranscriptionPayload): Observable<TranscriptionJob> {
    return this.http.post<TranscriptionJob>(`${this.apiUrl}/transcriptions`, this.buildCreateFormData(payload));
  }

  createTranscriptionWithUploadProgress(
    payload: CreateTranscriptionPayload,
  ): Observable<CreateTranscriptionUploadEvent> {
    return this.http
      .post<TranscriptionJob>(`${this.apiUrl}/transcriptions`, this.buildCreateFormData(payload), {
        observe: 'events',
        reportProgress: true,
      })
      .pipe(
        filter((event) => event.type === HttpEventType.UploadProgress || event.type === HttpEventType.Response),
        map((event): CreateTranscriptionUploadEvent => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
            return { type: 'uploading', progress };
          }

          return { type: 'created', job: event.body as TranscriptionJob };
        }),
      );
  }

  getTranscriptions(): Observable<TranscriptionJob[]> {
    return this.http.get<TranscriptionJob[]>(`${this.apiUrl}/transcriptions`);
  }

  getTranscriptionById(id: string): Observable<TranscriptionJob> {
    return this.http.get<TranscriptionJob>(`${this.apiUrl}/transcriptions/${encodeURIComponent(id)}`);
  }

  getTranscriptionStatus(id: string): Observable<TranscriptionJobStatus> {
    return this.http.get<TranscriptionJobStatus>(`${this.apiUrl}/transcriptions/${encodeURIComponent(id)}/status`);
  }

  /**
   * Development-only endpoint kept for local backend experiments.
   * The BullMQ flow polls getTranscriptionStatus/getTranscriptionById instead.
   */
  simulateProgress(id: string): Observable<TranscriptionJob> {
    return this.http.patch<TranscriptionJob>(
      `${this.apiUrl}/transcriptions/${encodeURIComponent(id)}/simulate-progress`,
      {},
    );
  }

  retryTranscription(id: string): Observable<TranscriptionJob> {
    return this.http.patch<TranscriptionJob>(
      `${this.apiUrl}/transcriptions/${encodeURIComponent(id)}/retry`,
      {},
    );
  }

  downloadTranscript(id: string, format: TranscriptDownloadFormat): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/transcriptions/${encodeURIComponent(id)}/download`, {
      params: { format },
      responseType: 'blob',
    });
  }

  async copyTranscript(text: string): Promise<void> {
    if (isPlatformBrowser(this.platformId) && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  }

  getFriendlyErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Ocurrió un error inesperado. Probá nuevamente en unos minutos.';
    }

    if (error.status === 0) {
      return 'No pudimos conectar con el backend. Verificá que NestJS esté corriendo en localhost:3000.';
    }

    if (error.status === 404) {
      return 'No encontramos esta transcripción. Puede haber sido eliminada o el enlace ya no es válido.';
    }

    if (error.status === 413) {
      return 'El archivo es demasiado grande para la configuración actual del servidor.';
    }

    if (error.status === 400 || error.status === 415) {
      return 'El archivo o los datos enviados no son válidos. Revisá el formato e intentá nuevamente.';
    }

    if (error.status >= 500) {
      return 'El servidor tuvo un problema procesando la solicitud. Intentá nuevamente en unos minutos.';
    }

    return 'No pudimos completar la acción. Revisá los datos e intentá nuevamente.';
  }

  private buildCreateFormData(payload: CreateTranscriptionPayload): FormData {
    const formData = new FormData();
    formData.append('title', payload.title);
    formData.append('language', payload.language);
    formData.append('model', payload.model);
    formData.append('fixPunctuation', String(payload.fixPunctuation));
    formData.append('generateSummary', String(payload.generateSummary));
    formData.append('file', payload.file);

    return formData;
  }
}
