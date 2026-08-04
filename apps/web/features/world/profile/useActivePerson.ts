"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGender } from "@/lib/theme";
import {
  type CoupleProfile,
  findPerson,
  findPersonByGender,
} from "@/features/world/profile/couple";

/**
 * Кто из пары сейчас «в фокусе» на странице профиля.
 *
 * Цвет фокусной карточки — это ЛОКАЛЬНАЯ тема профиля: корневой контейнер
 * страницы получает data-gender выбранного участника, и CSS-переменные
 * переопределяются только внутри профиля. Весь остальной мир (хедер, фон,
 * вкладки) остаётся на глобальном цвете, выбранном на регистрации.
 *
 * Поведение:
 * - первый визит (пол ещё не выбран): открываемся на primary-участнике;
 * - вернувшийся пользователь: открываемся на участнике сохранённого пола;
 * - клик по карточке фиксирует выбор: interacted=true, автосинк больше
 *   не срабатывает.
 *
 * Важно: этот хук НЕ пишет в глобальный пол (heartwood.gender) — выбор пола
 * на регистрации остаётся неприкосновенным.
 */
export function useActivePerson(profile: CoupleProfile) {
  const { gender } = useGender();

  // Начальное значение одинаково на сервере и при гидрации (gender = null),
  // поэтому карточки не дают hydration-mismatch.
  const [activeId, setActiveId] = useState<string>(() =>
    gender ? findPersonByGender(gender).id : profile.primaryId
  );
  const interacted = useRef(false);

  const activePerson = useMemo(() => findPerson(activeId), [activeId]);

  useEffect(() => {
    // Вернувшийся пользователь: открываемся на «своём» участнике.
    // Первый визит уже выставлен в useState (primary), здесь его не трогаем.
    if (gender !== null && !interacted.current) {
      setActiveId(findPersonByGender(gender).id);
    }
  }, [gender]);

  const select = useCallback((id: string) => {
    interacted.current = true;
    setActiveId(id);
  }, []);

  return { activePerson, activeId, select };
}
