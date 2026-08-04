// Single source of truth for the dates world. Every stat, invitation and style
// reads from here so future reactivity lands as data changes.

export interface DatesStat {
  emoji: string;
  value: string;
  label: string;
  /** Optional detail shown on hover/tap */
  detail?: string;
}

export interface InvitationStyle {
  key: string;
  emoji: string;
  label: string;
  description: string;
  /** CSS class for the envelope theme */
  themeClass: string;
}

export interface EnvelopeCustomization {
  key: string;
  label: string;
  emoji: string;
  /** Options for this customization */
  options: EnvelopeOption[];
}

export interface EnvelopeOption {
  key: string;
  label: string;
  emoji?: string;
  /** CSS variable value or class */
  value: string;
  preview?: string;
}

export const datesStatus = {
  couple: "Аня и Дима",

  // Beautiful statistics for the dates page
  stats: [
    {
      emoji: "📅",
      value: "23",
      label: "Свиданий всего",
      detail: "Первое было 14 февраля 2023",
    },
    {
      emoji: "💌",
      value: "14",
      label: "Приглашений отправлено",
      detail: "Аня: 8 · Дима: 6",
    },
    {
      emoji: "✨",
      value: "9",
      label: "Сюрприз-свиданий",
      detail: "Когда один заставил угадать место",
    },
    {
      emoji: "🏠",
      value: "5",
      label: "Домашних ужинов",
      detail: "Самые тёплые вечера",
    },
    {
      emoji: "🌿",
      value: "6",
      label: "На природе",
      detail: "Пикники, закаты, звёзды",
    },
    {
      emoji: "🎭",
      value: "3",
      label: "Тематические",
      detail: "Ретро, космос, детектив",
    },
    {
      emoji: "⏱️",
      value: "342",
      label: "Часов вместе",
      detail: "И каждая минута — драгоценна",
    },
    {
      emoji: "💍",
      value: "1",
      label: "Свидание-предложение",
      detail: "Самое важное из всех",
    },
  ] satisfies DatesStat[],

  // Invitation styles / dress codes
  invitationStyles: [
    {
      key: "romantic",
      emoji: "🌹",
      label: "Романтичное",
      description: "Свечи, вино, тихая музыка",
      themeClass: "envelope-romantic",
    },
    {
      key: "adventure",
      emoji: "🗺️",
      label: "Приключение",
      description: "Секретное место, загадки по пути",
      themeClass: "envelope-adventure",
    },
    {
      key: "cozy",
      emoji: "🏠",
      label: "Уютное дома",
      description: "Плед, фильм, вкусный ужин",
      themeClass: "envelope-cozy",
    },
    {
      key: "surprise",
      emoji: "🎁",
      label: "Сюрприз",
      description: "Ты узнаешь всё только на месте",
      themeClass: "envelope-surprise",
    },
    {
      key: "elegant",
      emoji: "🤵",
      label: "Элегантное",
      description: "Коктейльное платье / костюм",
      themeClass: "envelope-elegant",
    },
    {
      key: "playful",
      emoji: "🎮",
      label: "Игривое",
      description: "Боулинг, аркады, смех до слез",
      themeClass: "envelope-playful",
    },
  ] satisfies InvitationStyle[],

  // Envelope customization options
  envelopeCustomizations: [
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
  ] satisfies EnvelopeCustomization[],
};

// Helper to get initial letter for seal
export function getCoupleInitials(): string {
  return datesStatus.couple
    .split(" ")
    .map((name) => name[0])
    .join("&");
}