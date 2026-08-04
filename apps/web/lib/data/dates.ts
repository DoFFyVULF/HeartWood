// Данные страницы «Свидания» — единственный источник правды для всей статистики.
// Структура повторяет паттерн worldStatus.ts: будущая «живость» (новые свидания →
// рост чисел, сдвиг топов) будет приходить сюда как данные, а не как правки layout.

export interface DateTypeStat {
  emoji: string;
  label: string;
  count: number;
}

export interface DateHistoryEvent {
  emoji: string;
  text: string;
  /** Кто позвал: id участника из coupleProfile. */
  who: "dima" | "anya";
  when: string;
}

/** Счёт «кто кого позвал»: id участника → число приглашений. */
export type InviteScore = Record<"dima" | "anya" | "shared", number>;

export const datesData = {
  couple: "Аня и Дима",
  /** Всего свиданий с начала истории. */
  total: 23,
  /** Кто кого позвал: Дима инициировал 13, Аня — 9, ещё одно придумали вместе. */
  inviteScore: {
    dima: 13,
    anya: 9,
    shared: 1,
  } satisfies InviteScore,
  /** Сколько часов вдвоём уже подарено свиданиям. */
  hoursTogether: 96,
  /** Рекордная серия: свиданий подряд без пропусков. */
  bestStreak: 8,
  /** Место, куда пара возвращается чаще всего. */
  favoriteSpot: "Кофейня «Ветка»",
  /** Средняя оценка свидания, которую пара ставит после каждой встречи. */
  averageRating: "4,9",
  /** Самые частые форматы — рендерятся барами по доле от total. */
  topTypes: [
    { emoji: "🧺", label: "Пикники", count: 6 },
    { emoji: "☕", label: "Кофейни", count: 5 },
    { emoji: "🎬", label: "Кино", count: 4 },
    { emoji: "🚶", label: "Прогулки", count: 4 },
    { emoji: "🎨", label: "Мастер-классы", count: 2 },
  ] satisfies DateTypeStat[],
  /** Последние приглашения — ближе к верху списка свежие. */
  history: [
    { emoji: "🎬", text: "Кино на закате · «Амели»", who: "dima", when: "Сб, 2 авг" },
    { emoji: "🧺", text: "Пикник у реки с вафлями", who: "anya", when: "Вс, 27 июл" },
    { emoji: "☕", text: "Кофейня «Ветка» · раф с корицей", who: "anya", when: "Сб, 19 июл" },
    { emoji: "🎨", text: "Мастер-класс по керамике", who: "dima", when: "Вс, 13 июл" },
    { emoji: "🚶", text: "Ночная прогулка по набережной", who: "dima", when: "Сб, 5 июл" },
  ] satisfies DateHistoryEvent[],
};
