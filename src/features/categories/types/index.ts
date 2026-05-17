export type CategoryKind = "expense" | "income" | "transfer";

export interface FinCategory {
  id: string;
  smoduleId: string;
  name: string;
  kind: CategoryKind;
  parentId: string | null;
  icon: string | null;
  color: string | null;
  sortOrder: number;
  isDefault: boolean;
  children?: FinCategory[];
}

/** Row từ API flat — giữ `depth` để indent trong dropdown tùy chỉnh. */
export interface FinCategoryFlat extends FinCategory {
  depth: number;
}
