export interface DataExportStatus {
  id: string;
  status: string;
  downloadUrl: string | null;
  sizeBytes: number | null;
  expiresAt: string | null;
  processedAt: string | null;
  readyAt: string | null;
  errorMessage: string | null;
}
