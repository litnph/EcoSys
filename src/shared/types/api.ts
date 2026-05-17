export interface ApiError {
  code?: string;
  message?: string;
  messages?: string[];
  details?: unknown;
}

export interface PaginationMeta {
  totalCount: number;
  totalPages: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}
