import Link from "next/link";
import styles from "./OrbitalStage.module.css";
import { cn } from "@/lib/utils";
import type { WorldSatellite } from "@/lib/data/worldStatus";

interface SatelliteProps {
  data: WorldSatellite;
  variant: "chip" | "card";
}

// One satellite component, rendered two ways off the same data: a compact
// pill for the garden chip rail (chip) or a fuller card with status and
// progress (card). Never two definitions of the same satellite.
// Если у спутника есть path — рендерим Link на его страницу; иначе — та же
// заглушка `<a href="#">`, что была, чтобы не ломать плейсхолдеры.
export function Satellite({ data, variant }: SatelliteProps) {
  const href = data.path;

  const medallion = (
    <span
      aria-hidden
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-(--hwd-primary-soft)",
        variant === "chip" ? "size-8 text-base" : "size-10 text-xl"
      )}
    >
      {data.emoji}
      {data.badge && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-(--hwd-primary) px-1 text-[0.65rem] font-extrabold text-white shadow-md">
          {data.badge}
        </span>
      )}
      {data.urgent && (
        <span
          className={`${styles.pingDot} absolute -right-1 -top-1 size-2.5 rounded-full bg-(--hwd-primary)`}
          role="img"
          aria-label="Новое"
        />
      )}
    </span>
  );

  const chipClass =
    "group relative flex shrink-0 items-center gap-2 rounded-full border border-white/60 bg-white/55 py-1.5 pl-1.5 pr-3.5 shadow-sm backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)";

  const cardClass = cn(
    "group relative flex items-center gap-3 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 shadow-xl shadow-black/5 backdrop-blur-xl transition-all duration-300",
    "hover:-translate-y-0.5 hover:bg-white/80 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
  );

  if (variant === "chip") {
    const inner = (
      <>
        {medallion}
        <span className="text-sm font-extrabold text-(--hwd-ink)">
          {data.label}
        </span>
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          title={data.status || data.label}
          aria-label={data.status ? `${data.label} — ${data.status}` : data.label}
          className={chipClass}
        >
          {inner}
        </Link>
      );
    }

    // Заглушка без страницы — неинтерактивный элемент (в server-компоненте
    // нельзя вешать onClick), поэтому просто span с тем же внешним видом.
    return (
      <span title={data.status || data.label} className={chipClass}>
        {inner}
      </span>
    );
  }

  const cardBody = (
    <>
      {medallion}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-extrabold text-(--hwd-ink)">
          {data.label}
        </span>
        <span className="block truncate text-xs font-semibold text-(--hwd-ink-soft)">
          {data.status}
        </span>
        {typeof data.progress === "number" && (
          <span
            role="progressbar"
            aria-valuenow={data.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Цель «${data.label}»: ${data.progress}%`}
            className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-black/10"
          >
            <span
              className={`${styles.shimmer} block h-full rounded-full`}
              style={{ width: `${data.progress}%` }}
            />
          </span>
        )}
      </span>
      <span aria-hidden className="shrink-0 text-(--hwd-ink-soft)">
        ›
      </span>
    </>
  );

  if (href) {
    return <Link href={href} className={cardClass}>{cardBody}</Link>;
  }

  // Аналогично chip-варианту: заглушка без страницы — неинтерактивный div.
  return (
    <div title={data.status || data.label} className={cardClass}>
      {cardBody}
    </div>
  );
}
