/**
 * @deprecated Workspace logic đã được tách ra:
 * - Store: `@/shared/stores/workspaceStore`
 * - Types/API: `@/features/organizations`, `@/features/spaces`
 * - Components: `OrgSwitcher` → `@/features/organizations`,
 *   `SpaceInfo` / `RequireWorkspace` → `@/features/spaces`.
 *
 * File này giữ lại các re-export cũ để tránh phá vỡ import path hiện hữu.
 * Sẽ xoá ở Sprint sau.
 */
export type { Organization } from "@/features/organizations";
export { getMyOrganizations as getOrganizations } from "@/features/organizations";
export { OrgSwitcher as WorkspacePicker } from "@/features/organizations";

export type { Space as SpaceTreeNode, SpaceModule } from "@/features/spaces";
export {
  enableModule,
  findFirstFinanceSpace,
  getSpaceModules,
  getSpaceTree,
  resolveFinanceSmoduleId,
  RequireWorkspace as WorkspaceBootstrap,
} from "@/features/spaces";

export { WORKSPACE_ORG_KEY as WORKSPACE_ORG_STORAGE_KEY } from "@/config/constants";
export { useWorkspaceStore } from "@/shared/stores/workspaceStore";
