"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { MOODS } from "@/lib/moods";
import { useMood } from "@/lib/mood";

/**
 * Выбор текущего настроения прямо из хедера.
 *
 * Кнопка показывает эмодзи выбранного настроения (или нейтральное, пока не
 * выбрано). По клику — стеклянный поповер со списком настроений: выбор
 * записывается в MoodProvider (localStorage) и тут же перекрашивает чип
 * настроения на карточке профиля. Закрытие по клику вне и Esc — тот же
 * паттерн, что у StreakBadge.
 */
export function MoodPicker({ className }: { className?: string }) {
  const { mood, setMood } = useMood();
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  // Закрытие по клику вне бейджа и по Esc.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const emoji = mood?.emoji ?? "😊";
  const label = mood ? mood.name : "Настроение";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={popoverId}
        aria-label={mood ? `Настроение: ${mood.label} — изменить` : "Выбрать настроение"}
        title={label}
        onClick={() => setOpen((v) => !v)}
        className="flex size-10 items-center justify-center rounded-full border border-white/60 bg-white/55 text-lg shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
      >
        <span aria-hidden className="leading-none">
          {emoji}
        </span>
        <span className="sr-only">{label}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="mood-popover"
            id={popoverId}
            role="dialog"
            aria-label="Выберите своё настроение"
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-white/70 bg-white/80 p-2 shadow-2xl shadow-black/10 backdrop-blur-xl"
          >
            <p className="px-3 pb-1 pt-1.5 text-[0.65rem] font-extrabold uppercase tracking-wide text-(--hwd-ink-soft)">
              Моё настроение
            </p>
            {MOODS.map((option) => {
              const active = mood?.id === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setMood(option.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-(--hwd-ink) transition-colors hover:bg-white/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)",
                    active && "bg-white/80 text-(--hwd-primary)"
                  )}
                >
                  <span aria-hidden className="text-lg">
                    {option.emoji}
                  </span>
                  {option.name}
                  {active && (
                    <span aria-hidden className="ml-auto font-black text-(--hwd-primary)">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
