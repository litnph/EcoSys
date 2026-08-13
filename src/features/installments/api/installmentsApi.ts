import type { ApiResponse } from "@/shared/types/api";
import { apiClient } from "@/shared/lib/axios";
import { getFailureMessageFromApiBody } from "@/shared/lib/errorMessages";
import { businessTodayDateOnly } from "../utils/installmentPaySchedule";

import type {
  InstallmentPayLineStatus,
  InstallmentPlan,
  InstallmentPlanListItem,
  InstallmentStatus,
  ConversionFeeStatus,
  CreateInstallmentPlanPayload,
  InstallmentDashboard,
  InstallmentUpcomingPayBucket,
} from "../types";

type ApiEnvelope<T> = ApiResponse<T>;

function assertData<T>(body: ApiEnvelope<T>): asserts body is ApiEnvelope<T> & {
  success: true;
  data: T;
} {
  if (!body.success) {
    throw new Error(getFailureMessageFromApiBody(body));
  }
  if (body.data === null || body.data === undefined) {
    throw new Error("Phản hồi API không hợp lệ");
  }
}

async function unwrap<T>(getter: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const { data: body } = await getter;
  assertData(body);
  return body.data;
}

interface RemotePayDto {
  installmentNumber: number;
  statementDate?: string | null;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: InstallmentPayLineStatus;
  paidAt?: string | null;
  txnId?: string | null;
  canPayDirectly?: boolean | null;
}

interface RemotePlanDetailDto {
  id: string;
  sourceId: string;
  sourceName?: string | null;
  sourceIcon?: string | null;
  sourceColor?: string | null;
  originalTxnId: string;
  originalTxnDescription?: string | null;
  originalTxnCategoryName?: string | null;
  totalAmount: number;
  totalMonths: number;
  monthlyAmount: number;
  interestRate: number;
  conversionFeeRate?: number | null;
  conversionFeeAmount?: number | null;
  conversionFeeStatus?: ConversionFeeStatus | null;
  conversionFeeTxnId?: string | null;
  startDate: string;
  status: InstallmentStatus;
  cancellationReason?: string | null;
  canDelete?: boolean;
  version?: number | null;
  pays?: RemotePayDto[] | null;
}

interface RemoteDetailEnvelope {
  plan: RemotePlanDetailDto;
}

interface RemoteListItemDto {
  id: string;
  sourceId: string;
  sourceName?: string | null;
  sourceIcon?: string | null;
  sourceColor?: string | null;
  originalTxnDescription?: string | null;
  originalTxnCategoryName?: string | null;
  status: InstallmentStatus;
  paidInstallments: number;
  totalInstallments: number;
  remainingAmount: number;
  totalAmount: number;
  canDelete: boolean;
  createdAt: string;
  version?: number | null;
}

interface RemoteDashboardSourceDto {
  sourceId: string;
  sourceName: string;
  sourceIcon?: string | null;
  sourceColor?: string | null;
  activePlanCount: number;
  remainingAmount: number;
  overdueAmount: number;
  thisMonthDueAmount: number;
  nextMonthDueAmount: number;
}

interface RemoteUpcomingPayDto {
  planId: string;
  sourceId: string;
  sourceName: string;
  sourceIcon?: string | null;
  planTitle: string;
  installmentNumber: number;
  totalInstallments: number;
  statementDate?: string | null;
  dueDate: string;
  amount: number;
  bucket: string;
}

interface RemoteDashboardDto {
  activePlanCount: number;
  totalRemainingAmount: number;
  dueCount: number;
  dueAmount: number;
  overdueCount: number;
  overdueAmount: number;
  upcomingCount: number;
  upcomingAmount: number;
  thisMonthDueCount: number;
  thisMonthDueAmount: number;
  nextMonthDueCount: number;
  nextMonthDueAmount: number;
  completionPercent: number;
  bySource?: RemoteDashboardSourceDto[] | null;
  upcomingPays?: RemoteUpcomingPayDto[] | null;
}

interface RemoteDashboardEnvelope {
  dashboard: RemoteDashboardDto;
}

interface RemoteListEnvelope {
  items: RemoteListItemDto[] | null;
}

function mapPay(
  row: RemotePayDto,
  planId: string): InstallmentPlan["pays"][number] {
  return {
    id: `${planId}-${String(row.installmentNumber)}`,
    planId,
    installmentNumber: row.installmentNumber,
    statementDate: row.statementDate?.trim() || row.dueDate,
    dueDate: row.dueDate,
    amount: Number(row.amount),
    paidAmount: Number(row.paidAmount),
    status: row.status,
    paidAt: row.paidAt ?? null,
    linkedTxnId: row.txnId ?? null,
    canPayDirectly:
      row.canPayDirectly ??
      (row.status === "due" || row.status === "overdue"),
  };
}

