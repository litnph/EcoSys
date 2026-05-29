export type CategoryKind = "expense" | "income" | "transfer";

export type CategoryNecessityLevel =
  | "needs"
  | "flexible"
  | "wants"
  | "waste";

export const CATEGORY_NECESSITY_LEVELS = [
  { value: "needs" as const, label: "Rất cần thiết (Needs)" },
  { value: "flexible" as const, label: "Cần thiết nhưng linh hoạt" },
  { value: "wants" as const, label: "Tùy chọn / Nâng cao chất lượng sống (Wants)" },
  { value: "waste" as const, label: "Lãng phí / Bốc đồng" },
] satisfies { value: CategoryNecessityLevel; label: string }[];

export interface FinCategory {
  id: string;
  name: string;
  kind: CategoryKind;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  isDefault: boolean;
  isSystem: boolean;
  necessityLevel: CategoryNecessityLevel | null;
  children?: FinCategory[];
}

/** Row từ API flat — giữ `depth` để indent trong dropdown tùy chỉnh. */
export interface FinCategoryFlat extends FinCategory {
  depth: number;
}
