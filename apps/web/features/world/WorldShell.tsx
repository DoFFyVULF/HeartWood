"use client";

import { useGender } from "@/lib/theme";
import { AmbientBackground } from "@/components/AmbientBackground";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";

// The shell every world page lives inside: ambient living background, sticky
// glass header, the page content and the mobile tab bar. `data-gender` on the
// root is the single switch that re-tints every theme-driven CSS variable.
export function WorldShell({ children }: { children: React.ReactNode }) {
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

      <Header />

      {/* Контент на всю ширину экрана — никакого узкого центра. Отступы
          нарастают с шириной, чтобы широкие карточки не липли к краям. */}
      <main className="relative z-10 w-full px-5 pb-28 pt-8 sm:px-8 lg:px-12 xl:px-16">
        {children}
      </main>

      {/* Footer whisper — one quiet line closing the scene. */}
      <footer className="relative z-10 px-5 pb-28 pt-2 text-center lg:pb-10">
        <p className="text-sm font-semibold text-(--hwd-ink-soft)">
          Каждый день — новая веточка вашей истории
        </p>
      </footer>

      <BottomTabBar />
    </div>
  );
}
