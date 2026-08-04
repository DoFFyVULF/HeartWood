"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { worldStatus } from "@/lib/data/worldStatus";
import { QuickAddSheet } from "@/components/layout/QuickAddSheet";
import { StreakBadge } from "@/components/layout/StreakBadge";
import { MailboxEnvelope } from "@/components/layout/MailboxEnvelope";
import { MoodPicker } from "@/components/layout/MoodPicker";
import { routes } from "@/routes";
import styles from "./Header.module.css";

// path может быть null — такие пункты — заглушки (рендерятся как недоступные
// ссылки и не подсвечиваются). Сейчас их нет, но тип должен допускать.
const NAV_ITEMS: ReadonlyArray<{ label: string; path: string | null }> = [
  { label: "Мир", path: routes.home.path },
  { label: "Свидания", path: routes.dates.path },
  { label: "Воспоминания", path: routes.memories.path },
  { label: "Купоны", path: routes.coupons.path },
  { label: "Цели", path: routes.goals.path },
  { label: "Календарь", path: routes.events.path },
];

export function Header() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Активный пункт навигации определяется текущим путём; заглушки не активны.
  // Для главной ("/") нужно точное совпадение: `startsWith("/")` сработал бы
  // для любого раздела и всегда подсвечивал «Мир».
  const activeIndex = useMemo(() => {
    return NAV_ITEMS.findIndex((item) => {
      if (item.path === null) return false;
      if (item.path === "/") return pathname === "/";
      return pathname === item.path || pathname.startsWith(`${item.path}/`);
    });
  }, [pathname]);

  const initials = worldStatus.couple
    .split(" ")
    .map((name) => name[0])
    .join("");

  // Entrance animation trigger
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Sliding pill indicator — едет к активному пункту. Если текущая страница
  // не входит в основную навигацию (например /profile), индикатор скрывается.
  useEffect(() => {
    const el = itemRefs.current[activeIndex];
    const container = navRef.current;
    if (!el || !container) {
      setIndicatorStyle({ opacity: 0 });
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    setIndicatorStyle({
      width: elRect.width,
      transform: `translateX(${elRect.left - containerRect.left}px)`,
      opacity: 1,
    });
  }, [activeIndex, mounted]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-white/50 bg-white/60 backdrop-blur-xl",
        styles.header,
        mounted && styles.headerVisible
      )}
    >
      {/* Animated gradient top-line */}
      <div className={styles.gradientLine} aria-hidden />

      {/* Шапка повторяет контент: на всю ширину, без узкого центра. */}
      <div className="flex h-16 w-full items-center justify-between gap-3 px-5 sm:px-8 lg:px-12 xl:px-16">
        {/* Brand */}
        <a
          href={routes.home.path}
          aria-label="heartwood — на главную"
          className={cn(
            "group relative shrink-0 rounded-full transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)",
            styles.brand
          )}
        >
          {/* Glow ring on hover */}
          <span className={styles.brandGlow} aria-hidden />
          <Logo />
        </a>

        {/* Center pill nav — desktop only */}
        <nav aria-label="Главное" className="hidden lg:block">
          <div
            ref={navRef}
            className={cn(
              "relative flex items-center gap-1 rounded-full border border-white/70 bg-white/40 p-1",
              styles.navPill
            )}
          >
            {/* Sliding indicator */}
            <span
              className={styles.navIndicator}
              style={indicatorStyle}
              aria-hidden
            />

            {NAV_ITEMS.map((item, i) => {
              const className = cn(
                "relative z-10 rounded-full px-4 py-1.5 text-sm font-extrabold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)",
                i === activeIndex
                  ? "text-white"
                  : "text-(--hwd-ink-soft) hover:text-(--hwd-ink)"
              );

              if (item.path) {
                return (
                  <Link
                    key={item.label}
                    ref={(el) => { itemRefs.current[i] = el; }}
                    href={item.path}
                    aria-current={i === activeIndex ? "page" : undefined}
                    className={className}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <a
                  key={item.label}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  aria-disabled="true"
                  className={className}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2.5">
          {/* Streak badge — интерактивный бейдж серии с поповером */}
          <StreakBadge className="hidden sm:flex" />

          {/* Couple avatars → профиль пары */}
          <Link
            href={routes.profile.path}
            aria-label={`Профиль пары: ${worldStatus.couple}`}
            className={cn(
              "group/avatars flex shrink-0 -space-x-2 transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)",
              styles.avatars
            )}
          >
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full border-2 border-white bg-(--hwd-primary) text-sm font-extrabold text-white shadow-md transition-transform duration-300 group-hover/avatars:rotate-[-6deg] group-hover/avatars:scale-110",
                styles.avatarFirst
              )}
            >
              {initials[0]}
            </span>
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full border-2 border-white bg-(--hwd-primary-deep) text-sm font-extrabold text-white shadow-md transition-transform duration-300 group-hover/avatars:rotate-[6deg] group-hover/avatars:scale-110",
                styles.avatarSecond
              )}
            >
              {initials[1]}
            </span>
            {/* Heart burst on hover */}
            <span className={styles.heartBurst} aria-hidden>
              💕
            </span>
          </Link>

          {/* Почта — есть ли непрочитанные письма */}
          <MailboxEnvelope />

          {/* Текущее настроение — выбор прямо из хедера */}
          <MoodPicker />

          {/* Quick add */}
          <QuickAddSheet />

          {/* Settings ghost */}
          <button
            type="button"
            aria-label="Настройки"
            className={cn(
              "hidden size-10 items-center justify-center rounded-full text-lg text-(--hwd-ink-soft) transition-all duration-300 hover:bg-white/60 hover:text-(--hwd-ink) hover:rotate-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow) sm:flex",
              styles.settings
            )}
          >
            <span aria-hidden>⚙️</span>
          </button>
        </div>
      </div>
    </header>
  );
}