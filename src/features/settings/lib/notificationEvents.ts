export type NotificationEventMeta = {
  eventType: string;
  label: string;
};

export const NOTIFICATION_MATRIX_EVENTS: NotificationEventMeta[] = [
  { eventType: "billing_due", label: "Đến hạn thanh toán (billing)" },
  { eventType: "installment_due", label: "Đến hạn trả góp" },
  { eventType: "debt_due", label: "Đến hạn nợ" },
  { eventType: "report_ready", label: "Báo cáo đã sẵn sàng" },
  { eventType: "billing_cycle_overdue", label: "Quá hạn chu kỳ thanh toán" },
  { eventType: "monthly_period_closed", label: "Đã khóa kỳ tháng" },
];
