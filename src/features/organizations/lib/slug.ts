/** Chuyển tên hiển thị thành slug gợi ý (BE vẫn validate độc lập). */
export function suggestOrganizationSlug(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const suffix = Math.random().toString(36).slice(2, 6);
  const slug = base.length > 0 ? `${base}-${suffix}` : `org-${suffix}`;
  return slug.slice(0, 64);
}
