import type { CategoryNecessityLevel } from "../types";
import { CATEGORY_NECESSITY_LEVELS } from "../types";

const LABEL_BY_VALUE = Object.fromEntries(
  CATEGORY_NECESSITY_LEVELS.map((item) => [item.value, item.label]),
) as Record<CategoryNecessityLevel, string>;

const SHORT_LABEL_BY_VALUE: Record<CategoryNecessityLevel, string> = {
  needs: "Needs",
  flexible: "Linh hoạt",
  wants: "Wants",
  waste: "Lãng phí",
};

const BADGE_CLASS_BY_VALUE: Record<CategoryNecessityLevel, string> = {
  needs: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
  flexible: "bg-sky-50 text-sky-800 ring-sky-200/80",
  wants: "bg-amber-50 text-amber-900 ring-amber-200/80",
  waste: "bg-rose-50 text-rose-800 ring-rose-200/80",
};

export function necessityLevelLabel(
  level: CategoryNecessityLevel | null | undefined,
): string | null {
  if (!level) return null;
  return LABEL_BY_VALUE[level] ?? level;
}

export function necessityLevelShortLabel(
  level: CategoryNecessityLevel | null | undefined,
): string | null {
  if (!level) return null;
  return SHORT_LABEL_BY_VALUE[level] ?? level;
}

export function necessityLevelBadgeClass(
  level: CategoryNecessityLevel | null | undefined,
): string {
  if (!level) return "bg-warm-100 text-warm-600 ring-warm-200/80";
  return BADGE_CLASS_BY_VALUE[level];
}

export const NECESSITY_LEGEND = CATEGORY_NECESSITY_LEVELS.map((item) => ({
  value: item.value,
  shortLabel: SHORT_LABEL_BY_VALUE[item.value],
  badgeClass: BADGE_CLASS_BY_VALUE[item.value],
}));
