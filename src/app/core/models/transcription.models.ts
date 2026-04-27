export type TranscriptionStatus =
  | 'pending'
  | 'uploading'
  | 'processing_audio'
  | 'transcribing'
  | 'merging'
  | 'completed'
  | 'failed';

export type TranscriptionLanguage = 'auto' | 'es' | 'en' | 'pt';

export type TranscriptionModel = 'economy' | 'high_accuracy';

export type TranscriptDownloadFormat = 'txt' | 'docx' | 'pdf' | 'srt';

export interface TranscriptionJob {
  id: string;
  title: string;
  originalFilename: string;
  fileSize: number;
  durationSeconds?: number | null;
  language: TranscriptionLanguage;
  model: TranscriptionModel;
  status: TranscriptionStatus;
  progress: number;
  createdAt: string;
  finishedAt?: string | null;
  transcriptText?: string | null;
  summary?: string | null;
  errorMessage?: string | null;
}

export interface CreateTranscriptionPayload {
  title: string;
  language: TranscriptionLanguage;
  model: TranscriptionModel;
  fixPunctuation: boolean;
  generateSummary: boolean;
  file: File;
}

export type CreateTranscriptionUploadEvent =
  | { type: 'uploading'; progress: number }
  | { type: 'created'; job: TranscriptionJob };

export interface FileUploadValue {
  file: File;
  durationSeconds?: number;
}
