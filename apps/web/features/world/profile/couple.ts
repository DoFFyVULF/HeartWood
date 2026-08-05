// Профиль пары — данные приходят с /couple (useCouple). Здесь — только типы,
// палитры полов и хелперы. Палитры дублируют токены из globals.css
// ([data-gender="boy"] / "girl"), чтобы карточки красились по своему полу
// независимо от активной темы.

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
  /** Настроение: id из каталога MOODS (emoji/label резолвит UI). */
  mood: string | null;
  /**
   * Реальное фото: положите файл в apps/web/public/people/<id>.webp и укажите
   * "/people/<id>.webp". Пока поля нет — рисуется градиентный плейсхолдер.
   */
  photo?: string;
}

/** Профиль пары в терминах страницы — маппится из CoupleProfile API. */
export interface CoupleProfile {
  coupleName: string;
  /** Дата начала истории — показывается внизу страницы. */
  since: string;
  /** id участника, который зарегистрировал пару. */
  primaryId: string;
  /** Код пары — для вступления второй половинки. */
  code: string;
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

export function findPerson(members: ProfilePerson[], id: string): ProfilePerson {
  return members.find((m) => m.id === id) ?? members[0];
}

// ─── Маппинг из /couple ──────────────────────────────────────────────────────

/** Живость одного участника из /couple (presence + reactions). */
export interface MemberLiveliness {
  presence: { state: string; label: string };
  reactions: Array<{ emoji: string; count: number }>;
}

/** Результат маппинга ответа /couple в локальные типы страницы профиля. */
export interface MappedProfile {
  profile: CoupleProfile;
  /** Живость по id участника. */
  liveliness: Record<string, MemberLiveliness>;
  /** id текущего пользователя — его карточка показывает «Вы в фокусе». */
  viewerId: string;
  /** Взаимные реакции пары за месяц. */
  mutualCount: number;
}

export function mapCoupleProfile(data: {
  couple: {
    coupleName: string;
    code: string;
    sinceLabel: string;
    primaryId: string;
    mutualReactions: number;
    members: Array<{
      id: string;
      name: string;
      gender: "boy" | "girl" | null;
      emoji: string | null;
      tagline: string | null;
      role: string;
      mood: string | null;
      presence: { state: string; label: string };
      reactions: Array<{ emoji: string; count: number }>;
    }>;
  };
  me: { id: string };
}): MappedProfile {
  const members: ProfilePerson[] = data.couple.members.map((m) => ({
    id: m.id,
    name: m.name,
    gender: m.gender ?? "boy",
    emoji: m.emoji ?? "💛",
    role: m.role,
    tagline: m.tagline ?? "",
    mood: m.mood,
  }));

  const liveliness: Record<string, MemberLiveliness> = {};
  for (const m of data.couple.members) {
    liveliness[m.id] = { presence: m.presence, reactions: m.reactions };
  }

  return {
    profile: {
      coupleName: data.couple.coupleName,
      since: data.couple.sinceLabel,
      primaryId: data.couple.primaryId,
      code: data.couple.code,
      members,
    },
    liveliness,
    viewerId: data.me.id,
    mutualCount: data.couple.mutualReactions,
  };
}
