"use client";

import { GenderProvider } from "@/lib/theme";
import { AuthShell } from "@/features/auth/AuthShell";

// All auth pages share the living world shell and the persisted gender theme.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GenderProvider>
      <AuthShell>{children}</AuthShell>
    </GenderProvider>
  );
}
