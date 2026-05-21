import { SkeletonText, SkeletonTitle } from "@/shared/components/ui/Skeleton";

/** Instant shell while the next dashboard route chunk loads. */
export default function DashboardLoading() {
  return (
    <div
      className="w-full max-w-[1400px] animate-pulse space-y-6 pb-8"
      aria-busy="true"
      aria-label="Đang tải trang"
    >
      <div className="space-y-2">
        <SkeletonTitle className="h-8 w-48 max-w-full" />
        <SkeletonText className="h-4 w-72 max-w-full" />
      </div>
      <SkeletonText className="h-[120px] w-full rounded-card" />
      <SkeletonText className="h-[360px] w-full rounded-card" />
    </div>
  );
}
