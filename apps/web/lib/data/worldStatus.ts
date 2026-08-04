// Single source of truth for the home world ("Ваш мир"). Every satellite,
// badge and stat reads from here, so the world's future reactivity (activity →
// more glow, quiet → calmer) lands as data changes — never as layout edits.

export interface WorldSatellite {
  key: string;
  emoji: string;
  label: string;
  status: string;
  /** Если у спутника есть своя страница — рендерим Link вместо заглушки. */
  path?: string;
  /** Urgent satellites (surprise waiting) get a glowing ping. */
  urgent?: boolean;
  /** Small count badge in the medallion corner, e.g. unread = 3. */
  badge?: string;
  /** Optional goal progress 0–100, rendered as a tiny bar. */
  progress?: number;
}

export interface HistoryEvent {
  emoji: string;
  text: string;
  time: string;
}

export interface WorldStat {
  emoji: string;
  value: string;
  label: string;
}

export const worldStatus = {
  couple: "Аня и Дима",
  streak: 127,
  /** Стадия роста дерева (0–7) и прогресс к следующей (0–1). */
  level: 1 as const,
  levelProgress: 0.4,
  greeting: "Добрый день, Аня и Дима 💛",

  satellites: [
    {
      key: "memories",
      emoji: "💌",
      label: "Воспоминания",
      status: "Пикник у реки 🧺",
      path: "/memories",
    },
    {
      key: "mood",
      emoji: "😊",
      label: "Настроение",
      status: "Аня в порядке 💛",
    },
    {
      key: "dates",
      emoji: "📅",
      label: "Свидания",
      status: "Сб, 2 авг · 19:00",
      badge: "1",
    },
    {
      key: "surprise",
      emoji: "🎁",
      label: "Сюрприз",
      status: "Тебя ждёт сюрприз! 🎉",
      urgent: true,
    },
    {
      key: "goals",
      emoji: "⭐",
      label: "Цели",
      status: "Копим на море",
      progress: 62,
    },
    {
      key: "coupons",
      emoji: "🎫",
      label: "Купоны",
      status: "2 активных купона",
      path: "/coupons",
      badge: "2",
    },
  ] satisfies WorldSatellite[],

  history: [
    {
      emoji: "🧺",
      text: "Аня добавила воспоминание «Пикник у реки»",
      time: "2 часа назад",
    },
    { emoji: "🔥", text: "День 127 вместе", time: "сегодня" },
    { emoji: "🎁", text: "Дима открыл сюрприз", time: "вчера" },
  ] satisfies HistoryEvent[],

  stats: [
    { emoji: "🔥", value: "127", label: "дней вместе" },
    { emoji: "📸", value: "48", label: "воспоминаний" },
    { emoji: "📅", value: "23", label: "свидания" },
    { emoji: "🎫", value: "12", label: "купонов" },
  ] satisfies WorldStat[],
};
