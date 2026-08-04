// Данные профиля пары — единственный источник правды для страницы profile.
// Палитры дублируют токены из globals.css ([data-gender="boy"] / "girl"),
// чтобы карточки красились по своему полу независимо от активной темы.

import type { Gender } from "@/lib/theme";

export interface ProfilePerson {
  id: string;
  name: string;
  gender: Gender;
  emoji: string;
  /** Роль на карточке — кто «Ваша половина», а кто «вторая половинка». */
  role: string;
  /** Короткая строка под именем. */
  tagline: string;
  /**
   * Реальное фото: положите файл в apps/web/public/people/<id>.webp и укажите
   * "/people/<id>.webp". Пока поля нет — рисуется градиентный плейсхолдер.
   */
  photo?: string;
}

export interface CoupleProfile {
  coupleName: string;
  /** Дата начала истории — показывается внизу страницы. */
  since: string;
  /** id участника, который зарегистрировался; его цвет — цвет по умолчанию. */
  primaryId: string;
  members: ProfilePerson[];
}

/** Палитры полов — совпадают с цветами страницы регистрации. */
export const GENDER_PALETTE = {
  boy: {
    primary: "#3b82f6",
    deep: "#2563eb",
    soft: "#dbeafe",
    glow: "rgba(59, 130, 246, 0.55)",
  },
  girl: {
    primary: "#ec4899",
    deep: "#db2777",
    soft: "#fce7f3",
    glow: "rgba(236, 72, 153, 0.55)",
  },
} as const;

export type GenderPalette = (typeof GENDER_PALETTE)[Gender];

export const coupleProfile: CoupleProfile = {
  coupleName: "Аня и Дима",
  since: "14 февраля 2024",
  primaryId: "dima",
  members: [
    {
      id: "dima",
      name: "Дима",
      gender: "boy",
      emoji: "😎",
      role: "Ваша половина",
      tagline: "Строит планы на море и помнит все свидания наизусть",
    },
    {
      id: "anya",
      name: "Аня",
      gender: "girl",
      emoji: "🌸",
      role: "Вторая половинка",
      tagline: "Печёт вафли и хранит каждый чек с пикника у реки",
    },
  ],
};

export function findPerson(id: string): ProfilePerson {
  return coupleProfile.members.find((m) => m.id === id) ?? coupleProfile.members[0];
}

/** Кто сейчас «в цвете» по сохранённому полу; для пустого пола — primary. */
export function findPersonByGender(gender: Gender | null): ProfilePerson {
  return coupleProfile.members.find((m) => m.gender === gender) ?? coupleProfile.members[0];
}
