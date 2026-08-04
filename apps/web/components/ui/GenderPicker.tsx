"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import type { Gender } from "@/lib/theme";
import styles from "./GenderPicker.module.css";
import motion from "@/components/motion.module.css";

interface GenderPickerProps {
  value: Gender | null;
  onChange: (gender: Gender) => void;
  error?: string;
}

interface SplashState {
  x: number;
  y: number;
  color: string;
}

const CARD_META = {
  boy: {
    emoji: "💙",
    label: "Мальчик",
    caption: "мягкий, как небо",
    tint: "bg-sky-100",
    splash: "rgba(59, 130, 246, 0.45)",
    message: "Ваш мир окрасится в цвет неба",
  },
  girl: {
    emoji: "💗",
    label: "Девочка",
    caption: "тёплая, как рассвет",
    tint: "bg-pink-100",
    splash: "rgba(236, 72, 153, 0.45)",
    message: "Ваш мир окрасится в цвет рассвета",
  },
} as const;

type CardKey = keyof typeof CARD_META;

export function GenderPicker({ value, onChange, error }: GenderPickerProps) {
  const boyRef = useRef<HTMLButtonElement>(null);
  const girlRef = useRef<HTMLButtonElement>(null);
  const [splash, setSplash] = useState<SplashState | null>(null);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function select(gender: Gender) {
    onChange(gender);
    if (prefersReducedMotion) return;

    const el = (gender === "boy" ? boyRef : girlRef).current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const meta = CARD_META[gender as CardKey];

    setSplash({ x, y, color: meta.splash });
    window.setTimeout(() => setSplash(null), 1200);
  }

  function renderCard(key: CardKey, ref: React.RefObject<HTMLButtonElement | null>) {
    const meta = CARD_META[key];
    const active = value === key;

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={active}
        aria-label={`Выбрать: ${meta.label}`}
        onClick={() => select(key)}
        className={cn(
          "relative flex flex-col items-center gap-2 rounded-3xl border-2 px-4 py-5 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)",
          active
            ? `${motion.bounceIn} border-(--hwd-primary) bg-(--hwd-primary) text-white shadow-[0_20px_45px_-15px_var(--hwd-glow)]`
            : "border-white/70 bg-white/50 text-(--hwd-ink) shadow-sm hover:-translate-y-0.5 hover:bg-white/75 hover:shadow-md"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full text-3xl transition-colors",
            active ? "bg-white/25" : meta.tint
          )}
        >
          {meta.emoji}
        </span>
        <span className="text-base font-extrabold">{meta.label}</span>
        <span
          className={cn(
            "text-xs font-bold opacity-70",
            active ? "text-white" : "text-(--hwd-ink-soft)"
          )}
        >
          {meta.caption}
        </span>
      </button>
    );
  }

  const activeMeta = value ? CARD_META[value as CardKey] : null;

  return (
    <div>
      <span
        role="radiogroup"
        aria-label="Выберите, чей мир вы создаёте"
        className="grid grid-cols-2 gap-3"
      >
        {renderCard("boy", boyRef)}
        {renderCard("girl", girlRef)}
      </span>

      {error && !value ? (
        <p role="alert" className="mt-2 text-xs font-bold text-rose-500">
          {error}
        </p>
      ) : activeMeta ? (
        <p
          role="status"
          className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-(--hwd-ink-soft)"
        >
          <span aria-hidden>{activeMeta.emoji}</span>
          {activeMeta.message}
        </p>
      ) : null}

      {/* Paint-splash ripple from the clicked card, rendered above everything. */}
      {splash &&
        createPortal(
          <div aria-hidden className="pointer-events-none fixed inset-0 z-50">
            <div
              className={`${styles.splash} absolute h-24 w-24 rounded-full`}
              style={{
                left: splash.x,
                top: splash.y,
                background: splash.color,
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
