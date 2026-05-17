import axios from "axios";

import type { ApiResponse } from "@/shared/types/api";
import { resolveApiUserMessage } from "@/shared/lib/errorMessages";

export function getFinanceApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiResponse<unknown> | undefined;
    if (payload !== undefined) {
      const mapped = resolveApiUserMessage(payload);
      if (mapped) return mapped;
    }
    if (typeof error.message === "string" && error.message.length > 0) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Đã có lỗi xảy ra";
}
