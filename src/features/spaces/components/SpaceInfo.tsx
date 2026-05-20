"use client";

import { Briefcase, FolderTree, User } from "lucide-react";
import { useState } from "react";

import { Drawer } from "@/shared/components/ui/Drawer";
import { useWorkspaceStore } from "@/shared/stores/workspaceStore";
import { cn } from "@/shared/lib/utils";

import { SpaceSelector } from "./SpaceSelector";

function flattenCount(nodes: { id: string; children?: { id: string }[] }[]): number {
  let c = 0;
  for (const n of nodes) {
    c++;
    if (n.children && n.children.length > 0) {
      c += flattenCount(
        n.children as { id: string; children?: { id: string }[] }[],
      );
    }
  }
  return c;
}

export type SpaceInfoProps = {
  /** Sidebar collapsed (icon-only) mode. */
  compact?: boolean;
};

/**
 * Hiển thị tên space hiện tại ngay dưới `OrgSwitcher` trong Sidebar.
 *
 * Khi tổ chức có nhiều hơn 1 space, click sẽ mở drawer `SpaceSelector` để đổi.
 * Khi chỉ có 1 space thì chỉ hiển thị, không click được.
 */
export function SpaceInfo({ compact = false }: SpaceInfoProps) {
  const currentSpace = useWorkspaceStore((s) => s.currentSpace);
  const spaceTree = useWorkspaceStore((s) => s.spaceTree);
  const setCurrentSpace = useWorkspaceStore((s) => s.setCurrentSpace);
  const setSmoduleId = useWorkspaceStore((s) => s.setSmoduleId);
  const setWorkspaceReady = useWorkspaceStore((s) => s.setWorkspaceReady);

  const [open, setOpen] = useState(false);

  if (!currentSpace) {
    return null;
  }

  const totalSpaces = flattenCount(spaceTree);
  const canSwitch = totalSpaces > 1;

  const t = (currentSpace.type ?? "").toLowerCase();
  const Icon = t === "personal" ? User : t === "team" ? Briefcase : FolderTree;

  const content = (
    <span
      className={cn(
        "flex w-full items-center gap-2 rounded-button px-2 py-1.5 text-xs",
        canSwitch
          ? "cursor-pointer text-warm-700 hover:bg-warm-100"
          : "text-warm-600",
        compact && "justify-center px-0",
      )}
    >
      <Icon className="size-3.5 shrink-0 text-warm-500" aria-hidden />
      {!compact ? (
        <span className="min-w-0 flex-1 truncate font-medium">
          {currentSpace.name}
        </span>
      ) : null}
    </span>
  );

  return (
    <>
      {canSwitch ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Đổi không gian làm việc"
          className="w-full outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          {content}
        </button>
      ) : (
        content
      )}

      <Drawer
        side="right"
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Đổi không gian"
        size="md"
      >
        <SpaceSelector
          spaces={spaceTree}
          selectedId={currentSpace.id}
          onSelect={(space) => {
            if (space.id === currentSpace.id) {
              setOpen(false);
              return;
            }
            setCurrentSpace(space);
            setSmoduleId(null);
            setWorkspaceReady(false);
            setOpen(false);
            if (typeof window !== "undefined") {
              window.location.assign("/workspace-setup");
            }
          }}
        />
      </Drawer>
    </>
  );
}
