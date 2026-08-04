"use client";

import { useGender } from "@/lib/theme";
import { AmbientBackground } from "@/components/AmbientBackground";
import { WorldArt } from "@/features/auth/WorldArt";
import { Logo } from "@/components/Logo";
import motion from "@/components/motion.module.css";

const SECTION_CHIPS = [
  "💌 Воспоминания",
  "🎫 Купоны",
  "📅 Свидания",
  "🎁 Сюрпризы",
  "⭐ Цели",
  "😊 Настроение",
];

// The shell every auth page lives inside: ambient living world on the left,
// the form on the right. `data-gender` on the root is the single switch that
// re-tints every theme-driven CSS variable in the tree.
export function AuthShell({ children }: { children: React.ReactNode }) {
  const { gender } = useGender();

  return (
    <div
      data-gender={gender ?? "neutral"}
      className="relative min-h-svh w-full overflow-hidden font-sans text-(--hwd-ink)"
    >
      <AmbientBackground />

      {/* Soft top light so glass cards keep breathing. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.45),transparent_58%)]"
      />

      <main className="relative z-10 flex min-h-svh w-full flex-col px-5 pb-10 pt-6 sm:px-8 lg:px-12 xl:px-16">
        <div className="flex items-center justify-between">
          <Logo />
          <p className="hidden text-sm font-bold text-(--hwd-ink-soft) sm:block">
            — это ваша история
          </p>
        </div>

        <div className="grid flex-1 items-center gap-12 py-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div className="hidden flex-col items-center gap-10 text-center lg:flex">
            <div className="relative">
              <WorldArt />
              <div
                className={`${motion.float} absolute -bottom-3 right-1 rounded-2xl bg-white/70 px-4 py-2.5 shadow-xl shadow-black/5 backdrop-blur-md`}
              >
                <div className="text-xs font-bold text-(--hwd-ink-soft)">Вы вместе</div>
                <div className="text-sm font-extrabold text-(--hwd-ink)">🔥 уже 127 дней</div>
              </div>
            </div>

            <div className="max-w-sm">
              <h1 className="text-4xl font-extrabold leading-[1.15]">
                Ваш мир растёт вместе с вами
              </h1>
              <p className="mt-3 text-lg font-semibold text-(--hwd-ink-soft)">
                Каждое свидание, купон и воспоминание — новая веточка вашей истории.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SECTION_CHIPS.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-white/60 px-3 py-1.5 text-sm font-bold shadow-sm backdrop-blur-md"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className={motion.enter}>{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
