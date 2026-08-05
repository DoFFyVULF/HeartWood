"use client";

import { useWorld } from "@/lib/api-data";

// A quiet personal welcome above the world stage: eyebrow + title + subtitle,
// the same header pattern as the coupons and memories pages. The date is
// intentionally omitted — a server-rendered live date would freeze at build
// time (static page) or risk a hydration mismatch; the greeting stays warm.
export function Greeting() {
  const { data: world } = useWorld();
  const couple = world?.couple ?? "Ваша пара";
  const greeting = world?.greeting ?? "Добрый день";

  return (
    <header className="mb-6 flex flex-col items-center gap-2 text-center">
      <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--hwd-primary)_26%,transparent)] bg-[color-mix(in_srgb,var(--hwd-primary-soft)_55%,#ffffff)] px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-(--hwd-primary-deep)">
        <span
          aria-hidden
          className="inline-block size-1.5 rounded-full bg-(--hwd-primary) shadow-[0_0_10px_var(--hwd-glow)]"
        />
        {couple}
      </p>
      <h1 className="text-[1.85rem] font-black leading-tight tracking-tight text-(--hwd-ink) sm:text-3xl">
        {greeting}
      </h1>
      <p className="max-w-[28rem] text-sm font-semibold text-(--hwd-ink-soft)">
        Ваш мир живой — загляните, что в нём нового
      </p>
    </header>
  );
}
