"use client";

import { useWorkspaceStore } from "@/shared/stores/workspaceStore";

/**
 * Trả về `currentSmoduleId` từ workspace store. Đây là alias cho các page
 * Finance đang dùng hook cũ — nó **không** redirect (vì các page đã tự xử lý
 * trạng thái thiếu module hoặc đã được bọc bởi `RequireWorkspace` gate).
 *
 * Page mới nên dùng `useSmoduleId()` để tự động redirect onboarding khi
 * thiếu workspace.
 *
 * @deprecated Sử dụng `useSmoduleId` thay vì hook này cho code mới.
 */
export function useFinanceSmoduleId(): string {
  const id = useWorkspaceStore((s) => s.currentSmoduleId);
  return id?.trim() ?? "";
}
