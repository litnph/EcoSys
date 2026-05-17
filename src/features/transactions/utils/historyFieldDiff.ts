/** Parse backend `changedFields` JSON — array of EF property names. */
export function parseChangedFieldNames(raw: string | null | undefined): string[] {
  if (raw === null || raw === undefined || !String(raw).trim()) return [];
  try {
    const p = JSON.parse(raw as string);
    return Array.isArray(p) ? p.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function snapshotRecord(raw: string | null | undefined): Record<string, unknown> | null {
  if (raw === null || raw === undefined || !String(raw).trim()) return null;
  try {
    const p = JSON.parse(raw as string);
    if (typeof p !== "object" || p === null || Array.isArray(p)) return null;
    return p as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Human-readable snapshot value for timeline diff rows. */
export function formatHistoryValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Có" : "Không";
  if (typeof val === "number") return String(val);
  if (typeof val === "string") return val.trim().length > 0 ? val : "—";
  return JSON.stringify(val);
}

function shallowSnapshotDiff(
  prev: Record<string, unknown>,
  cur: Record<string, unknown>,
): { field: string; oldDisplay: string; newDisplay: string }[] {
  const keys = Array.from(
    new Set<string>([
      ...Object.keys(prev),
      ...Object.keys(cur),
    ]),
  );
  const rows: { field: string; oldDisplay: string; newDisplay: string }[] = [];
  for (const field of keys) {
    const oldDisplay = formatHistoryValue(prev[field]);
    const newDisplay = formatHistoryValue(cur[field]);
    if (oldDisplay !== newDisplay) rows.push({ field, oldDisplay, newDisplay });
  }
  return rows.sort((a, b) => a.field.localeCompare(b.field));
}

/** Rows for expandable table (field | old → new) for one history row vs its predecessor snapshot. */
export function computeHistoryRowFieldDiff(args: {
  previousSnapshotJson: string | null | undefined;
  currentSnapshotJson: string | null | undefined;
  changedFieldsJson: string | null | undefined;
  changeType: string;
}): { field: string; oldDisplay: string; newDisplay: string }[] {
  const { previousSnapshotJson, currentSnapshotJson, changedFieldsJson, changeType } = args;

  const names = parseChangedFieldNames(changedFieldsJson);
  const prevRec = snapshotRecord(previousSnapshotJson);
  const curRec = snapshotRecord(currentSnapshotJson);

  if (prevRec !== null && curRec !== null) {
    if (names.length > 0) {
      return names.map((field) => ({
        field,
        oldDisplay: formatHistoryValue(prevRec[field]),
        newDisplay: formatHistoryValue(curRec[field]),
      }));
    }
    if (changeType !== "created") {
      return shallowSnapshotDiff(prevRec, curRec);
    }
  }

  return [];
}
