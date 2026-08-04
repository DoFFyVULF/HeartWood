// Внутренняя валюта пары — «сердечки». Единый источник правды для экономики.
//
// Пока бэкенда нет, кошельки живут в localStorage (см. features/world/hearts/
// useHearts.ts) точно так же, как купонная книжка. Этот файл описывает ТИПЫ,
// человекочитаемые подписи транзакций и правила начисления — он будет служить
// контрактом для будущей серверной реализации (см. docs/hearts-economy.md).
//
// Важно: баланс ЛИЧНЫЙ. У партнёра нельзя посмотреть, сколько у тебя сердечек —
// кошелёк привязан к «я» (кто открыл приложение), а не к просматриваемой
// карточке профиля.

/** За какие действия бывают транзакции сердечек. */
export type HeartTxReason =
  | "daily" // ежедневный вход
  | "memory" // новое воспоминание
  | "date" // свидание
  | "coupon_send" // отправленный партнёру купон
  | "reaction" // реакция на воспоминание
  | "streak" // серия дней подряд
  | "coupon_redeem"; // выкуп купона (РАСХОД — цена сгорает)

/** Одна запись в истории сердечек. */
export interface HeartTx {
  /** Стабильный id записи. */
  id: string;
  reason: HeartTxReason;
  /**
   * Знак несёт направление: +10 заработано, −12 потрачено на выкуп.
   * Ноль не бывает.
   */
  amount: number;
  /** Человеческая подпись: «Ежедневный вход», «Массаж на диване»… */
  label: string;
  /** SSR-safe метка даты «5 августа» (см. useMemories/useCoupons). */
  at: string;
  /** ms-таймстамп для сортировки и фильтрации за 30 дней. */
  ts: number;
}

/** Оформление причины: эмодзи и короткий заголовок для истории. */
export const TX_META: Record<HeartTxReason, { emoji: string; title: string }> = {
  daily: { emoji: "🌅", title: "Ежедневный вход" },
  memory: { emoji: "📸", title: "Воспоминание" },
  date: { emoji: "🎠", title: "Свидание" },
  coupon_send: { emoji: "🎫", title: "Купон отправлен" },
  reaction: { emoji: "💬", title: "Реакция" },
  streak: { emoji: "🔥", title: "Серия дней" },
  coupon_redeem: { emoji: "💛", title: "Выкуп купона" },
};

/**
 * Правило начисления. `wired: true` — уже работает на клиенте (когда действие
 * случается в этом приложении), `wired: false` — описано здесь как контракт
 * для будущего бэкенда. Расход на выкуп купона — единственное правило
 * с отрицательным reward (цена переменная, поэтому в таблице — диапазон).
 */
export interface HeartRule {
  /** Ключ-причина (для coupon_redeem — спенд, его знак обратный). */
  id: HeartTxReason;
  emoji: string;
  title: string;
  description: string;
  /** Сколько сердечек: + заработал / − потратил. */
  reward: number;
  /** Подключено на клиенте сейчас? */
  wired: boolean;
}

export const HEART_RULES: HeartRule[] = [
  {
    id: "daily",
    emoji: "🌅",
    title: "Ежедневный вход",
    description: "Просто зайти в приложение — раз в сутки.",
    reward: 10,
    wired: true,
  },
  {
    id: "memory",
    emoji: "📸",
    title: "Новое воспоминание",
    description: "Добавили момент в «Воспоминания».",
    reward: 15,
    wired: false,
  },
  {
    id: "date",
    emoji: "🎠",
    title: "Свидание",
    description: "Начали / завершили свидание.",
    reward: 20,
    wired: false,
  },
  {
    id: "coupon_send",
    emoji: "🎫",
    title: "Купон отправлен",
    description: "Отправили купон своей половинке.",
    reward: 5,
    wired: false,
  },
  {
    id: "reaction",
    emoji: "💬",
    title: "Реакция на воспоминание",
    description: "Поставили реакцию партнёру.",
    reward: 3,
    wired: false,
  },
  {
    id: "streak",
    emoji: "🔥",
    title: "Серия дней",
    description: "Неделя ежедневных входов подряд.",
    reward: 25,
    wired: false,
  },
  {
    id: "coupon_redeem",
    emoji: "💛",
    title: "Выкуп купона",
    description: "Расход: цена купона сгорает у выкупающего.",
    reward: 0,
    wired: true,
  },
];

/**
 * Хранилище кошельков на localStorage. Ключи — id участников (dima/anya).
 * `lastDaily` хранит локальную дату («2026-08-04») последнего ежедневного
 * бонуса — начисление идемпотентно и не начисляется дважды в день.
 */
export interface HeartsStore {
  wallets: Record<string, { balance: number; txs: HeartTx[] }>;
  lastDaily: Record<string, string>;
}

/** Пустое хранилище — для серверной гидрации (кошельки клиентские). */
export const EMPTY_HEARTS: HeartsStore = {
  wallets: {},
  lastDaily: {},
};
