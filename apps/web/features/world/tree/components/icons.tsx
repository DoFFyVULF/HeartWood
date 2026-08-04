// Локальный набор штриховых SVG-иконок для мира и дерева — инлайн, без
// зависимостей. Все наследуют цвет через `currentColor`; размер задаётся
// снаружи (className). Никаких эмодзи: значки — контуры в стиле страниц
// купонов и воспоминаний.

interface IconProps {
  className?: string;
}

/* ─── Метафора мира ───────────────────────────────────────────── */

/** Лист — виды и рост. */
export function LeafIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 20c0-8 5-13.5 15-15.5.2 10-5.2 15.5-13.2 15.5" />
      <path d="M6.5 17.5C9.5 13 13 10 18 7" />
    </svg>
  );
}

/** Пламя — серия дней подряд. */
export function FlameIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21c3.5 0 6-2.6 6-6 0-2-1-3.6-2.2-4.8-.6 1-1.4 1.8-2.3 2.3.4-3.6-1-7.6-4.6-9.5.3 2.6-.8 4.7-2.6 6C4.6 10.4 4 12.2 4 15c0 3.4 2.5 6 8 6Z" />
      <path d="M12 21c-1.8 0-3-1.3-3-3 0-1.4 1-2.4 2.2-3.2C12.5 15.8 13.6 16.6 14 17.8c.3.8-.3 3.2-2 3.2Z" />
    </svg>
  );
}

/** Сердечко — тёплые события истории. */
export function HeartIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20.5s-7.5-4.8-9.3-9.1C1.3 8 3.7 5 6.9 5c1.9 0 3.4 1 4.1 2.5C11.7 6 13.2 5 15.1 5c3.2 0 5.6 3 4.2 6.4-1.8 4.3-9.3 9.1-9.3 9.1Z" />
    </svg>
  );
}

/* ─── Спутники мира ───────────────────────────────────────────── */

/** Письмо-конверт — воспоминания. */
export function MemoryIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
    </svg>
  );
}

/** Смайл-настроение — для Mood и «в порядке». */
export function MoodIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 10h.01M15.5 10h.01" strokeWidth="2.4" />
      <path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" />
    </svg>
  );
}

/** Календарь — свидания. */
export function DateIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
      <path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" />
      <path d="M9 15.5h.01M12.5 15.5h.01M16 15.5h.01" strokeWidth="2.4" />
    </svg>
  );
}

/** Подарок — сюрприз. */
export function SurpriseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="4" y="10.5" width="16" height="9" rx="1.5" />
      <path d="M4 15h16M12 10.5v9" />
      <path d="M12 10.5c-3.5 0-5.5-2-5.5-3.5S9 5 10.5 6C11 6.5 12 8.5 12 10.5Z" />
      <path d="M12 10.5c3.5 0 5.5-2 5.5-3.5S15 5 13.5 6C13 6.5 12 8.5 12 10.5Z" />
    </svg>
  );
}

/** Звезда — цели. */
export function StarIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.5 14.6 9l6 .9-4.4 4.3 1.1 6L12 17.4l-5.3 2.8 1.1-6L3.4 9.9l6-.9L12 3.5Z" />
    </svg>
  );
}

/** Билет — купоны. */
export function CouponIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 0 0 3V14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5a1.5 1.5 0 0 0 0-3V8Z" />
      <path d="M12 6v12" strokeDasharray="2 2" />
    </svg>
  );
}

/* ─── События (EventBurst) ────────────────────────────────────── */

/** Сообщение — пузырь. */
export function MessageIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 5.5h16A1.5 1.5 0 0 1 21.5 7v8a1.5 1.5 0 0 1-1.5 1.5H11l-4.5 3.5v-3.5H4A1.5 1.5 0 0 1 2.5 15V7A1.5 1.5 0 0 1 4 5.5Z" />
    </svg>
  );
}

/** Микрофон — голос. */
export function VoiceIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M5.5 12a6.5 6.5 0 0 0 13 0" />
      <path d="M12 18.5V21" />
    </svg>
  );
}

/** Звезда-веха — milestone. */
export function MilestoneIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.5 14.6 9l6 .9-4.4 4.3 1.1 6L12 17.4l-5.3 2.8 1.1-6L3.4 9.9l6-.9L12 3.5Z" />
      <path d="M12 8v5M12 16.2h.01" strokeWidth="2.2" />
    </svg>
  );
}

/* ─── Настроения партнёра ─────────────────────────────────────── */

export function SunIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </svg>
  );
}

export function RainIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 14.5c-1.6.2-3.5-1.6-3-3.4.4-1.5 2-2.4 3.4-2.1.3-2.6 3-4.5 5.5-3.6 1.8.6 2.7 2.4 2.4 4.1.7.2 1.3.5 1.9.9 1.1.9 1.3 2.6.3 3.8-.7.8-1.8 1.2-2.9 1.1" />
      <path d="M8 18.5l-1 1.8M12 18.5l-1 1.8M16 18.5l-1 1.8" />
    </svg>
  );
}

