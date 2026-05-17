import { NEXT_PUBLIC_API_URL } from "@/config/env";

const KNOWN_AVATAR_HOSTS = new Set([
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
  "www.gravatar.com",
  "secure.gravatar.com",
  "i.pravatar.cc",
]);

function apiHost(): string | null {
  const raw = NEXT_PUBLIC_API_URL.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return u.hostname;
  } catch {
    return null;
  }
}

/** Use `next/image` without optimization for blob/data URLs and unknown remote hosts. */
export function avatarImageUnoptimized(src: string): boolean {
  if (src.startsWith("blob:") || src.startsWith("data:")) return true;
  if (!src.startsWith("http")) return true;
  try {
    const { hostname } = new URL(src);
    if (KNOWN_AVATAR_HOSTS.has(hostname)) return false;
    const api = apiHost();
    if (api && hostname === api) return false;
    return true;
  } catch {
    return true;
  }
}
