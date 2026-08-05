"use client";

import { AuthProvider, RedirectIfAuthed } from "@/lib/auth";
import { GenderProvider } from "@/lib/theme";
import { AuthShell } from "@/features/auth/AuthShell";

// All auth pages share the living world shell and the persisted gender theme.
// RedirectIfAuthed уводит залогиненных сразу в мир.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GenderProvider>
        <RedirectIfAuthed>
          <AuthShell>{children}</AuthShell>
        </RedirectIfAuthed>
      </GenderProvider>
    </AuthProvider>
  );
}
