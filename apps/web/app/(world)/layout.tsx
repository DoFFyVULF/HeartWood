"use client";

import { GenderProvider } from "@/lib/theme";
import { MoodProvider } from "@/lib/mood";
import { WorldShell } from "@/features/world/WorldShell";

// The logged-in world: gender + mood theme providers + the living world shell.
// MoodProvider держит выбранное настроение пользователя — хедер и профиль
// читают его, чтобы чип настроения менялся реактивно.
export default function WorldLayout({ children }: { children: React.ReactNode }) {
  return (
    <GenderProvider>
      <MoodProvider>
        <WorldShell>{children}</WorldShell>
      </MoodProvider>
    </GenderProvider>
  );
}
