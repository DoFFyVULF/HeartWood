// Каталог настроений — единый источник правды для пикера в хедере и чипа
// настроения на карточке профиля. id совпадает со значениями mood на бэкенде
// (PATCH /auth/me { mood }) и в ответах /couple.

export interface MoodOption {
  id: string;
  /** Эмодзи настроения — рендерится в чипе и пикере. */
  emoji: string;
  /** Короткое имя для пикера и хедера: «Отличное». */
  name: string;
  /** Фраза для чипа на карточке: «в отличном настроении». */
  label: string;
  /** 0–1 — усреднённое настроение; резерв под будущую цветную подложку. */
  level: number;
}

export const MOODS: MoodOption[] = [
  { id: "overjoyed", emoji: "🤩", name: "Прекрасное", label: "в прекрасном настроении", level: 1 },
  { id: "great", emoji: "😎", name: "Отличное", label: "в отличном настроении", level: 0.9 },
  { id: "good", emoji: "😊", name: "Хорошее", label: "в хорошем настроении", level: 0.8 },
  { id: "okay", emoji: "💛", name: "В порядке", label: "в порядке", level: 0.7 },
  { id: "calm", emoji: "😌", name: "Спокойное", label: "спокойно", level: 0.6 },
  { id: "tired", emoji: "😴", name: "Уставшее", label: "устал немного", level: 0.4 },
  { id: "down", emoji: "😢", name: "Грустное", label: "грустновато", level: 0.2 },
];

/** Найти настроение по id; неизвестный id (устаревший выбор) → null. */
export function findMood(id: string): MoodOption | null {
  return MOODS.find((m) => m.id === id) ?? null;
}
