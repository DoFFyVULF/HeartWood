"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { routes } from "@/routes";

// Fixed glass tab bar that replaces the center nav on mobile — one-thumb
// reach for the four main destinations. Мир carries the 🔥 streak badge.
// Активный таб определяется текущим путём, как в десктопном хедере.
// «Ещё» — это не ссылка, а кнопка с шитом: так на мобиле открываются
// разделы, которые не поместились в таб-бар (воспоминания, профиль).
type Tab = {
  label: string;
  emoji: string;
  path: string | null;
  badge?: string;
};

const TABS: Tab[] = [
  { label: "Мир", emoji: "🌳", path: routes.home.path, badge: "🔥" },
  { label: "Купоны", emoji: "🎫", path: routes.coupons.path },
  { label: "Свидания", emoji: "📅", path: routes.dates.path },
  { label: "Ещё", emoji: "⭐", path: null },
];

// Страницы, которые открываются из шита «Ещё» — подсвечиваем его активным.
const MORE_PREFIXES = [routes.memories.path, routes.profile.path];

export function BottomTabBar() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const activeIndex = useMemo(() => {
    return TABS.findIndex((tab) => {
      if (tab.path === null) {
        return MORE_PREFIXES.some(
          (p) => pathname === p || pathname.startsWith(`${p}/`),
        );
      }
      if (tab.path === "/") return pathname === "/";
      return pathname === tab.path || pathname.startsWith(`${tab.path}/`);
    });
  }, [pathname]);

  return (
    <nav
      aria-label="Разделы мира"
      className="fixed inset-x-3 bottom-3 z-40 lg:hidden"
    >
      <div className="relative mx-auto max-w-md">
        {/* Шит «Ещё» */}
        {moreOpen && (
          <div className="absolute bottom-full mb-2 w-full overflow-hidden rounded-3xl border border-white/70 bg-white/80 p-2 shadow-2xl shadow-black/10 backdrop-blur-xl">
            <p className="px-3 pb-1 pt-1.5 text-[0.65rem] font-extrabold uppercase tracking-wide text-(--hwd-ink-soft)">
              Разделы
            </p>
            {[
              { emoji: "💌", label: "Воспоминания", href: routes.memories.path },
              { emoji: "💑", label: "Профиль пары", href: routes.profile.path },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-(--hwd-ink) transition-colors hover:bg-white/70 hover:text-(--hwd-primary) focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
              >
                <span aria-hidden className="text-lg">
                  {item.emoji}
                </span>
                {item.label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center justify-around rounded-[2rem] border border-white/70 bg-white/75 px-2 py-2 shadow-2xl shadow-black/10 backdrop-blur-xl">
          {TABS.map((tab, i) => {
            const active = i === activeIndex;
            const className = cn(
              "flex flex-col items-center gap-0.5 rounded-2xl px-4 py-1.5 text-[0.65rem] font-extrabold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)",
              active
                ? "bg-(--hwd-primary-soft) text-(--hwd-primary)"
                : "text-(--hwd-ink-soft) hover:bg-white/60 hover:text-(--hwd-ink)"
            );

            const inner = (
              <>
                <span aria-hidden className="relative text-lg">
                  {tab.emoji}
                  {tab.badge && (
                    <span className="absolute -right-2.5 -top-1 flex size-4 items-center justify-center rounded-full bg-(--hwd-primary) text-[0.55rem] font-extrabold text-white">
                      {tab.badge}
                    </span>
                  )}
                </span>
                {tab.label}
              </>
            );

            if (tab.label === "Ещё") {
              return (
                <button
                  key={tab.label}
                  type="button"
                  aria-label="Ещё разделы"
                  aria-expanded={moreOpen}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMoreOpen((p) => !p)}
                  className={className}
                >
                  {inner}
                </button>
              );
            }

            if (tab.path) {
              return (
                <Link
                  key={tab.label}
                  href={tab.path}
                  aria-current={active ? "page" : undefined}
                  className={className}
                >
                  {inner}
                </Link>
              );
            }

            return (
              <a
                key={tab.label}
                href="#"
                onClick={(e) => e.preventDefault()}
                aria-disabled="true"
                className={className}
              >
                {inner}
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