export function StormIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 14.5c-1.6.2-3.5-1.6-3-3.4.4-1.5 2-2.4 3.4-2.1.3-2.6 3-4.5 5.5-3.6 1.8.6 2.7 2.4 2.4 4.1.7.2 1.3.5 1.9.9 1.1.9 1.3 2.6.3 3.8-.7.8-1.8 1.2-2.9 1.1" />
      <path d="m12.5 16-2 4h3l-1.5 3.5M16 13l-1 2.5" />
    </svg>
  );
}

export function RainbowIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M3.5 15a8.5 8.5 0 0 1 17 0" />
      <path d="M6.5 15a5.5 5.5 0 0 1 11 0" />
      <path d="M9.5 15a2.5 2.5 0 0 1 5 0" />
    </svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

/* ─── Стадии роста ────────────────────────────────────────────── */

export function SeedIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <ellipse cx="12" cy="13" rx="6.5" ry="7.5" />
      <path d="M12 9.5c0-2 .8-3.5 2-4.5 1.5 2 1.5 4 0 5.5M12 10.5c0 2 .8 3.5 2 4.5 1.5-2 1.5-4 0-5.5M12 9.5v2" />
    </svg>
  );
}

export function SproutIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21V9" />
      <path d="M12 10c0-3.5 3.5-5 7-4.5C18.5 9.5 15 11 12 10Z" />
      <path d="M12 8c0-3.5-3.5-5-7-4.5C5.5 7.5 9 9 12 8Z" />
    </svg>
  );
}

export function SaplingIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21V10" />
      <path d="M12 13.5c2.5 0 4.5-2 5.5-5 .2-1.4-.3-2.6-.5-3.5-.9.2-2.1.7-3 1.5C11.5 8 11 10 11.5 12M12 11.5c-2.5 0-4.5-2-5.5-5-.2-1.4.3-2.6.5-3.5.9.2 2.1.7 3 1.5 1.5 1.5 2 3.5 1.5 5.5" />
    </svg>
  );
}

export function PotIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 9.5c0-1.5 1-2.5 2.5-2.5 1 0 1.5-.5 2.5-.5s1.5.5 2.5.5C16 7 17 8 17 9.5" />
      <path d="M8 9.5h8l-.8 9.2a2 2 0 0 1-2 1.8h-2.4a2 2 0 0 1-2-1.8L8 9.5Z" />
      <path d="M9.5 13.5l1.5-1 1.5 1 1.5-1" />
    </svg>
  );
}

export function BloomIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 6.5C10 6.5 9 5 9.5 3.5 11.5 4 12.5 5.5 12 6.5ZM16 9.5c-1.8-.8-3-.3-3.5 1.5 1.8.8 3 .3 3.5-1.5ZM7.5 10.5c.8-1.8 2-2.2 3.5-1.5-.5 1.8-1.5 2.5-3.5 1.5ZM9.5 15c-.5-1.8.5-3 2.5-3.5.8 1.8 0 3-2.5 3.5ZM14.5 15c-2-.5-2.8-1.7-2-3.5 1.8.5 2.8 1.7 2 3.5ZM12 17.5c-2 0-3 1.5-2.5 3 2-.5 3-2 2.5-3Z" />
    </svg>
  );
}

export function TreeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3.5c.5 2 3 4 5.5 5.5-1.5.5-2.5 1-3.5 2.5C16 11.5 18 12 20 14c-2.5.5-4 1.5-4.5 3.5" />
      <path d="M12 3.5c-.5 2-3 4-5.5 5.5 1.5.5 2.5 1 3.5 2.5C8 11.5 6 12 4 14c2.5.5 4 1.5 4.5 3.5" />
      <path d="M12 3.5V8" />
      <path d="M12 14.5 9 17.5M12 14.5l3 3M12 14.5V18" />
      <path d="M12 18c-1.8 0-3.5.8-4.5 2h9c-1-1.2-2.7-2-4.5-2Z" />
    </svg>
  );
}

export function PineIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2.5 15 6.5h-6l3-4Z" />
      <path d="M11 6.5 14 10.5H8l3-4Z" />
      <path d="M11.5 10.5 14.5 14.5h-5l3-4Z" />
      <path d="M12 14.5V19" />
      <path d="M9.5 19.5h5" />
      <path d="M10 22c.5-.8 1-1 2-1s1.5.2 2 1" />
    </svg>
  );
}

export function WorldTreeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M4.5 10.5c2-1 4-1.5 5.5-1.2 1.8.4 2.7 2 2.7 2s2.3-1.5 6-.3" />
      <path d="M7 15.5c1.6-1.2 3.4-1.8 5-1.6 1.5.2 2.4 1 2.4 1s1.6-.8 4.4-.6" />
      <path d="M12 3.5v1M12 19.5v1M3.5 12h1M19.5 12h1" />
    </svg>
  );
}

/** Пробирка — тестовая панель (только для разработки). */
export function FlaskIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 3h4M10.5 3v6L5.5 18a1.8 1.8 0 0 0 1.6 2.7h9.8a1.8 1.8 0 0 0 1.6-2.7l-5-9V3" />
      <path d="M7 15.5h10" />
    </svg>
  );
}

/** Стрелка-шеврон — «вся история» и перенос чипов. */
export function ChevronIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
