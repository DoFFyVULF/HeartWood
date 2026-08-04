import { worldStatus } from "@/lib/data/worldStatus";

// A slim, scannable summary of the couple's bond — no new cards, just one line.
export function StatsStrip() {
  return (
    <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {worldStatus.stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/50 px-3 py-2.5 shadow-sm backdrop-blur-md"
        >
          <span aria-hidden className="text-lg">
            {stat.emoji}
          </span>
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">{stat.label}</dt>
            <dd className="text-sm font-extrabold text-(--hwd-ink)">
              {stat.value}
            </dd>
            <span className="text-xs font-semibold text-(--hwd-ink-soft)">
              {stat.label}
            </span>
          </div>
        </div>
      ))}
    </dl>
  );
}
