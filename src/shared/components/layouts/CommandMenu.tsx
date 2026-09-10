import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useTranslations } from "@/i18n/hooks";
import { useRouter } from "@/i18n/navigation";
import { Modal } from "@/shared/components/ui/Modal";
import { useIsAdmin } from "@/shared/hooks/useIsAdmin";
import { cn } from "@/shared/lib/utils";

import { SIDEBAR_NAV_ITEMS } from "./sidebarNav";

export function CommandMenu() {
  const t = useTranslations("nav");
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const items = useMemo(
    () =>
      SIDEBAR_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => ({
        ...item,
        label: t(item.labelKey),
      })),
    [isAdmin, t],
  );

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return items;
    return items.filter((item) => item.label.toLocaleLowerCase().includes(normalized));
  }, [items, query]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-10 min-w-10 items-center gap-2 rounded-button border border-warm-200 bg-surface px-2.5 text-sm text-warm-500 transition-colors",
          "hover:border-warm-300 hover:bg-warm-50 hover:text-warm-800",
          "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 md:min-w-64 md:px-3",
        )}
        aria-label={t("commandOpen")}
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="hidden min-w-0 flex-1 truncate text-left md:block">{t("commandOpen")}</span>
        <kbd className="hidden rounded border border-warm-200 bg-warm-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-warm-500 md:inline-flex">
          Ctrl K
        </kbd>
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={t("commandTitle")}
        description={t("commandDescription")}
        size="md"
        bodyClassName="p-0"
      >
        <div className="border-b border-warm-200 p-4">
          <label className="sr-only" htmlFor="global-route-search">
            {t("commandPlaceholder")}
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-warm-500" aria-hidden />
            <input
              ref={inputRef}
              id="global-route-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("commandPlaceholder")}
              className="h-11 w-full rounded-input border border-warm-300 bg-surface pl-10 pr-3 text-sm text-warm-900 outline-none placeholder:text-warm-400 focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
        <nav aria-label={t("commandTitle")} className="max-h-[min(55dvh,440px)] overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-warm-500">{t("commandEmpty")}</p>
          ) : (
            <ul className="space-y-1">
              {filteredItems.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <button
                    type="button"
                    onClick={() => navigate(href)}
                    className="flex min-h-11 w-full items-center gap-3 rounded-button px-3 py-2 text-left text-sm font-medium text-warm-700 outline-none transition-colors hover:bg-warm-100 hover:text-warm-900 focus-visible:bg-warm-100 focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <Icon className="size-4 shrink-0 text-warm-500" aria-hidden />
                    <span className="flex-1">{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </Modal>
    </>
  );
}
