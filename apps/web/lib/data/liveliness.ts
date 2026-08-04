// Живость профиля пары — единый источник правды для статусов «сейчас».
// Присутствие, настроение и реакции каждого участника. Когда мир станет
// реактивным (партнёр зашёл → статус сменился, новая реакция → счётчик),
// изменения придут сюда как данные, а не как правки layout — тот же паттерн,
// что в worldStatus.ts и dates.ts.

export type PresenceState = "online" | "recent" | "away" | "expected";

export interface Presence {
  state: PresenceState;
  /** Готовый текст статуса: «Сейчас онлайн», «Была 5 минут назад»… */
  label: string;
  /** Доп. подпись, напр. «заглянет к вечеру». */
  detail?: string;
}

export interface Mood {
  /** Эмодзи настроения — рендерится в чипе. */
  emoji: string;
  /** Короткая подпись: «в порядке», «в отличном настроении»… */
  label: string;
  /** 0–1 — усреднённое настроение; резерв под будущую цветную подложку. */
  level: number;
}

export interface Reaction {
  emoji: string;
  count: number;
}

export interface MemberLiveliness {
  presence: Presence;
  mood: Mood;
  /** Реакции, которые партнёр поставил на карточку этого участника. */
  reactions: Reaction[];
}

export interface CoupleLiveliness {
  /** Взаимные реакции пары за месяц — общий счётчик на обеих карточках. */
  mutualCount: number;
  members: Record<string, MemberLiveliness>;
}

export const liveliness: CoupleLiveliness = {
  mutualCount: 5,
  members: {
    dima: {
      presence: { state: "online", label: "Сейчас онлайн", detail: "1 минуту назад" },
      mood: { emoji: "😎", label: "в отличном настроении", level: 0.9 },
      reactions: [
        { emoji: "💙", count: 12 },
        { emoji: "💛", count: 7 },
        { emoji: "🎉", count: 3 },
      ],
    },
    anya: {
      presence: { state: "online", label: "Сейчас онлайн", detail: "3 минуты назад" },
      mood: { emoji: "💛", label: "в порядке", level: 0.8 },
      reactions: [
        { emoji: "💙", count: 8 },
        { emoji: "💛", count: 6 },
        { emoji: "☕", count: 2 },
      ],
    },
  },
};
