export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  role: "admin" | "editor" | "transcriber" | "viewer";
  is_active: boolean;
  created_at: string;
}

export interface Missionary {
  id: string;
  name: string;
  slug: string;
  birth_year?: number;
  death_year?: number;
  nationality?: string;
  denomination?: string;
  mission_society?: string;
  region?: string;
  biography?: string;
  notes?: string;
  created_at: string;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface DocumentImage {
  id: string;
  page_number: number;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  thumbnail_path?: string;
  file_size?: number;
  width?: number;
  height?: number;
  rotation: number;
  created_at: string;
}

export interface Document {
  id: string;
  reference_number: string;
  title?: string;
  slug: string;
  year: number;
  month?: number;
  language: string;
  document_number: number;
  page_count: number;
  description?: string;
  notes?: string;
  keywords: string[];
  ocr_status: "pending" | "processing" | "completed" | "failed";
  ocr_engine?: string;
  condition?: string;
  missionary?: Missionary;
  genre?: Genre;
  images: DocumentImage[];
  created_at: string;
  updated_at: string;
}

export interface DocumentListItem {
  id: string;
  reference_number: string;
  title?: string;
  year: number;
  language: string;
  ocr_status: string;
  page_count: number;
  missionary?: { id: string; name: string; slug: string };
  genre?: { id: string; name: string; slug: string };
  created_at: string;
}

export interface LineData {
  line: number;
  text: string;
  confidence: number;
  bbox?: [number, number, number, number];
  page?: number;
}

export interface TranscriptionVersion {
  id: string;
  version_number: number;
  text_snapshot?: string;
  change_summary?: string;
  saved_at: string;
}

export interface Transcription {
  id: string;
  document_id: string;
  image_id?: string;
  raw_text?: string;
  corrected_text?: string;
  line_data: LineData[];
  ocr_engine?: string;
  ocr_confidence?: number;
  version: number;
  status: string;
  created_at: string;
  updated_at: string;
  versions: TranscriptionVersion[];
}

export interface OCRJob {
  id: string;
  document_id: string;
  image_id?: string;
  engine: string;
  language: string;
  status: "pending" | "queued" | "processing" | "completed" | "failed";
  progress: number;
  confidence?: number;
  error_message?: string;
  processing_time_ms?: number;
  queued_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface SearchResult {
  total: number;
  skip: number;
  limit: number;
  results: DocumentListItem[];
}

export interface DashboardStats {
  total_documents: number;
  ocr_pending: number;
  ocr_completed: number;
  ocr_failed: number;
  total_transcriptions: number;
  ocr_success_rate: number;
}
