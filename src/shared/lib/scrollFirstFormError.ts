import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormReturn,
} from "react-hook-form";

function findFirstInvalidPath(
  errors: FieldErrors<FieldValues>,
  prefix = "",
): string | undefined {
  for (const key of Object.keys(errors)) {
    const node = errors[key];
    const path = prefix ? `${prefix}.${key}` : key;
    if (!node || typeof node !== "object") continue;

    if ("message" in node && typeof node.message === "string") {
      return path;
    }

    const nested = findFirstInvalidPath(
      node as FieldErrors<FieldValues>,
      path,
    );
    if (nested) return nested;
  }
  return undefined;
}

/** Sau submit thất bại: focus + cuộn tới field lỗi đầu tiên. */
export function scrollFirstHookFormErrorIntoView<T extends FieldValues>(
  errors: FieldErrors<T>,
  form: UseFormReturn<T>,
): void {
  const path = findFirstInvalidPath(errors as FieldErrors<FieldValues>);
  if (!path) return;

  void form.setFocus(path as Path<T>, { shouldSelect: false });

  queueMicrotask(() => {
    try {
      const el = document.querySelector<HTMLElement>(
        `[name="${CSS.escape(path)}"]`,
      );
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {
      /* ignore selector issues */
    }
  });
}
