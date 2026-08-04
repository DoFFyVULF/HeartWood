// Данные страницы «Цели» — единый источник правды для копилок пары.
//
// Копилки ведутся В РУБЛЯХ — как настоящие сбережения на общую мечту
// (см. docs/design-decisions.md). Это не внутренняя валюта «сердечки»:
// цель «Копим на море» собирает реальные деньги на поездку.
//
// Механика вклада — локальная игра: кнопка «В копилку» добавляет
// фиксированную сумму (GOAL_CONTRIBUTION) в общий кошелёк из localStorage,
// без списания сердечек. Пока бэкенда нет, это «бумажная» симуляция —
// но суммы живые, по-русски и с удобным форматированием.
//
// Seed-цели живут здесь как иммутабельные константы; состояние (вклады,
// новые цели) меняется в localStorage — см. features/world/goals/useGoals.ts.
// Прогресс спутника «Цели» на главной (worldStatus) повторяет первую цель.

/** Кто вёл цель / внёс вклад — id участника из coupleProfile. */
export type AuthorId = "dima" | "anya";

/** Визуальная категория — маппится на SVG-иконку на странице целей. */
export type GoalKind = "trip" | "home" | "celebration";

/** Веха внутри цели — маленький шаг на пути. */
export interface GoalMilestone {
  label: string;
  /** 0–100 — насколько веха близка (рисуется тонким бруском). */
  progress: number;
}

export interface CoupleGoal {
  /** Стабильный id; у seeds — строки вида "seed-…". */
  id: string;
  kind: GoalKind;
  title: string;
  description: string;
  /** Сколько уже накоплено, рублей. */
  saved: number;
  /** Сколько нужно всего, рублей. */
  target: number;
  /** Прогресс 0–100 — считается из saved/target; резерв на случай явного значения. */
  progress?: number;
  /** SSR-safe срок: «к августу». */
  deadline: string;
  /** SSR-safe подпись для последнего вклада: «вчера». */
  updatedAt?: string;
  /** Вехи цели. */
  milestones: GoalMilestone[];
  /** Кто сколько внёс суммарно (для строки «в копилке у каждого»). */
  contributions: Record<AuthorId, number>;
}

/** Копилки пары из коробки. Суммы в рублях. */
export const seedGoals: CoupleGoal[] = [
  {
    id: "seed-sea",
    kind: "trip",
    title: "Копим на море",
    description:
      "Неделя на берегу: закаты, солёный воздух и ни одного будильника.",
    saved: 37200,
    target: 60000,
    deadline: "к августу",
    updatedAt: "вчера",
    milestones: [
      { label: "Виза и билеты", progress: 100 },
      { label: "Отель у воды", progress: 40 },
      { label: "Копилка на вечер", progress: 15 },
    ],
    contributions: { dima: 20000, anya: 17200 },
  },
  {
    id: "seed-sofa",
    kind: "home",
    title: "Диван для уютных вечеров",
    description:
      "Совместный кинопросмотр без споров, кто первый — сериал или футбол.",
    saved: 25500,
    target: 75000,
    deadline: "к зиме",
    milestones: [
      { label: "Присмотрели модель", progress: 100 },
      { label: "Измерили гостиную", progress: 100 },
      { label: "Договорились о цвете", progress: 20 },
    ],
    contributions: { dima: 14000, anya: 11500 },
  },
  {
    id: "seed-anniversary",
    kind: "celebration",
    title: "Годовщина на закате",
    description:
      "Пикник с пледом, гитара и ровно столько сюрпризов, сколько поместится в корзину.",
    saved: 10500,
    target: 15000,
    deadline: "к 14 февраля",
    milestones: [
      { label: "Забронировали поляну", progress: 100 },
      { label: "Плейлист вечера", progress: 70 },
    ],
    contributions: { dima: 4500, anya: 6000 },
  },
];

/** Сколько рублей даёт один вклад в копилку. */
export const GOAL_CONTRIBUTION = 500;
