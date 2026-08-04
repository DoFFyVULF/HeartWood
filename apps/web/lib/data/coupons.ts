// Данные страницы «Купоны» — единый источник правды для купонной книжки.
//
// Seed-купон живут здесь как иммутабельные константы: redeemedAt — готовые
// SSR-safe строки («23 июля»), поэтому сервер и клиент рендерят их одинаково
// и гидрация не плывёт. Состояние «использован» меняется в localStorage
// (см. useCoupons) — при чтении купоны просто подменяются сохранёнными.
//
// Структура повторяет паттерн liveliness.ts / dates.ts: будущая «живость»
// (новые купоны от партнёра) будет приходить сюда как данные.

/** Кто выдал купон, кому и кто погасил — id участника из coupleProfile. */
export type AuthorId = "dima" | "anya";

export type CouponStatus = "active" | "redeemed" | "draft";

export interface Coupon {
  /** Стабильный id; у seeds — строки вида "seed-…". */
  id: string;
  emoji: string;
  title: string;
  description: string;
  status: CouponStatus;
  /**
   * Цена выкупа в сердечках. У выкупающего списывается и СГОРАЕТ
   * (автор ничего не получает) — см. docs/hearts-economy.md.
   * Старые купоны без цены нормализуются в 0 (см. useCoupons).
   */
  price: number;
  /** Кто создал купон (для черновиков — автор, для активных — отправитель). */
  createdBy?: AuthorId;
  /** Кому предназначен купон (опционально; сейчас погасить может любой). */
  recipient?: AuthorId;
  /** Для черновиков: метка создания «4 августа» — SSR-safe строка. */
  createdAt?: string;
  /** Для использованных: метка «23 июля» — SSR-safe строка. */
  redeemedAt?: string;
  /** Кто погасил купон. */
  redeemedBy?: AuthorId;
}

/** Купонная книжка из коробки: 2 активных и 2 погашенных. */
export const seedCoupons: Coupon[] = [
  {
    id: "seed-1",
    emoji: "💆",
    title: "Массаж на диване",
    description: "Десять минут покоя от любимых рук. Погасить можно в любой момент.",
    status: "active",
    price: 12,
  },
  {
    id: "seed-2",
    emoji: "🍳",
    title: "Завтрак в кровать",
    description: "Любимый завтрак с подачей до полудня. Вафли — по запросу.",
    status: "active",
    price: 15,
  },
  {
    id: "seed-3",
    emoji: "🎬",
    title: "Фильм без споров",
    description: "Жанр выбирает владелец купона. Попкорн — за счёт счастливого партнёра.",
    status: "redeemed",
    price: 10,
    redeemedAt: "23 июля",
    redeemedBy: "dima",
  },
  {
    id: "seed-4",
    emoji: "☕",
    title: "Капучино с собой",
    description: "Настоящий капучино с корицей и салфеткой с сердечком.",
    status: "redeemed",
    price: 8,
    redeemedAt: "28 июля",
    redeemedBy: "anya",
  },
];
