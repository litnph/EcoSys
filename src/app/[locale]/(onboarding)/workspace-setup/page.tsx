"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";

import { OrgSelector } from "@/features/organizations/components/OrgSelector";
import { useWorkspaceInit } from "@/features/spaces/hooks/useWorkspaceInit";
import { ModuleSetup } from "@/features/spaces/components/ModuleSetup";
import { SpaceSelector } from "@/features/spaces/components/SpaceSelector";
import { ROUTES } from "@/config/routes";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/shared/components/ui/Button";
import { sanitizeReturnUrl } from "@/shared/lib/returnUrl";
import { fadeIn } from "@/shared/lib/animations";

function LoadingState() {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="flex w-full max-w-md flex-col items-center text-center"
    >
      <Loader2
        className="size-10 animate-spin text-accent"
        aria-hidden
      />
      <p className="mt-4 text-sm font-medium text-warm-700">
        Đang tải workspace của bạn...
      </p>
      <p className="mt-1 text-xs text-warm-500">
        Hệ thống đang kiểm tra tổ chức và module tài chính.
      </p>
    </motion.div>
  );
}

function WorkspaceSetupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const init = useWorkspaceInit();

  const returnUrl = useMemo(
    () => sanitizeReturnUrl(searchParams.get("returnUrl")),
    [searchParams],
  );

  useEffect(() => {
    if (init.status !== "ready") return;
    router.replace(returnUrl ?? ROUTES.dashboard.home);
  }, [init.status, returnUrl, router]);

  return (
    <AnimatePresence mode="wait">
      {init.status === "loading" || init.status === "idle" ? (
        <div
          key="loading"
          className="flex min-h-[50vh] items-center justify-center"
        >
          <LoadingState />
        </div>
      ) : init.status === "ready" ? (
        <div
          key="ready"
          className="flex min-h-[50vh] items-center justify-center"
        >
          <LoadingState />
        </div>
      ) : init.status === "needs-org-selection" ? (
        <div
          key="org"
          className="flex min-h-[50vh] items-center justify-center"
        >
          <OrgSelector
            orgs={init.orgs}
            selectedId={init.currentOrg?.id ?? null}
            onSelect={(org) => {
              void init.selectOrg(org);
            }}
            isCreateOrgDisabled={false}
            onCreateOrg={() => router.push(ROUTES.organizations.hub)}
          />
        </div>
      ) : init.status === "needs-space-selection" ? (
        <div
          key="space"
          className="flex min-h-[50vh] items-center justify-center"
        >
          <SpaceSelector
            spaces={init.spaceTree}
            selectedId={init.currentSpace?.id ?? null}
            onSelect={(space) => {
              void init.selectSpace(space);
            }}
          />
        </div>
      ) : init.status === "needs-module-setup" ? (
        <div
          key="module"
          className="flex min-h-[50vh] items-center justify-center"
        >
          <ModuleSetup
            onEnable={async () => {
              await init.enableFinance();
            }}
            spaceName={init.currentSpace?.name}
          />
        </div>
      ) : (
        <div
          key="error"
          className="mx-auto flex w-full max-w-md flex-col items-center text-center"
        >
          <h1 className="font-display text-xl font-semibold text-warm-900">
            Không thể tải workspace
          </h1>
          <p className="mt-2 text-sm text-warm-600">
            {init.error?.message ?? "Đã có lỗi không xác định, vui lòng thử lại."}
          </p>
          <div className="mt-6">
            <Button type="button" onClick={() => init.retry()}>
              Thử lại
            </Button>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function WorkspaceSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingState />
        </div>
      }
    >
      <WorkspaceSetupInner />
    </Suspense>
  );
}
