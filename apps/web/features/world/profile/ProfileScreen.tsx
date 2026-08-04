"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Gender } from "@/lib/theme";
import { worldStatus } from "@/lib/data/worldStatus";
import { liveliness, type MemberLiveliness } from "@/lib/data/liveliness";
import { coupleProfile, GENDER_PALETTE } from "@/features/world/profile/couple";
import { useActivePerson } from "@/features/world/profile/useActivePerson";
import { ProfileAmbient } from "@/features/world/profile/ProfileAmbient";
import { ProfileDeck } from "@/features/world/profile/ProfileDeck";
import { HeartsWallet } from "@/features/world/hearts/HeartsWallet";
import styles from "./ProfileScreen.module.css";

/** Приветствие по часу суток. */
function greetingForHour(hour: number): string {
  if (hour >= 5 && hour < 11) return "Доброе утро";
  if (hour >= 11 && hour < 17) return "Добрый день";
  if (hour >= 17 && hour < 23) return "Добрый вечер";
  return "Доброй ночи";
}

/** Сердечко в цвете активного пола — как на регистрации. */
function heartForGender(gender: Gender): string {
  return gender === "boy" ? "💙" : "💗";
}

/**
 * Приманка «вернись в профиль» — живая строка под названием пары.
 * Зависит от присутствия партнёра: онлайн — ответить на реакцию,
 * офлайн — оставить голосовое, «заглянет к вечеру» — заглянуть вместе.
 */
function baitFor(name: string, gender: Gender, liv: MemberLiveliness): string {
  const was = gender === "boy" ? "заходил" : "заходила";
  switch (liv.presence.state) {
    case "online":
      return `${name} сейчас с вами — ответьте на реакцию 💛`;
    case "recent":
      return `${name} ${was} рядом — оставьте голосовое 🎙`;
    case "away":
      return `${name} не ${was} 6 часов — оставьте голосовое 🎙`;
    case "expected":
      return `${name} заглянет к вечеру — загляните и вы 🌆`;
    default:
      return "Ваш мир живой — загляните, что в нём нового ✨";
  }
}

/**
 * Страница «Профиль пары».
 *
 * Идея: две карточки — вы и ваша вторая половинка. Фокусная карточка стоит в
 * центре и задаёт цвет СТРАНИЦЫ ПРОФИЛЯ (как выбор пола на регистрации). Клик
 * по карточке запускает карусель: карточка уходит в сторону с 3D-поворотом,
 * новая выходит в центр, и страница перекрашивается в её цвет.
 *
 * Живость: приветствие по времени суток и имени фокусной карточки, приманка
 * по присутствию партнёра, а на самих карточках — индикатор присутствия,
 * настроение и «Сердечко дня» (см. ProfileCard).
 *
 * Тема профиля — локальная: data-gender ставится на этот корневой контейнер,
 * поэтому переопределяются только CSS-переменные внутри профиля. Глобальный
 * цвет пользователя (выбранный на регистрации) и остальной мир не меняются.
 */
export function ProfileScreen() {
  const { activePerson, activeId, select } = useActivePerson(coupleProfile);
  const reduced = useReducedMotion();
  const activePalette = GENDER_PALETTE[activePerson.gender];

  // Живое приветствие по времени суток. SSR-safe: на сервере и первой
  // отрисовке «Добрый день», настоящее время приходит в requestAnimationFrame
  // (тот же паттерн, что у даты старта серии в StreakBadge).
  const [greeting, setGreeting] = useState("Добрый день");
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      setGreeting(greetingForHour(new Date().getHours()))
    );
    return () => cancelAnimationFrame(id);
  }, []);

  // Партнёр — тот, кто сейчас НЕ в фокусе; приманка говорит про него.
  const partner = coupleProfile.members.find((m) => m.id !== activePerson.id) ?? activePerson;
  const bait = baitFor(partner.name, partner.gender, liveliness.members[partner.id]);

  return (
    <div className={styles.screen} data-gender={activePerson.gender}>
      {/* Локальный фон ВСЕЙ страницы профиля — перекрашивается вместе с карточкой. */}
      <ProfileAmbient gender={activePerson.gender} />

      {/* Вступление */}
      <header className={styles.intro}>
        <span className={styles.eyebrow}>
          {/* key по активной карточке — при смене фокуса приветствие переигрывает вход. */}
          <motion.span
            key={activePerson.id}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {greeting}, {activePerson.name}{" "}
            <span aria-hidden style={{ color: activePalette.primary }}>
              {heartForGender(activePerson.gender)}
            </span>
          </motion.span>
        </span>
        <h1 className={styles.title}>{coupleProfile.coupleName}</h1>
        <p className={styles.subtitle}>{bait}</p>
      </header>

      {/* Карусель карточек */}
      <ProfileDeck
        members={coupleProfile.members}
        activeId={activeId}
        since={coupleProfile.since}
        onSelect={select}
      />

      {/* Переключатель — зеркалит карусель и цветовой выбор регистрации. */}
      <div className={styles.switcher} role="tablist" aria-label="Кто сейчас в фокусе">
        {coupleProfile.members.map((person) => {
          const active = person.id === activeId;
          const personPalette = GENDER_PALETTE[person.gender];
          return (
            <button
              key={person.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => select(person.id)}
              className={cn(styles.switcherBtn, active && styles.switcherBtnActive)}
            >
              {active && (
                <motion.span
                  aria-hidden
                  layoutId="profile-switcher-fill"
                  className={styles.switcherFill}
                  transition={
                    reduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }
                  }
                  style={{ background: personPalette.primary }}
                />
              )}
              <span className={styles.switcherEmoji} aria-hidden>
                {person.emoji}
              </span>
              <span className={styles.switcherLabel}>{person.name}</span>
              <span
                className={styles.switcherDot}
                style={{ background: personPalette.primary }}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      {/* Подпись-статус: цвет страницы = цвет фокусной карточки. */}
      <p className={styles.hint}>
        <span className={styles.hintLine} style={{ background: activePalette.primary }} aria-hidden />
        Страница сейчас в цвете {activePerson.name}
      </p>

      {/* Коротко о паре */}
      <section className={styles.meta} aria-label="О паре">
        <div className={styles.metaChip}>
          <span aria-hidden>🔥</span>
          {worldStatus.streak} дней вместе
        </div>
        <div className={styles.metaChip}>
          <span aria-hidden>📅</span>
          вместе с {coupleProfile.since}
        </div>
        <div className={styles.metaChip}>
          <span aria-hidden>🎟️</span>
          код пары · ALMA-2024
        </div>
      </section>

      {/* Личные сердечки — внизу, отдельно от карточек пары: баланс видит
          только владелец (виджет привязан к «я», а не к фокусной карточке). */}
      <HeartsWallet />
    </div>
  );
}
