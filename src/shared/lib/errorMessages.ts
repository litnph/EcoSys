import type { ApiResponse } from "@/shared/types/api";

/** Semantic codes (API hiện tại hoặc tương lai); map sang tiếng Việt thân thiện. */
export const API_ERROR_CODE_MESSAGES_VI: Record<string, string> = {
  INSUFFICIENT_BALANCE: "Số dư không đủ",
  INSUFFICIENT_FUNDS: "Số dư không đủ",
  BILLING_CYCLE_CLOSED:
    "Kỳ sao kê đã đóng, không thể thêm giao dịch",
  BILLING_CYCLE_NOT_OPEN: "Kỳ sao kê không đang mở cho thẻ này",
  SOURCE_ARCHIVED: "Nguồn đã lưu trữ, không thể ghi giao dịch",
  SOURCE_UNAVAILABLE: "Nguồn tài chính không khả dụng",
  CATEGORY_REQUIRED: "Danh mục là bắt buộc với loại giao dịch này",
  SPLITS_REQUIRED: "Giao dịch chia bill cần ít nhất một khoản chia",
  TRANSFER_COUNTERPART_MISSING: "Thiếu hoặc không nhất quán giao dịch chuyển khoản đối ứng",
  TRANSFER_CURRENCY_MISMATCH:
    "Hai nguồn phải cùng loại tiền khi chuyển khoản",
  INSTALLMENT_INVALID_AMOUNT: "Số tiền trả góp không hợp lệ",
  INSTALLMENT_NOT_DUE: "Kỳ trả góp chưa đến hạn hoặc không thể thanh toán",
  DEBT_HAS_MOVEMENTS: "Không xóa được khoản đã có lịch sử thu nợ/trả nợ",
  VALIDATION_ERROR: "Dữ liệu không hợp lệ",
  VALIDATION_FAILED: "Dữ liệu không hợp lệ",
  NOT_FOUND: "Không tìm thấy dữ liệu",
  UNAUTHORIZED: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn",
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này",
  BUSINESS_RULE: "Thao tác không thỏa điều kiện nghiệp vụ",
  INTERNAL_ERROR: "Đã có lỗi xảy ra, vui lòng thử lại sau",
};

/** Chuẩn hóa message tiếng Anh từ backend → tiếng Việt (middleware trả `messages[]`). */
export const API_ERROR_MESSAGE_HINTS_VI: Array<{ match: RegExp; vi: string }> = [
  {
    match: /Insufficient balance on the (selected source|payment source)/i,
    vi: "Số dư không đủ",
  },
  {
    match: /Insufficient balance on the linked financial source/i,
    vi: "Số dư không đủ",
  },
  {
    match: /Billing cycle is not open/i,
    vi: "Kỳ sao kê không đang mở cho thẻ này",
  },
  {
    match: /Không có kỳ sao kê đang mở/i,
    vi: "Không có kỳ sao kê đang mở cho thẻ này",
  },
  {
    match: /Deferred transactions require a credit card source/i,
    vi: "Giao dịch trả sau cần nguồn là thẻ tín dụng",
  },
  {
    match: /billing cycle must be closed or overdue/i,
    vi: "Chỉ có thể thanh toán kỳ đã đóng hoặc quá hạn",
  },
  {
    match: /Amount cannot exceed the remaining balance/i,
    vi: "Số tiền vượt quá dư nợ còn lại của kỳ",
  },
  {
    match: /archived and cannot receive new transactions/i,
    vi: "Nguồn đã lưu trữ, không thể ghi giao dịch",
  },
  {
    match: /financial source is not available/i,
    vi: "Nguồn tài chính không khả dụng",
  },
  {
    match: /payment source currency must match/i,
    vi: "Tiền tệ nguồn thanh toán phải trùng với tiền tệ yêu cầu",
  },
  {
    match: /Both sources must use the same currency/i,
    vi: "Hai nguồn phải cùng loại tiền khi chuyển khoản",
  },
  {
    match: /Category is required/i,
    vi: "Danh mục là bắt buộc với loại giao dịch này",
  },
  {
    match: /Splits are required/i,
    vi: "Giao dịch chia bill cần ít nhất một khoản chia",
  },
  {
    match: /Cannot delete a debt record that already has repayment/i,
    vi: "Không xóa được khoản đã có lịch sử thu nợ/trả nợ",
  },
  {
    match: /unexpected error occurred/i,
    vi: "Đã có lỗi xảy ra, vui lòng thử lại sau",
  },
];

type LooseApiError = {
  code?: string;
  message?: string;
  messages?: unknown;
};

function normalizeMessages(raw: unknown): string[] {
  if (raw === null || raw === undefined) return [];
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === "string" && x.length > 0);
  }
  if (typeof raw === "string" && raw.length > 0) return [raw];
  return [];
}

function hintViForEnglish(text: string): string | undefined {
  const t = text.trim();
  if (!t) return undefined;
  for (const { match, vi } of API_ERROR_MESSAGE_HINTS_VI) {
    if (match.test(t)) return vi;
  }
  return undefined;
}

/** Đọc error object trong envelope API (nhiều kiểu tương thích). */
export function parseApiErrorPayload(root: unknown): LooseApiError | null {
  if (root === null || typeof root !== "object") return null;
  const r = root as Record<string, unknown>;
  const err = r.error;
  if (err === null || typeof err !== "object") return null;
  return err as LooseApiError;
}

/** Message hiển thị cho người dùng từ body `{ success, error }`. */
export function getFailureMessageFromApiBody(body: unknown): string {
  const err = parseApiErrorPayload(body);
  if (!err) return "Yêu cầu thất bại";

  const codeRaw = typeof err.code === "string" ? err.code.trim() : "";
  const upperCode = codeRaw.toUpperCase().replace(/-/g, "_");

  if (upperCode && API_ERROR_CODE_MESSAGES_VI[upperCode]) {
    return API_ERROR_CODE_MESSAGES_VI[upperCode];
  }
  if (codeRaw && API_ERROR_CODE_MESSAGES_VI[codeRaw]) {
    return API_ERROR_CODE_MESSAGES_VI[codeRaw];
  }

  const fromMessages = normalizeMessages(err.messages);
  if (fromMessages.length > 0) {
    const hinted = fromMessages.map((m) => hintViForEnglish(m) ?? m);
    return hinted.join(" ");
  }

  if (typeof err.message === "string" && err.message.trim().length > 0) {
    return hintViForEnglish(err.message) ?? err.message;
  }

  return "Yêu cầu thất bại";
}

/** Ưu tiên map theo code/message từ response JSON (axios `response.data`). */
export function resolveApiUserMessage(responseData: unknown): string | null {
  if (responseData === null || typeof responseData !== "object") return null;
  const body = responseData as Partial<ApiResponse<unknown>>;
  if (body.success !== false && body.error === undefined) return null;
  const msg = getFailureMessageFromApiBody(body);
  return msg.length > 0 ? msg : null;
}
