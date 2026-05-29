import {
  type ComponentProps,
  forwardRef,
  type ReactNode,
} from "react";
import {
  Link as RouterLink,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import i18n from "./index";
import { routing, type AppLocale } from "./routing";

function resolveLocale(raw?: string): AppLocale {
  if (raw && (routing.locales as readonly string[]).includes(raw)) {
    return raw as AppLocale;
  }
  return routing.defaultLocale;
}

export function useLocale(): AppLocale {
  const { locale } = useParams<{ locale: string }>();
  return resolveLocale(locale);
}

/** Path without locale prefix (matches next-intl `usePathname`). */
export function usePathname(): string {
  const { pathname } = useLocation();
  const locale = useLocale();
  const prefix = `/${locale}`;
  if (pathname === prefix || pathname === `${prefix}/`) {
    return "/";
  }
  if (pathname.startsWith(`${prefix}/`)) {
    return pathname.slice(prefix.length) || "/";
  }
  return pathname;
}

type RouterOptions = {
  locale?: AppLocale;
  /** Keep the current page query string when `href` has no `?…`. */
  preserveSearch?: boolean;
};

function splitHref(href: string): { path: string; search: string } {
  const qIndex = href.indexOf("?");
  if (qIndex === -1) {
    return { path: href, search: "" };
  }
  return {
    path: href.slice(0, qIndex),
    search: href.slice(qIndex),
  };
}

function localizedPath(path: string, locale: AppLocale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") {
    return `/${locale}`;
  }
  return `/${locale}${normalized}`;
}

export function useRouter() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentLocale = useLocale();

  const go = (href: string, options: RouterOptions | undefined, replace: boolean) => {
    const { path, search } = splitHref(href);
    const locale = options?.locale ?? currentLocale;
    if (options?.locale) {
      void i18n.changeLanguage(locale);
    }
    const nextSearch =
      search || (options?.preserveSearch ? location.search : "");
    navigate(
      {
        pathname: localizedPath(path, locale),
        search: nextSearch,
      },
      replace ? { replace: true } : undefined,
    );
  };

  return {
    push(href: string, options?: RouterOptions) {
      go(href, options, false);
    },
    replace(href: string, options?: RouterOptions) {
      go(href, options, true);
    },
  };
}

type LinkProps = Omit<ComponentProps<typeof RouterLink>, "to"> & {
  href: string;
  children?: ReactNode;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function LocaleLink(
  { href, ...props },
  ref,
) {
  const locale = useLocale();
  const { path, search } = splitHref(href);
  return (
    <RouterLink
      ref={ref}
      to={{ pathname: localizedPath(path, locale), search }}
      {...props}
    />
  );
});

export function redirect({
  href,
  locale,
}: {
  href: string;
  locale: string;
}): ReactNode {
  return <Navigate to={localizedPath(href, resolveLocale(locale))} replace />;
}

export function getPathname({
  locale,
  href,
}: {
  locale: AppLocale;
  href: string;
}): string {
  const { path, search } = splitHref(href);
  return `${localizedPath(path, locale)}${search}`;
}
