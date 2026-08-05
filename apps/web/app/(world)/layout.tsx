"use client";

import { AuthProvider, RequireAuth } from "@/lib/auth";
import { GenderProvider } from "@/lib/theme";
import { MoodProvider } from "@/lib/mood";
import { WorldShell } from "@/features/world/WorldShell";

// The logged-in world: auth guard + gender/mood theme providers + the living
// world shell. RequireAuth возвращает на /login, пока нет пользователя.
export default function WorldLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GenderProvider>
        <MoodProvider>
          <RequireAuth>
            <WorldShell>{children}</WorldShell>
          </RequireAuth>
        </MoodProvider>
      </GenderProvider>
    </AuthProvider>
  );
}
