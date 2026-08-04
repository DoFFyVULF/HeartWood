"use client";

import { useGender } from "@/lib/theme";
import motion from "./motion.module.css";

// The heart swaps colour to match the world's palette — a tiny signal that
// the theme is alive everywhere, not just on the background.
export function Logo() {
  const { gender } = useGender();
  const heart = gender === "girl" ? "💗" : gender === "boy" ? "💙" : "💛";

  return (
    <span className="flex select-none items-center gap-2">
      <span aria-hidden className={`${motion.pulse} block text-2xl`}>
        {heart}
      </span>
      <span className="text-xl font-extrabold tracking-tight text-(--hwd-ink)">
        heartwood
      </span>
    </span>
  );
}
