import { Couple, User } from '../generated/prisma/client.js';

/** Публичное представление участника — без пароля. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  gender: 'boy' | 'girl' | null;
  mood: string | null;
  emoji: string | null;
  tagline: string | null;
  photo: string | null;
  role: 'primary' | 'partner';
}

export interface PublicCouple {
  id: string;
  code: string;
  coupleName: string;
  since: string;
  members: PublicUser[];
}

/**
 * Собирает безопасный объект участника. `gender`/`mood` в Prisma-клиенте —
 * enum/строки; нормализуем в читаемые значения.
 */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    gender: user.gender ?? null,
    mood: user.mood ?? null,
    emoji: user.emoji ?? null,
    tagline: user.tagline ?? null,
    photo: user.photo ?? null,
    role: user.role,
  };
}

/** Пара с участниками — всё, что нужно фронту для шапки и профиля. */
export function toPublicCouple(couple: Couple & { members: User[] }): PublicCouple {
  return {
    id: couple.id,
    code: couple.code,
    coupleName: couple.coupleName,
    since: couple.since.toISOString(),
    members: couple.members.map(toPublicUser),
  };
}
