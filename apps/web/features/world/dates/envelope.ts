// Каталог оформления письма в «Студии письма»: бумага, печать, марка, ленточка.
// Это UI-конфигурация конверта (не данные пары) — поэтому живёт на фронте,
// а не в API. id совпадают с ключами опций.

export interface EnvelopeOption {
  key: string;
  label: string;
  emoji?: string;
  /** CSS variable value or class */
  value: string;
  preview?: string;
}

export interface EnvelopeCustomization {
  key: string;
  label: string;
  emoji: string;
  /** Options for this customization */
  options: EnvelopeOption[];
}

export const envelopeCustomizations: EnvelopeCustomization[] = [
  {
    key: "paper",
    label: "Бумага",
    emoji: "📄",
    options: [
      { key: "cream", label: "Кремовая", emoji: "📄", value: "#fdf6e3", preview: "warm" },
      { key: "white", label: "Белая льняная", emoji: "📃", value: "#fefefe", preview: "clean" },
      { key: "parchment", label: "Пергамент", emoji: "📜", value: "#f5e6c8", preview: "vintage" },
      { key: "rose", label: "Розовая", emoji: "🌸", value: "#ffeef5", preview: "soft" },
      { key: "lavender", label: "Лавандовая", emoji: "💜", value: "#f3f0ff", preview: "dreamy" },
      { key: "kraft", label: "Крафт", emoji: "📦", value: "#d4a876", preview: "earthy" },
    ],
  },
  {
    key: "seal",
    label: "Печать",
    emoji: "🔴",
    options: [
      { key: "heart", label: "Сердечко", emoji: "❤️", value: "heart" },
      { key: "wax", label: "Восковая", emoji: "🕯️", value: "wax" },
      { key: "initial", label: "Инициалы", emoji: "✦", value: "initial" },
      { key: "star", label: "Звезда", emoji: "⭐", value: "star" },
      { key: "flower", label: "Цветок", emoji: "🌸", value: "flower" },
      { key: "custom", label: "Своя", emoji: "✏️", value: "custom" },
    ],
  },
  {
    key: "stamp",
    label: "Марка",
    emoji: "📮",
    options: [
      { key: "love", label: "Любовь", emoji: "💕", value: "love" },
      { key: "travel", label: "Путешествие", emoji: "✈️", value: "travel" },
      { key: "time", label: "Время", emoji: "⏰", value: "time" },
      { key: "memory", label: "Воспоминание", emoji: "📸", value: "memory" },
      { key: "dream", label: "Мечта", emoji: "☁️", value: "dream" },
      { key: "none", label: "Без марки", emoji: "✨", value: "none" },
    ],
  },
  {
    key: "ribbon",
    label: "Ленточка",
    emoji: "🎀",
    options: [
      { key: "silk-red", label: "Шёлковая красная", value: "#c41e3a" },
      { key: "silk-pink", label: "Шёлковая розовая", value: "#ec4899" },
      { key: "silk-gold", label: "Шёлковая золотая", value: "#f59e0b" },
      { key: "silk-silver", label: "Шёлковая серебряная", value: "#94a3b8" },
      { key: "lace-white", label: "Кружево белое", value: "#ffffff" },
      { key: "none", label: "Без ленточки", value: "transparent" },
    ],
  },
];

/** Опции одной категории (paper/seal/stamp/ribbon). */
export function envelopeOptions(catKey: string): EnvelopeOption[] {
  return envelopeCustomizations.find((c) => c.key === catKey)?.options ?? [];
}
