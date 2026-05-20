"use client";

import { motion } from "framer-motion";
import { Building2, Plus, Users } from "lucide-react";

import type { Organization } from "@/features/organizations/types";
import { Button } from "@/shared/components/ui/Button";
import { slideUp, staggerChildren, staggerItem } from "@/shared/lib/animations";
import { cn } from "@/shared/lib/utils";

export type OrgSelectorProps = {
  orgs: Organization[];
  selectedId?: string | null;
  onSelect: (org: Organization) => void;
  /** Tuỳ chọn — bật khi cho phép user tự tạo org mới. MVP để disabled. */
  onCreateOrg?: () => void;
  isCreateOrgDisabled?: boolean;
};

/** Bước "Chọn tổ chức" trong onboarding. Org cá nhân luôn đứng đầu. */
export function OrgSelector({
  orgs,
  selectedId,
  onSelect,
  onCreateOrg,
  isCreateOrgDisabled = true,
}: OrgSelectorProps) {
  const sorted = [...orgs].sort((a, b) => {
    if (a.isPersonal !== b.isPersonal) return a.isPersonal ? -1 : 1;
    return a.name.localeCompare(b.name, "vi");
  });

  return (
    <motion.div
      variants={slideUp}
      initial="initial"
      animate="animate"
      className="w-full max-w-2xl"
    >
      <header className="mb-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-warm-900 sm:text-3xl">
          Chọn tổ chức
        </h1>
        <p className="mt-2 text-sm text-warm-600">
          Chọn tổ chức bạn muốn làm việc. Bạn có thể đổi tổ chức bất kỳ lúc nào ở
          thanh điều hướng.
        </p>
      </header>

      <motion.ul
        variants={staggerChildren}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        aria-label="Danh sách tổ chức"
      >
        {sorted.map((org) => {
          const isSelected = org.id === selectedId;
          return (
            <motion.li key={org.id} variants={staggerItem}>
              <button
                type="button"
                onClick={() => onSelect(org)}
                aria-pressed={isSelected}
                className={cn(
                  "group flex w-full flex-col gap-2 rounded-card border bg-surface p-5 text-left transition-all",
                  "hover:border-accent hover:shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                  isSelected
                    ? "border-accent bg-accent/5 shadow-sm"
                    : "border-warm-200",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-card",
                      isSelected ? "bg-accent text-white" : "bg-warm-100 text-accent",
                    )}
                  >
                    <Building2 className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-warm-900">
                      {org.name}
                    </p>
                    <p className="truncate text-xs text-warm-500">
                      {org.slug}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-warm-600">
                  <span className="inline-flex items-center gap-1">
                    {org.isPersonal ? (
                      <span className="rounded-full bg-accent/10 px-2 py-0.5 font-medium text-accent">
                        Cá nhân
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-warm-500">
                        <Users className="size-3.5" aria-hidden />
                        {org.memberCount ?? 0} thành viên
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-xs text-warm-500">
                    {org.defaultCurrency}
                  </span>
                </div>
              </button>
            </motion.li>
          );
        })}
      </motion.ul>

      <div className="mt-6 flex justify-center">
        <Button
          type="button"
          variant="ghost"
          leftIcon={<Plus className="size-4" aria-hidden />}
          onClick={onCreateOrg}
          disabled={isCreateOrgDisabled || !onCreateOrg}
        >
          Tạo tổ chức mới
        </Button>
      </div>
    </motion.div>
  );
}