function mapPlan(dto: RemotePlanDetailDto): InstallmentPlan {
  const pays = (dto.pays ?? []).map((p) => mapPay(p, dto.id));
  return {
    id: dto.id,
    sourceId: dto.sourceId,
    sourceName: dto.sourceName ?? null,
    sourceIcon: dto.sourceIcon ?? null,
    sourceColor: dto.sourceColor ?? null,
    originalTxnId: dto.originalTxnId,
    originalTxnDescription: dto.originalTxnDescription ?? null,
    originalTxnCategoryName: dto.originalTxnCategoryName ?? null,
    totalAmount: Number(dto.totalAmount),
    totalMonths: dto.totalMonths,
    monthlyAmount: Number(dto.monthlyAmount),
    interestRate: Number(dto.interestRate),
    conversionFeeRate:
      dto.conversionFeeRate === null || dto.conversionFeeRate === undefined
        ? null
        : Number(dto.conversionFeeRate),
    conversionFeeAmount:
      dto.conversionFeeAmount === null ||
      dto.conversionFeeAmount === undefined
        ? null
        : Number(dto.conversionFeeAmount),
    conversionFeeStatus: dto.conversionFeeStatus ?? null,
    conversionFeeTxnId: dto.conversionFeeTxnId ?? null,
    startDate: dto.startDate,
    status: dto.status,
    cancellationReason: dto.cancellationReason ?? null,
    canDelete: dto.canDelete ?? false,
    version: dto.version ?? 1,
    pays,
  };
}

function mapListItem(row: RemoteListItemDto): InstallmentPlanListItem {
  return {
    id: row.id,
    sourceId: row.sourceId,
    sourceName: row.sourceName ?? null,
    sourceIcon: row.sourceIcon ?? null,
    sourceColor: row.sourceColor ?? null,
    originalTxnDescription: row.originalTxnDescription ?? null,
    originalTxnCategoryName: row.originalTxnCategoryName ?? null,
    status: row.status,
    paidInstallments: row.paidInstallments,
    totalInstallments: row.totalInstallments,
    remainingAmount: Number(row.remainingAmount),
    totalAmount: Number(row.totalAmount),
    canDelete: row.canDelete,
    createdAt: row.createdAt,
    version: row.version ?? 1,
  };
}

function normalizeUpcomingBucket(raw: string): InstallmentUpcomingPayBucket {
  const map: Record<string, InstallmentUpcomingPayBucket> = {
    overdue: "overdue",
    dueToday: "dueToday",
    thisMonth: "thisMonth",
    nextMonth: "nextMonth",
    later: "later",
  };
  return map[raw] ?? "later";
}

function bucketForDueDate(
  dueDate: string,
  today = businessTodayDateOnly(),
): InstallmentUpcomingPayBucket {
  if (dueDate < today) return "overdue";
  if (dueDate === today) return "dueToday";

  const dueMonth = dueDate.slice(0, 7);
  const todayMonth = today.slice(0, 7);
  if (dueMonth === todayMonth) return "thisMonth";

  const [year, month] = todayMonth.split("-").map(Number);
  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const nextMonth = `${String(nextMonthDate.getUTCFullYear())}-${String(
    nextMonthDate.getUTCMonth() + 1,
  ).padStart(2, "0")}`;
  return dueMonth === nextMonth ? "nextMonth" : "later";
}

const bucketOrder: Record<InstallmentUpcomingPayBucket, number> = {
  overdue: 0,
  dueToday: 1,
  thisMonth: 2,
  nextMonth: 3,
  later: 4,
};

async function loadCompleteUpcomingPays(): Promise<
  InstallmentDashboard["upcomingPays"]
> {
  const plans = await getInstallmentPlans("active");
  const details = await Promise.all(
    plans.map((plan) => getInstallmentPlanDetail(plan.id)),
  );

  return details
    .flatMap((plan) =>
      plan.pays
        .filter((pay) => pay.status !== "paid" && pay.amount > pay.paidAmount)
        .map((pay) => ({
          planId: plan.id,
          sourceId: plan.sourceId,
          sourceName: plan.sourceName ?? "Thẻ tín dụng",
          sourceIcon: plan.sourceIcon ?? null,
          planTitle:
            plan.originalTxnCategoryName?.trim() ||
            plan.originalTxnDescription?.trim() ||
            "Kế hoạch trả góp",
          installmentNumber: pay.installmentNumber,
          totalInstallments: plan.totalMonths,
          statementDate: pay.statementDate,
          dueDate: pay.dueDate,
          amount: Math.max(0, pay.amount - pay.paidAmount),
          bucket: bucketForDueDate(pay.dueDate),
        })),
    )
    .sort(
      (left, right) =>
        bucketOrder[left.bucket] - bucketOrder[right.bucket] ||
        left.dueDate.localeCompare(right.dueDate) ||
        left.sourceName.localeCompare(right.sourceName, "vi"),
    );
}

