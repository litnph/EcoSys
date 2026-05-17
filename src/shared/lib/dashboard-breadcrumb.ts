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
  [ROUTES.dashboard.settings]: "Settings",
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

export function buildDashboardBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const raw = pathname === "" ? "/" : pathname.startsWith("/") ? pathname : `/${pathname}`;
  const normalized = raw.length > 1 ? raw.replace(/\/$/, "") : raw;

  if (normalized === "/") {
    return [
      {
        href: ROUTES.dashboard.home,
        label: PATH_META[ROUTES.dashboard.home] ?? "Dashboard",
        isCurrent: true,
      },
    ];
  }

  const segments = normalized.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [
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
