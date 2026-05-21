export interface FileAttachment {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  isPublic: boolean;
  createdAtUtc: string;
  signedUrl?: string;
}

export interface SignedFileUrl {
  url: string;
  expiresAtUtc: string;
}
