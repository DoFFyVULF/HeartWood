// Локальная модель воспоминания: метаданные из API (MemoryView) + локальные
// cover и media (IndexedDB). Медиа-файлы живут локально на устройстве
// (Blob в IndexedDB), в базе — только метаданные. Этот файл — единый
// источник локальных типов и UI-каталогов фичи.

import type { MemoryView } from "@/lib/types";

export type MemoryMediaKind = "photo" | "video";

/** Ссылка на Blob в IndexedDB. */
export interface MemoryMedia {
  id: string;
  kind: MemoryMediaKind;
}

/** Воспоминание как его видит UI: метаданные API + локальные cover/media. */
export interface Memory extends MemoryView {
  /** Маленький cover-thumbnail (data URL ~400px) — для сетки и деталей. */
  cover?: string;
  /** Ссылки на полные Blob-ы в IndexedDB (галерея на странице воспоминания). */
  media: MemoryMedia[];
}

/** Локальное дополнение к метаданным, привязанное к memory.id. */
export interface LocalExtras {
  cover?: string;
  media: MemoryMedia[];
}

/** Пустые локальные дополнения — для воспоминаний без фото. */
export const EMPTY_EXTRAS: LocalExtras = { media: [] };

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

/** Собирает UI-воспоминание из метаданных API и локальных дополнений. */
export function toMemory(view: MemoryView, extras: LocalExtras | undefined): Memory {
  return {
    ...view,
    ...(extras ?? EMPTY_EXTRAS),
  };
}
