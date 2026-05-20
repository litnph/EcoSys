"use client";

import { Building2, ChevronRight, Loader2, Plus } from "lucide-react";
import { useState } from "react";

import { ROUTES } from "@/config/routes";
import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/utils";

import { CreateOrganizationModal } from "./CreateOrganizationModal";
import { useMyOrganizations } from "../hooks/useMyOrganizations";
import { useEnterFinanceWorkspace } from "../hooks/useEnterFinanceWorkspace";
import type { Organization } from "../types";

function sortOrgs(orgs: Organization[]): Organization[] {
  return [...orgs].sort((a, b) => {
    if (a.isPersonal !== b.isPersonal) return a.isPersonal ? -1 : 1;
    return a.name.localeCompare(b.name, "vi");
  });
}

export function OrganizationsHub() {
  const { data: orgs = [], isLoading, isError, refetch } = useMyOrganizations();
  const { enter, isPending: isEntering } = useEnterFinanceWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
  const sorted = sortOrgs(orgs);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-warm-900 sm:text-3xl">
          Tổ chức của bạn
        </h1>
        <p className="mt-2 text-sm text-warm-600">
          Mỗi tổ chức chứa các không gian (space), mỗi space có thể bật các module
          như Tài chính. Chọn tổ chức để quản lý hoặc vào ứng dụng.
        </p>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-accent" aria-hidden />
        </div>
      ) : isError ? (
        <div className="rounded-card border border-warm-200 bg-surface p-6 text-center">
          <p className="text-sm text-warm-600">Không tải được danh sách tổ chức.</p>
          <Button type="button" className="mt-4" onClick={() => void refetch()}>
            Thử lại
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Danh sách tổ chức">
          {sorted.map((org) => (
            <li
              key={org.id}
              className="rounded-card border border-warm-200 bg-surface p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-card",
                    org.isPersonal ? "bg-accent text-white" : "bg-warm-100 text-accent",
                  )}
                >
                  <Building2 className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-warm-900">{org.name}</p>
                  <p className="text-xs text-warm-500">{org.slug}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {org.isPersonal ? (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent">
                        Cá nhân
                      </span>
                    ) : (
                      <span className="text-warm-600">
                        {org.memberCount ?? 0} thành viên
                      </span>
                    )}
                    <span className="font-mono text-warm-500">{org.defaultCurrency}</span>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isEntering}
                    onClick={() => void enter(org)}
                  >
                    Vào Tài chính
                  </Button>
                  <Link
                    href={ROUTES.organizations.detail(org.id)}
                    className={cn(
                      "inline-flex items-center justify-center gap-1 rounded-button border border-warm-200 px-3 py-2 text-sm font-medium text-warm-800",
                      "hover:bg-warm-100",
                    )}
                  >
                    Quản lý
                    <ChevronRight className="size-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex justify-center">
        <Button
          type="button"
          leftIcon={<Plus className="size-4" aria-hidden />}
          onClick={() => setCreateOpen(true)}
        >
          Tạo tổ chức mới
        </Button>
      </div>

      <CreateOrganizationModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          void refetch();
        }}
      />
    </div>
  );
}
