import { Link } from "@/i18n/navigation";

import { ROUTES } from "@/config/routes";

export default function ChangeEmailPage() {
  return (
    <div className="rounded-card border border-warm-200 bg-surface p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-warm-900">Đổi email</h2>
      <p className="mt-2 text-sm text-warm-600">
        Luồng xác minh email mới sẽ được mở tại đây (xác nhận qua liên kết gửi về hộp thư).
      </p>
      <p className="mt-4 text-sm text-warm-600">
        Hiện tại vui lòng liên hệ quản trị hoàn tất thay đổi email nếu bạn cần hỗ trợ gấp.
      </p>
      <Link
        href={ROUTES.dashboard.settingsProfile}
        className="mt-6 inline-block text-sm font-medium text-accent hover:underline"
      >
        ← Quay lại hồ sơ
      </Link>
    </div>
  );
}
