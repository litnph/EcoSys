/**
 * Domain types cho feature `spaces`.
 *
 * BE trả về tree dạng forest: mỗi root chứa các con qua trường `children`.
 * `SpaceModule` thể hiện một activation row (`SPACE_MODULES`) — finance entity
 * không trỏ trực tiếp vào SPACE mà qua `smodule_id` → SpaceModule.
 */
export interface Space {
  id: string;
  orgId: string;
  parentId: string | null;
  name: string;
  /** BE: `personal | team | project | ...` (camelCase enum). */
  type: string;
  depth: number;
  /** Materialised path (ví dụ "/", "/abc/", "/abc/xyz/"). */
  path: string;
  sortOrder: number;
  /** Hint cờ từ BE — true nếu module finance đã enable trên space này. */
  financeModuleEnabled?: boolean;
  children?: Space[];
}

export interface SpaceModule {
  id: string;
  spaceId: string;
  /** Code module — BE serialize enum camelCase: `"finance"`. */
  moduleCode: string;
  isEnabled: boolean;
  settings: Record<string, unknown>;
  enabledAt?: string;
  disabledAt?: string | null;
}

/** Code chuẩn cho module Finance (giá trị enum BE: `ModuleCode.Finance = 1`). */
export const FINANCE_MODULE_CODE = "finance" as const;
