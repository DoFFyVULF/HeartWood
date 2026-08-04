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
  ChevronIcon,
} from "./components/icons";

const EVENT_ICON: Record<WorldIcon, (props: { className?: string }) => React.ReactElement> = {
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

// The narrative spine below the orbit: the last shared moments as a single
// wide card. Keeps the world from feeling like just a dashboard.
export function RecentHistory() {
  return (
    <section
      aria-labelledby="recent-history-title"
      className="mt-10 rounded-[1.5rem] border border-[color-mix(in_srgb,var(--hwd-primary)_24%,rgb(255_255_255_/_0.8))] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.85),rgb(255_255_255_/_0.6))] p-6 shadow-[0_14px_34px_-22px_rgb(30_27_60_/_0.35),inset_0_1px_0_rgb(255_255_255_/_0.85)] backdrop-blur-xl"
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="recent-history-title"
          className="text-base font-extrabold text-(--hwd-ink)"
        >
          Недавняя история
        </h2>
        <a
          href="#"
          className="inline-flex items-center gap-0.5 text-sm font-extrabold text-(--hwd-ink-soft) underline-offset-4 transition-colors hover:text-(--hwd-primary) hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
        >
          Вся история
          <ChevronIcon className="size-4" />
        </a>
      </div>

      <ul className="mt-4 divide-y divide-[color-mix(in_srgb,var(--hwd-ink-soft)_14%,transparent)]">
        {worldStatus.history.map((event, index) => {
          const Icon = EVENT_ICON[event.icon] ?? StarIcon;
          return (
            <li key={index} className="flex items-center gap-3 py-3">
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--hwd-primary)_28%,transparent)] bg-[color-mix(in_srgb,var(--hwd-primary-soft)_55%,#ffffff)] text-(--hwd-primary-deep) shadow-[inset_0_1px_0_rgb(255_255_255_/_0.7)]"
              >
                <Icon className="size-4" />
              </span>
              <p className="min-w-0 flex-1 truncate text-sm font-bold text-(--hwd-ink)">
                {event.text}
              </p>
              <span className="shrink-0 text-xs font-semibold text-(--hwd-ink-soft)">
                {event.time}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
