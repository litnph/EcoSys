import { ROUTES } from "@/config/routes";

const PATH_META: Record<string, string> = {
  [ROUTES.dashboard.home]: "Dashboard",
  [ROUTES.dashboard.profile]: "Profile",
  [ROUTES.dashboard.transactions]: "Transactions",
  [ROUTES.dashboard.sources]: "Sources",
  [ROUTES.dashboard.billing]: "Billing",
  [ROUTES.dashboard.installments]: "Installments",
  [ROUTES.dashboard.debt]: "Debt",
  [ROUTES.dashboard.reports]: "Reports",
  [ROUTES.dashboard.categories]: "Danh mục",
  [ROUTES.dashboard.savings]: "Tiết kiệm",
  [ROUTES.dashboard.investments]: "Đầu tư",
  [ROUTES.dashboard.tags]: "Thẻ",
  [ROUTES.dashboard.automation]: "Tự động hóa",
  [ROUTES.dashboard.notifications]: "Thông báo",
  [ROUTES.dashboard.settings]: "Settings",
  [ROUTES.dashboard.settingsPrivacy]: "Quyền riêng tư",
};

export type BreadcrumbItem = {
  href: string;
  label: string;
  isCurrent: boolean;
};

function humanize(segment: string): string {
  if (segment.length === 0) return segment;
  const head = segment.slice(0, 1).toUpperCase();
  const tail = segment.slice(1).replace(/-/g, " ");
  return head + tail;
}

export type BreadcrumbContext = {
  /** Tên org hiện tại — sẽ hiển thị làm crumb đầu tiên. */
  orgName?: string;
  /** Tên space hiện tại — sẽ chèn vào sau org. */
  spaceName?: string;
};

export function buildDashboardBreadcrumbs(
  pathname: string,
  ctx: BreadcrumbContext = {},
): BreadcrumbItem[] {
  const raw = pathname === "" ? "/" : pathname.startsWith("/") ? pathname : `/${pathname}`;
  const normalized = raw.length > 1 ? raw.replace(/\/$/, "") : raw;

  const prefix: BreadcrumbItem[] = [];
  if (ctx.orgName && ctx.orgName.trim().length > 0) {
    prefix.push({
      href: ROUTES.dashboard.home,
      label: ctx.orgName,
      isCurrent: false,
    });
  }
  if (ctx.spaceName && ctx.spaceName.trim().length > 0) {
    prefix.push({
      href: ROUTES.dashboard.home,
      label: ctx.spaceName,
      isCurrent: false,
    });
  }

  if (normalized === "/") {
    const home: BreadcrumbItem = {
      href: ROUTES.dashboard.home,
      label: PATH_META[ROUTES.dashboard.home] ?? "Dashboard",
      isCurrent: true,
    };
    return prefix.length > 0 ? [...prefix, home] : [home];
  }

  const segments = normalized.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [
    ...prefix,
    {
      href: ROUTES.dashboard.home,
      label: PATH_META[ROUTES.dashboard.home] ?? "Dashboard",
      isCurrent: false,
    },
  ];

  let acc = "";
  for (let i = 0; i < segments.length; i++) {
    acc += `/${segments[i]}`;
    const isLast = i === segments.length - 1;
    items.push({
      href: acc,
      label: PATH_META[acc] ?? humanize(segments[i]),
      isCurrent: isLast,
    });
  }

  return items;
}