export async function getInstallmentDashboard(): Promise<InstallmentDashboard> {
  const envelope = await unwrap<RemoteDashboardEnvelope>(
    apiClient.get("/finance/installment-plans/dashboard"));
  const d = envelope.dashboard;
  const dashboard: InstallmentDashboard = {
    activePlanCount: d.activePlanCount,
    totalRemainingAmount: d.totalRemainingAmount,
    dueCount: d.dueCount,
    dueAmount: d.dueAmount,
    overdueCount: d.overdueCount,
    overdueAmount: d.overdueAmount,
    upcomingCount: d.upcomingCount,
    upcomingAmount: d.upcomingAmount,
    thisMonthDueCount: d.thisMonthDueCount ?? 0,
    thisMonthDueAmount: d.thisMonthDueAmount ?? 0,
    nextMonthDueCount: d.nextMonthDueCount ?? 0,
    nextMonthDueAmount: d.nextMonthDueAmount ?? 0,
    completionPercent: d.completionPercent ?? 0,
    bySource: (d.bySource ?? []).map((s) => ({
      sourceId: s.sourceId,
      sourceName: s.sourceName,
      sourceIcon: s.sourceIcon ?? null,
      sourceColor: s.sourceColor ?? null,
      activePlanCount: s.activePlanCount,
      remainingAmount: s.remainingAmount,
      overdueAmount: s.overdueAmount,
      thisMonthDueAmount: s.thisMonthDueAmount,
      nextMonthDueAmount: s.nextMonthDueAmount,
    })),
    upcomingPays: (d.upcomingPays ?? []).map((p) => ({
      planId: p.planId,
      sourceId: p.sourceId,
      sourceName: p.sourceName,
      sourceIcon: p.sourceIcon ?? null,
      planTitle: p.planTitle,
      installmentNumber: p.installmentNumber,
      totalInstallments: p.totalInstallments,
      statementDate: p.statementDate?.trim() || p.dueDate,
      dueDate: p.dueDate,
      amount: p.amount,
      bucket: normalizeUpcomingBucket(p.bucket),
    })),
  };

  // Older API revisions cap this collection at 30 rows. The schedule tab needs the complete
  // timeline to filter future months, so hydrate it from plan details until the uncapped API is
  // deployed. If the compatibility fetch fails, retain the otherwise usable dashboard payload.
  if (dashboard.upcomingPays.length === 30) {
    try {
      dashboard.upcomingPays = await loadCompleteUpcomingPays();
    } catch {
      // Keep the dashboard response rather than making the entire installments page unavailable.
    }
  }

  return dashboard;
}

export async function getInstallmentPlans(
  status?: InstallmentStatus): Promise<InstallmentPlanListItem[]> {
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  const query = qs.toString();
  const url =
    query.length > 0
      ? `/finance/installment-plans?${query}`
      : "/finance/installment-plans";
  const envelope = await unwrap<RemoteListEnvelope>(apiClient.get(url));
  return (envelope.items ?? []).map(mapListItem);
}

export async function getInstallmentPlanDetail(id: string): Promise<InstallmentPlan> {
  const envelope = await unwrap<RemoteDetailEnvelope>(
    apiClient.get(`/finance/installment-plans/${id}`));
  return mapPlan(envelope.plan);
}

export async function createInstallmentPlan(
  data: CreateInstallmentPlanPayload): Promise<{ planId: string }> {
  const envelope = await unwrap<{ planId: string }>(
    apiClient.post(`/finance/installment-plans`, {
      originalTxnId: data.originalTxnId,
      totalMonths: data.totalMonths,
      interestRate: data.interestRate,
      conversionFeeRate: data.conversionFeeRate,
    }));
  return envelope;
}

export async function deleteInstallmentPlan(
  id: string,
  expectedVersion: number): Promise<void> {
  const { data: body } = await apiClient.delete<
    ApiEnvelope<Record<string, never>>
  >(`/finance/installment-plans/${id}`, {
    params: { expected_version: expectedVersion },
  });
  assertData(body);
}

export async function cancelInstallmentPlan(
  id: string,
  reason: string | undefined,
  expectedVersion: number): Promise<void> {
  const { data: body } = await apiClient.post<
    ApiEnvelope<Record<string, never>>
  >(`/finance/installment-plans/${id}/cancel`, {
    reason: reason ?? null,
    expectedVersion,
  });
  assertData(body);
}

export async function recordInstallmentPayment(
  planId: string,
  installmentNumber: number,
  paymentSourceId: string,
  expectedVersion: number): Promise<{ transactionId: string }> {
  const envelope = await unwrap<{ transactionId: string }>(
    apiClient.post(
      `/finance/installment-plans/${planId}/pays/${String(installmentNumber)}/payment`,
      { paymentSourceId, expectedVersion }));
  return envelope;
}
