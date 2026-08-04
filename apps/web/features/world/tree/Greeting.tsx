import { worldStatus } from "@/lib/data/worldStatus";

// A quiet personal welcome above the world stage. The date is intentionally
// omitted — a server-rendered live date would freeze at build time (static
// page) or risk a hydration mismatch; the greeting alone stays warm.
export function Greeting() {
  return (
    <div className="mb-2 flex flex-col items-center gap-1 text-center">
      <p className="text-xl font-extrabold text-(--hwd-ink) sm:text-2xl">
        {worldStatus.greeting}
      </p>
      <p className="text-sm font-semibold text-(--hwd-ink-soft)">
        Ваш мир живой — загляните, что в нём нового ✨
      </p>
    </div>
  );
}
