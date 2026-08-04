import Link from "next/link";
import styles from "./OrbitalStage.module.css";
import { cn } from "@/lib/utils";
import type { WorldSatellite, WorldIcon } from "@/lib/data/worldStatus";
import {
  MemoryIcon,
  MoodIcon,
  DateIcon,
  SurpriseIcon,
  StarIcon,
  CouponIcon,
  FlameIcon,
  HeartIcon,
} from "./components/icons";

interface SatelliteProps {
  data: WorldSatellite;
  variant: "chip" | "card";
}

// Иконка спутника по его ключу — без эмодзи, штриховой контур в currentColor.
const SATELLITE_ICON: Record<WorldIcon, (props: { className?: string }) => React.ReactElement> = {
  memory: MemoryIcon,
  mood: MoodIcon,
  date: DateIcon,
  surprise: SurpriseIcon,
  goal: StarIcon,
  coupon: CouponIcon,
  flame: FlameIcon,
  heart: HeartIcon,
  photo: MemoryIcon,
};

// One satellite component, rendered two ways off the same data: a compact
// pill for the garden chip rail (chip) or a fuller card with status and
// progress (card). Never two definitions of the same satellite.
export function Satellite({ data, variant }: SatelliteProps) {
  const href = data.path;
  const Icon = SATELLITE_ICON[data.icon] ?? StarIcon;

  const medallion = (
    <span
      aria-hidden
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--hwd-primary)_28%,transparent)] bg-[color-mix(in_srgb,var(--hwd-primary-soft)_55%,#ffffff)] text-(--hwd-primary-deep) shadow-[inset_0_1px_0_rgb(255_255_255_/_0.7)]",
        variant === "chip" ? "size-8" : "size-10"
      )}
    >
      <Icon className={variant === "chip" ? "size-4" : "size-5"} />
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
    "group relative flex shrink-0 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--hwd-ink-soft)_22%,transparent)] bg-white/70 py-1.5 pl-1.5 pr-3.5 shadow-[0_10px_24px_-16px_rgb(30_27_60_/_0.35)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--hwd-primary)_40%,transparent)] hover:bg-white/90 hover:shadow-[0_16px_30px_-18px_var(--hwd-glow)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)";

  const cardClass = cn(
    "group relative flex items-center gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--hwd-ink-soft)_22%,transparent)] bg-white/70 px-4 py-3 shadow-[0_14px_34px_-22px_rgb(30_27_60_/_0.35),inset_0_1px_0_rgb(255_255_255_/_0.85)] backdrop-blur-md transition-all duration-300",
    "hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--hwd-primary)_40%,transparent)] hover:bg-white/90 hover:shadow-[0_22px_44px_-24px_var(--hwd-glow)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
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
              className="block h-full rounded-full bg-(--hwd-primary)"
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
