"use client";

// Кто из пары сейчас «в фокусе» на странице профиля.
//
// Цвет фокусной карточки — ЛОКАЛЬНАЯ тема профиля: корневой контейнер
// страницы получает data-gender выбранного участника, и CSS-переменные
// переопределяются только внутри профиля. Весь остальной мир (хедер, фон,
// вкладки) остаётся на глобальном цвете, выбранном на регистрации.
//
// Поведение:
// - первый визит: открываемся на текущем пользователе (viewerId), а если
//   он ещё неизвестен — на primary-участнике пары;
// - вернувшийся пользователь: открываемся на «себе» (viewerId);
// - клик по карточке фиксирует выбор: interacted=true, автосинк больше
//   не срабатывает.
//
// Важно: этот хук НЕ пишет в глобальный пол (heartwood.gender) — выбор пола
// на регистрации остаётся неприкосновенным.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  findPerson,
  type CoupleProfile,
  type ProfilePerson,
} from "@/features/world/profile/couple";

/** Заглушка до прихода /couple — чтобы страница не падала на пустом списке. */
const FALLBACK_PERSON: ProfilePerson = {
  id: "",
  name: "",
  gender: "boy",
  emoji: "💛",
  role: "",
  tagline: "",
  mood: null,
};

export function useActivePerson(profile: CoupleProfile, viewerId: string) {
  // Начальное значение одинаково на сервере и при гидрации (viewerId ещё
  // неизвестен → primaryId), поэтому карточки не дают hydration-mismatch.
  const [activeId, setActiveId] = useState<string>(() =>
    viewerId ? viewerId : profile.primaryId,
  );
  const interacted = useRef(false);

  const activePerson = useMemo<ProfilePerson>(
    () => findPerson(profile.members, activeId) ?? FALLBACK_PERSON,
    [profile.members, activeId],
  );

  useEffect(() => {
    // Вернувшийся пользователь: открываемся на «себе». Первый визит уже
    // выставлен в useState (viewerId/primary), здесь его не трогаем.
    if (viewerId && !interacted.current) {
      setActiveId(viewerId);
    }
  }, [viewerId]);

  const select = useCallback((id: string) => {
    interacted.current = true;
    setActiveId(id);
  }, []);

  return { activePerson, activeId, select };
}
