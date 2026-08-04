"use client";

import { useState } from "react";
import Link from "next/link";
import { routes } from "@/routes";

// The ＋ round button opens a small glass action sheet: every new thing the
// couple can plant in the world in one tap. Actions with a `href` navigate to
// their feature page; the rest stay as placeholders until their feature lands.
const ACTIONS: { emoji: string; label: string; href?: string }[] = [
  { emoji: "📅", label: "Новое свидание" },
  { emoji: "💌", label: "Воспоминание", href: routes.memories.path },
  { emoji: "🎫", label: "Купон" },
  { emoji: "🎁", label: "Сюрприз" },
  { emoji: "⭐", label: "Цель" },
];

export function QuickAddSheet() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Создать событие"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex size-10 items-center justify-center rounded-full bg-(--hwd-primary) text-xl font-extrabold text-white shadow-[0_16px_35px_-12px_var(--hwd-glow)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-(--hwd-primary-deep) focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
      >
        <span aria-hidden>＋</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-white/70 bg-white/80 p-2 shadow-2xl shadow-black/10 backdrop-blur-xl">
          <p className="px-3 pb-1 pt-1.5 text-[0.65rem] font-extrabold uppercase tracking-wide text-(--hwd-ink-soft)">
            Добавить в мир
          </p>
          {ACTIONS.map((action) => {
            const className =
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-(--hwd-ink) transition-colors hover:bg-white/70 hover:text-(--hwd-primary) focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)";

            if (action.href) {
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  onClick={() => setOpen(false)}
                  className={className}
                >
                  <span aria-hidden className="text-lg">
                    {action.emoji}
                  </span>
                  {action.label}
                </Link>
              );
            }

            return (
              <button
                key={action.label}
                type="button"
                onClick={() => setOpen(false)}
                className={className}
              >
                <span aria-hidden className="text-lg">
                  {action.emoji}
                </span>
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
