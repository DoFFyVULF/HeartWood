// Воспоминания пары — единый источник правды для фичи «Воспоминания».
//
// Seed-воспоминания живут здесь как иммутабельные константы и рендерятся
// из getServerSnapshot (только метаданные, БЕЗ медиа — SSR-пейлоад мал).
// Пользовательские воспоминания хранятся в localStorage (см. useMemories)
// и мерджатся при чтении: свежие — сверху, seeds — ниже. Полные фото/видео
// (Blob) лежат в IndexedDB; в метаданных — только маленький cover-thumbnail.

export type MemoryMediaKind = "photo" | "video";

export interface MemoryMedia {
  /** id Blob-а в IndexedDB. */
  id: string;
  kind: MemoryMediaKind;
}

export interface Memory {
  /** Стабильный id; у seeds — строки вида "seed-…". */
  id: string;
  /** Подпись полароида — рисуется красным рукописным шрифтом. */
  title: string;
  /** Эмодзи для градиентной обложки, когда фото нет. */
  emoji: string;
  /** ISO-дата (YYYY-MM-DD) дня, когда воспоминание случилось. */
  date: string;
  /** Короткая история-рассказ под полароидом. */
  story?: string;
  /** Маленький cover-thumbnail (data URL ~400px) — для сетки и деталей. */
  cover?: string;
  /** Ссылки на полные Blob-ы в IndexedDB (галерея на странице воспоминания). */
  media: MemoryMedia[];
  /** Порядок создания — тай-брейк при равных датах. */
  createdAt: number;
}

/** Иконки для пикера в композере и градиентных обложек. */
export const MEMORY_EMOJIS = [
  "💛",
  "🧺",
  "🎬",
  "🎨",
  "☕",
  "🚶",
  "🌊",
  "🎂",
  "✈️",
  "🌸",
] as const;

export const seedMemories: Memory[] = [
  {
    id: "seed-picnic",
    title: "Пикник у реки",
    emoji: "🧺",
    date: "2026-07-27",
    story:
      "Вафли, плед и солнце наперегонки. Дима наконец-то научился сворачивать вафли конвертиком, а Аня записала в блокнот «не забыть купить клубники». День пахнет летом.",
    media: [],
    createdAt: 0,
  },
  {
    id: "seed-cinema",
    title: "Кино на закате",
    emoji: "🎬",
    date: "2026-08-02",
    story:
      "«Амели» в летнем кинотеатре под открытым небом. На середине фильма пошёл дождь — мы спрятались под одним пледом и досмотрели до конца, уже не помня, что там было на экране.",
    media: [],
    createdAt: 1,
  },
  {
    id: "seed-coffee",
    title: "Кофейня «Ветка»",
    emoji: "☕",
    date: "2026-07-19",
    story:
      "Наш постоянный столик у окна. Раф с корицей, один на двоих, и план на море, который мы рисуем на салфетках уже третий раз.",
    media: [],
    createdAt: 2,
  },
  {
    id: "seed-ceramics",
    title: "Мастер-класс по керамике",
    emoji: "🎨",
    date: "2026-07-13",
    story:
      "Две кривоватые чашки — одна выше, другая шире. На дне у обеих я процарапала маленькое сердечко. Они всё ещё стоят у нас на полке.",
    media: [],
    createdAt: 3,
  },
  {
    id: "seed-walk",
    title: "Ночная прогулка",
    emoji: "🚶",
    date: "2026-07-05",
    story:
      "Набережная в полночь, фонари ловят звёзды в лужах. Мы дошли до самого конца и обратно — просто чтобы ещё раз пройти мимо нашей скамейки.",
    media: [],
    createdAt: 4,
  },
];

/** Даты «пополудни», чтобы сдвиг таймзоны не уводил день на день назад. */
export function formatMemoryDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
