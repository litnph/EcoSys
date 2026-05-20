/**
 * Auth + locale routing. Session cookies use TOKEN_KEY / REFRESH_TOKEN_KEY constant names.
 * Edge middleware reads `request.cookies` (`cookies()` from next/headers is not supported here).
 */
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getNgrokSkipBrowserWarningHeaders } from "@/config/env";
import {
  REFRESH_TOKEN_KEY,
  TOKEN_KEY,
  WORKSPACE_SMODULE_KEY,
} from "@/config/constants";
import { ROUTES } from "@/config/routes";
import { routing } from "@/i18n/routing";
import { parseTokenPair } from "@/features/auth/api/parseAuthPayload";
import {
  getJwtExpiryUnixSeconds,
  isAccessTokenValid,
  shouldProactiveRefresh,
} from "@/shared/lib/jwt";

const intlMiddleware = createMiddleware(routing);

const AUTH_PATHS = [
  ROUTES.auth.login,
  ROUTES.auth.register,
  ROUTES.auth.forgotPassword,
  ROUTES.auth.resetPassword,
  ROUTES.auth.verifyEmail,
  ROUTES.auth.callback,
] as const;

const ONBOARDING_PATHS = [ROUTES.onboarding.workspaceSetup] as const;

const ORG_HUB_PREFIX = ROUTES.organizations.hub;

function pathIsOrgHub(pathWithoutLocale: string): boolean {
  return (
    pathWithoutLocale === ORG_HUB_PREFIX ||
    pathWithoutLocale.startsWith(`${ORG_HUB_PREFIX}/`)
  );
}

function getLocaleAndPath(pathname: string): {
  locale: string;
  pathWithoutLocale: string;
} {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (routing.locales.includes(first as (typeof routing.locales)[number])) {
    const rest = segments.slice(1);
    const pathWithoutLocale =
      rest.length === 0 ? "/" : `/${rest.join("/")}`;
    return { locale: first, pathWithoutLocale };
  }
  return {
    locale: routing.defaultLocale,
    pathWithoutLocale: pathname === "/" ? "/" : `/${segments.join("/")}`,
  };
}

function applyClearAuthCookies(res: NextResponse): void {
  res.cookies.set(TOKEN_KEY, "", { path: "/", maxAge: 0, sameSite: "lax" });
  res.cookies.set(REFRESH_TOKEN_KEY, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  res.cookies.set(WORKSPACE_SMODULE_KEY, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
}

function applyAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
): void {
  const now = Math.floor(Date.now() / 1000);
  const accessExp = getJwtExpiryUnixSeconds(accessToken);
  const accessMax = accessExp ? Math.max(60, accessExp - now) : 900;
  const refreshExp = getJwtExpiryUnixSeconds(refreshToken);
  const refreshMax = refreshExp
    ? Math.max(3600, refreshExp - now)
    : 60 * 60 * 24 * 14;
  res.cookies.set(TOKEN_KEY, accessToken, {
    path: "/",
    sameSite: "lax",
    maxAge: accessMax,
  });
  res.cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
    path: "/",
    sameSite: "lax",
    maxAge: refreshMax,
  });
}

type RefreshPair = { accessToken: string; refreshToken: string };

async function postRefresh(
  refreshToken: string,
  request: NextRequest,
): Promise<RefreshPair | null> {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) {
    return null;
  }
  const lang =
    request.headers.get("accept-language")?.split(",")[0]?.trim() ?? "vi";
  try {
    const res = await fetch(`${base}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": lang,
        ...getNgrokSkipBrowserWarningHeaders(base),
      },
      body: JSON.stringify({ refreshToken }),
    });
    const json: unknown = await res.json();
    if (!res.ok) {
      return null;
    }
    return parseTokenPair(json);
  } catch {
    return null;
  }
}

async function resolveSessionForMiddleware(request: NextRequest): Promise<{
  access: string | null;
  refresh: string | null;
  refreshed: boolean;
  clearCookies: boolean;
}> {
  const access = request.cookies.get(TOKEN_KEY)?.value ?? null;
  const refresh = request.cookies.get(REFRESH_TOKEN_KEY)?.value ?? null;

  if (!shouldProactiveRefresh(access, refresh)) {
    return {
      access: isAccessTokenValid(access) ? access : null,
      refresh,
      refreshed: false,
      clearCookies: false,
    };
  }

  if (!refresh) {
    return {
      access: isAccessTokenValid(access) ? access : null,
      refresh: null,
      refreshed: false,
      clearCookies: false,
    };
  }

  const pair = await postRefresh(refresh, request);
  if (pair) {
    return {
      access: pair.accessToken,
      refresh: pair.refreshToken,
      refreshed: true,
      clearCookies: false,
    };
  }

  return {
    access: null,
    refresh: null,
    refreshed: false,
    clearCookies: true,
  };
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { locale, pathWithoutLocale } = getLocaleAndPath(pathname);

  const isAuthRoute = (AUTH_PATHS as readonly string[]).includes(
    pathWithoutLocale,
  );
  const isOnboardingRoute = (ONBOARDING_PATHS as readonly string[]).includes(
    pathWithoutLocale,
  );
  const isOrgHubRoute = pathIsOrgHub(pathWithoutLocale);
  const isProtectedRoute = !isAuthRoute;

  const session = await resolveSessionForMiddleware(request);
  const hasValidToken =
    session.access !== null && isAccessTokenValid(session.access);
  const smoduleCookie =
    request.cookies.get(WORKSPACE_SMODULE_KEY)?.value?.trim() ?? "";
  const hasWorkspaceContext = smoduleCookie.length > 0;

  if (isProtectedRoute && !hasValidToken) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${ROUTES.auth.login}`;
    url.searchParams.set(
      "returnUrl",
      `${pathname}${request.nextUrl.search}`,
    );
    const res = NextResponse.redirect(url);
    applyClearAuthCookies(res);
    return res;
  }

  if (isAuthRoute && hasValidToken) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${ROUTES.organizations.hub}`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Đã login + đã có workspace + đang ở /workspace-setup → tiến thẳng vào dashboard.
  if (isOnboardingRoute && hasValidToken && hasWorkspaceContext) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${ROUTES.dashboard.home}`;
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Finance dashboard cần smoduleId; trung tâm org (`/organizations`) thì không.
  if (
    isProtectedRoute &&
    !isOnboardingRoute &&
    !isOrgHubRoute &&
    hasValidToken &&
    !hasWorkspaceContext
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${ROUTES.onboarding.workspaceSetup}`;
    url.searchParams.set(
      "returnUrl",
      `${pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(url);
  }

  const intlResponse = intlMiddleware(request);

  if (session.clearCookies) {
    applyClearAuthCookies(intlResponse);
  } else if (
    session.refreshed &&
    session.access &&
    session.refresh
  ) {
    applyAuthCookies(intlResponse, session.access, session.refresh);
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
