export type JwtDisplayClaims = {
  email?: string;
  name?: string;
  picture?: string;
};

export function readJwtDisplayClaims(token: string): JwtDisplayClaims {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return {};
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const data = JSON.parse(json) as Record<string, unknown>;
    const email = typeof data.email === "string" ? data.email : undefined;
    const name =
      typeof data.name === "string"
        ? data.name
        : typeof data.fullName === "string"
          ? data.fullName
          : undefined;
    const picture =
      typeof data.picture === "string"
        ? data.picture
        : typeof data.avatarUrl === "string"
          ? data.avatarUrl
          : undefined;
    return { email, name, picture };
  } catch {
    return {};
  }
}

export function initialsFromNameOrEmail(
  name: string | undefined,
  email: string | undefined): string {
  const trimmedName = name?.trim();
  if (trimmedName) {
    const chunks = trimmedName.split(/\s+/).filter(Boolean);
    if (chunks.length >= 2) {
      return `${chunks[0][0] ?? ""}${chunks[1][0] ?? ""}`.toUpperCase();
    }
    return trimmedName.slice(0, 2).toUpperCase();
  }
  const e = email?.trim();
  if (e && e.includes("@")) {
    return e[0]?.toUpperCase() ?? "U";
  }
  return "U";
}
