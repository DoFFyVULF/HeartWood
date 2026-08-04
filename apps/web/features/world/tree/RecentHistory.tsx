import { worldStatus } from "@/lib/data/worldStatus";

// The narrative spine below the orbit: the last shared moments as a single
// wide glass card. Keeps the world from feeling like just a dashboard.
export function RecentHistory() {
  return (
    <section
      aria-labelledby="recent-history-title"
      className="mt-10 rounded-[2rem] border border-white/70 bg-white/60 p-6 shadow-2xl shadow-black/5 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <h2
          id="recent-history-title"
          className="text-base font-extrabold text-(--hwd-ink)"
        >
          Недавняя история
        </h2>
        <a
          href="#"
          className="text-sm font-extrabold text-(--hwd-ink-soft) underline-offset-4 transition-colors hover:text-(--hwd-primary) hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
        >
          Вся история →
        </a>
      </div>

      <ul className="mt-4 divide-y divide-black/5">
        {worldStatus.history.map((event, index) => (
          <li key={index} className="flex items-center gap-3 py-3">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--hwd-primary-soft) text-lg"
            >
              {event.emoji}
            </span>
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-(--hwd-ink)">
              {event.text}
            </p>
            <span className="shrink-0 text-xs font-semibold text-(--hwd-ink-soft)">
              {event.time}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
