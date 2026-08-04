"use client";

import Link from "next/link";
import motion from "@/components/motion.module.css";

interface SuccessPanelProps {
  emoji: string;
  title: string;
  subtitle: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}

export function SuccessPanel({
  emoji,
  title,
  subtitle,
  primary,
  secondary,
}: SuccessPanelProps) {
  return (
    <div className="flex flex-col items-center rounded-[2rem] border border-white/70 bg-white/60 px-6 py-12 text-center shadow-2xl shadow-black/5 backdrop-blur-xl">
      <div aria-hidden className={`${motion.pulse} block text-6xl`}>
        {emoji}
      </div>
      <h2 className="mt-4 text-2xl font-extrabold text-(--hwd-ink)">{title}</h2>
      <p className="mt-2 max-w-xs text-sm font-semibold text-(--hwd-ink-soft)">
        {subtitle}
      </p>

      {primary && (
        <Link
          href={primary.href}
          className="mt-7 w-full rounded-2xl bg-(--hwd-primary) px-6 py-3.5 text-base font-extrabold text-white shadow-[0_16px_35px_-12px_var(--hwd-glow)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-(--hwd-primary-deep) focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
        >
          {primary.label}
        </Link>
      )}
      {secondary && (
        <Link
          href={secondary.href}
          className="mt-4 text-sm font-extrabold text-(--hwd-ink-soft) underline-offset-4 hover:underline focus-visible:outline-none focus-visible:underline"
        >
          {secondary.label}
        </Link>
      )}
    </div>
  );
}
