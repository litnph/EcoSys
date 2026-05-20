"use client";

import { ArrowLeft, FolderTree, Loader2, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { ROUTES } from "@/config/routes";
import { getSpaceModules, getSpaceTree } from "@/features/spaces/api/spacesApi";
import { FINANCE_MODULE_CODE, type Space } from "@/features/spaces/types";
import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/utils";

import { getOrganizationById } from "../api/organizationsApi";
import { useEnterFinanceWorkspace } from "../hooks/useEnterFinanceWorkspace";
import type { Organization } from "../types";

type OrganizationDetailViewProps = {
  orgId: string;
};

function SpaceRow({
  space,
  depth,
  org,
  onEnterFinance,
  isEntering,
}: {
  space: Space;
  depth: number;
  org: Organization;
  onEnterFinance: (spaceId: string) => void;
  isEntering: boolean;
}) {
  const { data: modules, isLoading } = useQuery({
    queryKey: ["spaces", space.id, "modules"],
    queryFn: async () => {
      const res = await getSpaceModules(space.id);
      return res.data;
    },
  });

  const finance = modules?.find(
    (m) => m.moduleCode === FINANCE_MODULE_CODE && m.isEnabled,
  );

  return (
    <>
      <li
        className={cn(
          "rounded-card border border-warm-200 bg-surface px-4 py-3",
          depth > 0 && "ml-4 border-dashed",
        )}
        style={{ marginLeft: depth > 0 ? depth * 12 : undefined }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <FolderTree className="size-4 shrink-0 text-warm-500" aria-hidden />
            <div>
              <p className="font-medium text-warm-900">{space.name}</p>
              <p className="text-xs text-warm-500">{space.type}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {isLoading ? (
              <span className="text-warm-500">Đang tải module…</span>
            ) : finance ? (
              <span className="rounded-full bg-success/10 px-2 py-0.5 font-medium text-success">
                Tài chính đã bật
              </span>
            ) : (
              <span className="text-warm-500">Chưa bật Tài chính</span>
            )}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              leftIcon={<Wallet className="size-3.5" aria-hidden />}
              disabled={isEntering || !finance}
              onClick={() => onEnterFinance(space.id)}
            >
              Mở
            </Button>
          </div>
        </div>
      </li>
      {space.children?.map((child) => (
        <SpaceRow
          key={child.id}
          space={child}
          depth={depth + 1}
          org={org}
          onEnterFinance={onEnterFinance}
          isEntering={isEntering}
        />
      ))}
    </>
  );
}

function flattenSpaces(nodes: Space[]): Space[] {
  const out: Space[] = [];
  const walk = (list: Space[]) => {
    for (const n of list) {
      out.push(n);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

export function OrganizationDetailView({ orgId }: OrganizationDetailViewProps) {
  const { enter, isPending: isEntering } = useEnterFinanceWorkspace();

  const orgQuery = useQuery({
    queryKey: ["organizations", orgId],
    queryFn: async () => {
      const res = await getOrganizationById(orgId);
      return res.data;
    },
  });

  const treeQuery = useQuery({
    queryKey: ["spaces", "tree", orgId],
    queryFn: async () => {
      const res = await getSpaceTree(orgId);
      return res.data;
    },
    enabled: Boolean(orgQuery.data),
  });

  const org = orgQuery.data;

  function handleEnterFinance(spaceId: string) {
    if (!org) return;
    void enter(org, spaceId);
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href={ROUTES.organizations.hub}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Tất cả tổ chức
      </Link>

      {orgQuery.isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-accent" aria-hidden />
        </div>
      ) : orgQuery.isError || !org ? (
        <p className="text-sm text-warm-600">Không tìm thấy tổ chức.</p>
      ) : (
        <>
          <header className="mb-6">
            <h1 className="font-display text-2xl font-semibold text-warm-900">
              {org.name}
            </h1>
            <p className="mt-1 text-sm text-warm-500">{org.slug}</p>
            <p className="mt-3 text-sm text-warm-600">
              Cấu trúc: <strong>Tổ chức</strong> → <strong>Space</strong> →{" "}
              <strong>Module</strong>. Bật module Tài chính trên từng space để sử dụng
              ứng dụng quản lý chi tiêu.
            </p>
          </header>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-warm-500">
              Không gian (Spaces)
            </h2>
            {treeQuery.isLoading ? (
              <p className="text-sm text-warm-500">Đang tải cây space…</p>
            ) : treeQuery.isError ? (
              <p className="text-sm text-danger">Không tải được danh sách space.</p>
            ) : flattenSpaces(treeQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-warm-500">Chưa có space nào.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {(treeQuery.data ?? []).map((root) => (
                  <SpaceRow
                    key={root.id}
                    space={root}
                    depth={0}
                    org={org}
                    onEnterFinance={handleEnterFinance}
                    isEntering={isEntering}
                  />
                ))}
              </ul>
            )}
          </section>

          <div className="mt-8">
            <Button
              type="button"
              disabled={isEntering}
              onClick={() => void enter(org)}
            >
              Vào Tài chính (space mặc định)
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
