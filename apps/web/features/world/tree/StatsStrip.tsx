import { worldStatus, type WorldIcon } from "@/lib/data/worldStatus";
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

const STAT_ICON: Record<WorldIcon, (props: { className?: string }) => React.ReactElement> = {
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

// A slim, scannable summary of the couple's bond — no new cards, just one line.
export function StatsStrip() {
  return (
    <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {worldStatus.stats.map((stat) => {
        const Icon = STAT_ICON[stat.icon] ?? StarIcon;
        return (
          <div
            key={stat.label}
            className="flex items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--hwd-primary)_24%,rgb(255_255_255_/_0.8))] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.78),rgb(255_255_255_/_0.52))] px-3 py-2.5 shadow-[0_12px_30px_-18px_color-mix(in_srgb,var(--hwd-glow)_45%,transparent),inset_0_1px_0_rgb(255_255_255_/_0.9)] backdrop-blur-md"
          >
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--hwd-primary)_28%,transparent)] bg-[color-mix(in_srgb,var(--hwd-primary-soft)_55%,#ffffff)] text-(--hwd-primary-deep) shadow-[inset_0_1px_0_rgb(255_255_255_/_0.7)]"
            >
              <Icon className="size-4" />
            </span>
            <div className="flex items-baseline gap-1.5">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-sm font-extrabold tabular-nums text-(--hwd-ink)">
                {stat.value}
              </dd>
              <span className="text-xs font-semibold text-(--hwd-ink-soft)">
                {stat.label}
              </span>
            </div>
          </div>
        );
      })}
    </dl>
  );
}
