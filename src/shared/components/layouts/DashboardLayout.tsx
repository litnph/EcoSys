import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ErrorBoundary } from "@/shared/components/feedback/ErrorBoundary";
import { useIsMdUp } from "@/shared/hooks/useMediaQuery";
import { cn } from "@/shared/lib/utils";

import { PageTransition } from "./PageTransition";
import { Sidebar } from "./Sidebar";
import type { TopNavUser } from "./TopNav";
import { TopNav } from "./TopNav";

const TOP_NAV_HEIGHT_PX = 56;
const OFFLINE_BANNER_HEIGHT_PX = 40;

export type DashboardLayoutProps = {
  children: ReactNode;
  user?: TopNavUser;
};

export function DashboardLayout({
  children,
  user,
}: DashboardLayoutProps) {
  const queryClient = useQueryClient();
  const isMdUp = useIsMdUp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [offline, setOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  const openMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(true);
  }, []);

  useEffect(() => {
    if (isMdUp) {
      setMobileSidebarOpen(false);
    }
  }, [isMdUp]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setMobileSidebarOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileSidebarOpen]);

  useEffect(() => {
    function handleOnline(): void {
      setOffline(false);
      void queryClient.refetchQueries({ type: "active" });
    }
    function handleOffline(): void {
      setOffline(true);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [queryClient]);

  const bannerInsetPx = offline ? OFFLINE_BANNER_HEIGHT_PX : 0;
  const mainPaddingTopPx = TOP_NAV_HEIGHT_PX + bannerInsetPx;

  const sidebarWidth =
    !isMdUp ? "0px" : sidebarCollapsed ? "4rem" : "240px";

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--dashboard-sidebar",
      sidebarWidth);
    return () => {
      document.documentElement.style.removeProperty("--dashboard-sidebar");
    };
  }, [sidebarWidth]);

  return (
    <div className="min-h-screen bg-warm-50">
      {offline ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-0 top-0 z-[45] flex h-10 items-center justify-center bg-warm-900 px-4 text-center text-sm font-medium text-white"
        >
          Mất kết nối - Đang thử lại...
        </div>
      ) : null}

      <ErrorBoundary fallbackTitle="Không tải được menu bên">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          bannerInsetPx={bannerInsetPx}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={closeMobileSidebar}
        />
      </ErrorBoundary>

      <ErrorBoundary fallbackTitle="Không tải được thanh điều hướng">
        <TopNav
          sidebarCollapsed={sidebarCollapsed}
          user={user}
          bannerInsetPx={bannerInsetPx}
          onMenuClick={openMobileSidebar}
        />
      </ErrorBoundary>

      <main
        style={{ paddingTop: mainPaddingTopPx }}
        className={cn(
          "min-h-screen bg-warm-50 px-4 transition-[margin] duration-200 ease-out md:px-6",
          sidebarCollapsed ? "md:ml-16" : "md:ml-[240px]")}
      >
        <ErrorBoundary fallbackTitle="Không tải được nội dung trang">
          <PageTransition>{children}</PageTransition>
        </ErrorBoundary>
      </main>
    </div>
  );
}
