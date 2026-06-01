import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";

import { routing } from "@/i18n/routing";
import { AuthLayout, LocaleLayout } from "@/layouts/LocaleLayout";
import { DashboardRouteLayout } from "@/layouts/DashboardLayout";
import { SettingsRouteLayout } from "@/layouts/SettingsLayout";
import { SkeletonText, SkeletonTitle } from "@/shared/components/ui/Skeleton";

const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const DashboardHomePage = lazy(() =>
  import("@/pages/DashboardHomePage").then((m) => ({
    default: m.DashboardHomePage,
  })),
);
const TransactionsPage = lazy(() =>
  import("@/pages/TransactionsPage").then((m) => ({
    default: m.TransactionsPage,
  })),
);
const SourcesPage = lazy(() =>
  import("@/pages/SourcesPage").then((m) => ({ default: m.SourcesPage })),
);
const SourceBalanceLedgerPage = lazy(() =>
  import("@/pages/SourceBalanceLedgerPage").then((m) => ({
    default: m.SourceBalanceLedgerPage,
  })),
);
const BillingPage = lazy(() =>
  import("@/pages/BillingPage").then((m) => ({ default: m.BillingPage })),
);
const InstallmentsPage = lazy(() =>
  import("@/pages/InstallmentsPage").then((m) => ({
    default: m.InstallmentsPage,
  })),
);
const DebtPage = lazy(() =>
  import("@/pages/DebtPage").then((m) => ({ default: m.DebtPage })),
);
const ReportsPage = lazy(() =>
  import("@/pages/ReportsPage").then((m) => ({ default: m.ReportsPage })),
);
const CategoriesPage = lazy(() =>
  import("@/pages/CategoriesPage").then((m) => ({ default: m.CategoriesPage })),
);
const SavingsPage = lazy(() =>
  import("@/pages/SavingsPage").then((m) => ({ default: m.SavingsPage })),
);
const InvestmentsPage = lazy(() =>
  import("@/pages/InvestmentsPage").then((m) => ({
    default: m.InvestmentsPage,
  })),
);
const TagsPage = lazy(() =>
  import("@/pages/TagsPage").then((m) => ({ default: m.TagsPage })),
);
const ProfilePage = lazy(() =>
  import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const SettingsProfilePage = lazy(() =>
  import("@/pages/SettingsProfilePage").then((m) => ({
    default: m.SettingsProfilePage,
  })),
);
const SettingsPreferencesPage = lazy(() =>
  import("@/pages/SettingsPreferencesPage").then((m) => ({
    default: m.SettingsPreferencesPage,
  })),
);
const SettingsMembersPage = lazy(() =>
  import("@/pages/SettingsMembersPage").then((m) => ({
    default: m.SettingsMembersPage,
  })),
);

function DashboardLoading() {
  return (
    <div
      className="w-full animate-pulse space-y-6 pb-8"
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

function PageSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<DashboardLoading />}>{children}</Suspense>;
}

function SourceBalanceLedgerRoute() {
  const { sourceId } = useParams<{ sourceId: string }>();
  if (!sourceId) {
    return <Navigate to="sources" replace />;
  }
  return <SourceBalanceLedgerPage sourceId={sourceId} />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/${routing.defaultLocale}`} replace />} />
      <Route path="/:locale" element={<LocaleLayout />}>
        <Route element={<AuthLayout />}>
          <Route
            path="login"
            element={
              <PageSuspense>
                <LoginPage />
              </PageSuspense>
            }
          />
        </Route>
        <Route element={<DashboardRouteLayout />}>
          <Route
            index
            element={
              <PageSuspense>
                <DashboardHomePage />
              </PageSuspense>
            }
          />
          <Route
            path="transactions"
            element={
              <PageSuspense>
                <TransactionsPage />
              </PageSuspense>
            }
          />
          <Route
            path="sources"
            element={
              <PageSuspense>
                <SourcesPage />
              </PageSuspense>
            }
          />
          <Route
            path="sources/:sourceId/ledger"
            element={
              <PageSuspense>
                <SourceBalanceLedgerRoute />
              </PageSuspense>
            }
          />
          <Route
            path="billing"
            element={
              <PageSuspense>
                <BillingPage />
              </PageSuspense>
            }
          />
          <Route
            path="installments"
            element={
              <PageSuspense>
                <InstallmentsPage />
              </PageSuspense>
            }
          />
          <Route
            path="debt"
            element={
              <PageSuspense>
                <DebtPage />
              </PageSuspense>
            }
          />
          <Route
            path="reports"
            element={
              <PageSuspense>
                <ReportsPage />
              </PageSuspense>
            }
          />
          <Route
            path="categories"
            element={
              <PageSuspense>
                <CategoriesPage />
              </PageSuspense>
            }
          />
          <Route
            path="savings"
            element={
              <PageSuspense>
                <SavingsPage />
              </PageSuspense>
            }
          />
          <Route
            path="investments"
            element={
              <PageSuspense>
                <InvestmentsPage />
              </PageSuspense>
            }
          />
          <Route
            path="tags"
            element={
              <PageSuspense>
                <TagsPage />
              </PageSuspense>
            }
          />
          <Route
            path="profile"
            element={
              <PageSuspense>
                <ProfilePage />
              </PageSuspense>
            }
          />
          <Route path="settings" element={<SettingsRouteLayout />}>
            <Route
              index
              element={<Navigate to="profile" replace />}
            />
            <Route
              path="profile"
              element={
                <PageSuspense>
                  <SettingsProfilePage />
                </PageSuspense>
              }
            />
            <Route
              path="preferences"
              element={
                <PageSuspense>
                  <SettingsPreferencesPage />
                </PageSuspense>
              }
            />
            <Route
              path="members"
              element={
                <PageSuspense>
                  <SettingsMembersPage />
                </PageSuspense>
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="../" replace />} />
      </Route>
      <Route path="*" element={<Navigate to={`/${routing.defaultLocale}`} replace />} />
    </Routes>
  );
}
