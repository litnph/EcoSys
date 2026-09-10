import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/utils";

export function SlowNetworkHint({ className, delayMs = 7000 }: { className?: string; delayMs?: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), delayMs);
    return () => window.clearTimeout(id);
  }, [delayMs]);

  if (!visible) return null;

  return (
    <p
      role="status"
      aria-live="polite"
      className={cn("flex items-center gap-2 text-sm text-warm-600", className)}
    >
      <Clock3 className="size-4 shrink-0 text-warning" aria-hidden />
      Kết nối đang chậm. EcoSys vẫn tiếp tục tải và sẽ giữ nguyên dữ liệu bạn đã nhập.
    </p>
  );
}
