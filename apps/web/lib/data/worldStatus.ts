// Single source of truth for the home world ("Ваш мир"). Every satellite,
// badge and stat reads from here, so the world's future reactivity (activity →
// more glow, quiet → calmer) lands as data changes — never as layout edits.

export type WorldIcon =
  | "memory"
  | "mood"
  | "date"
  | "surprise"
  | "goal"
  | "coupon"
  | "flame"
  | "heart"
  | "photo";

export interface WorldSatellite {
  key: string;
  icon: WorldIcon;
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
  icon: WorldIcon;
  text: string;
  time: string;
}

export interface WorldStat {
  icon: WorldIcon;
  value: string;
  label: string;
}

export const worldStatus = {
  couple: "Аня и Дима",
  streak: 127,
  /** Стадия роста дерева (0–7) и прогресс к следующей (0–1). */
  level: 1 as const,
  levelProgress: 0.4,
  greeting: "Добрый день, Аня и Дима",

  satellites: [
    {
      key: "memories",
      icon: "memory",
      label: "Воспоминания",
      status: "Пикник у реки",
      path: "/memories",
    },
    {
      key: "mood",
      icon: "mood",
      label: "Настроение",
      status: "Аня в порядке",
    },
    {
      key: "dates",
      icon: "date",
      label: "Свидания",
      status: "Сб, 2 авг · 19:00",
      badge: "1",
    },
    {
      key: "surprise",
      icon: "surprise",
      label: "Сюрприз",
      status: "Тебя ждёт сюрприз",
      urgent: true,
    },
    {
      key: "goals",
      icon: "goal",
      label: "Цели",
      status: "Копим на море",
      path: "/goals",
      progress: 62,
    },
    {
      key: "coupons",
      icon: "coupon",
      label: "Купоны",
      status: "2 активных купона",
      path: "/coupons",
      badge: "2",
    },
  ] satisfies WorldSatellite[],

  history: [
    {
      icon: "memory",
      text: "Аня добавила воспоминание «Пикник у реки»",
      time: "2 часа назад",
    },
    { icon: "flame", text: "День 127 вместе", time: "сегодня" },
    { icon: "surprise", text: "Дима открыл сюрприз", time: "вчера" },
  ] satisfies HistoryEvent[],

  stats: [
    { icon: "flame", value: "127", label: "дней вместе" },
    { icon: "photo", value: "48", label: "воспоминаний" },
    { icon: "date", value: "23", label: "свидания" },
    { icon: "coupon", value: "12", label: "купонов" },
  ] satisfies WorldStat[],
};
