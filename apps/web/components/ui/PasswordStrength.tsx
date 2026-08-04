"use client";

import { cn } from "@/lib/utils";
import { passwordScore } from "@/features/auth/validation";

const LABELS = ["Слабенький", "Так себе", "Неплохо", "Крепкий", "Броня ❤️"];
const BAR_COLORS = [
  "bg-rose-400",
  "bg-amber-400",
  "bg-lime-400",
  "bg-emerald-400",
];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = passwordScore(password);

  return (
    <div className="mt-2">
      <div className="flex gap-1.5" aria-hidden>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              index < score ? BAR_COLORS[Math.min(score - 1, 3)] : "bg-white/60"
            )}
          />
        ))}
      </div>
      <p
        role="status"
        className="mt-1.5 text-xs font-bold text-(--hwd-ink-soft)"
      >
        {LABELS[score]}
      </p>
    </div>
  );
}
