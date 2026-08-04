"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GENDER_PALETTE, type ProfilePerson } from "@/features/world/profile/couple";
import { ProfileCard, type CardPose } from "@/features/world/profile/ProfileCard";
import styles from "./ProfileDeck.module.css";

// Детерминированные частицы — без Math.random, чтобы SSR и гидрация совпадали.
const PARTICLE_META = [
  { emoji: "💙", top: "14%", left: "16%", size: 18, delay: 0 },
  { emoji: "🌸", top: "10%", left: "80%", size: 20, delay: 1.4 },
  { emoji: "✨", top: "72%", left: "28%", size: 14, delay: 0.8 },
  { emoji: "💗", top: "80%", left: "86%", size: 18, delay: 2.1 },
  { emoji: "🫧", top: "6%", left: "46%", size: 16, delay: 0.4 },
  { emoji: "🤍", top: "60%", left: "8%", size: 15, delay: 1.9 },
];

/**
 * Геометрия карусели зависит от ширины экрана: на мобильном карточка-«подсказка»
 * должна прятаться за краем (виден только подсвеченный левый бок), на десктопе —
 * стоять рядом с героем. Значение по умолчанию 60 используется и на сервере, и при
 * гидрации, поэтому hydration-mismatch не возникает — реальная цифра приходит в effect.
 */
function usePoseGeometry() {
  const [geometry, setGeometry] = useState({ peekX: 60, peekY: 9, scale: 0.82 });

  useEffect(() => {
    const measure = () => {
      const w = window.innerWidth;
      setGeometry({
        peekX: w < 640 ? 58 : w < 1024 ? 66 : 74,
        peekY: w < 640 ? 9 : 10,
        scale: w < 640 ? 0.8 : 0.84,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return geometry;
}

interface ProfileDeckProps {
  members: ProfilePerson[];
  activeId: string;
  since: string;
  onSelect: (id: string) => void;
}

export function ProfileDeck({ members, activeId, since, onSelect }: ProfileDeckProps) {
  const reduced = useReducedMotion();
  const { peekX, peekY, scale } = usePoseGeometry();
  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  const activeIndex = useMemo(
    () => Math.max(0, members.findIndex((m) => m.id === activeId)),
    [members, activeId]
  );

  // Поза каждой карточки зависит от её «дистанции» до активной: 0 — герой,
  // 1 — подсказка справа, 2+ — скрыта за краем. rotateY положительный поворачивает
  // левый бок карточки к зрителю — именно его подсвечивает цветовая полоса.
  const poses = useMemo<CardPose[]>(() => {
    const hiddenX = peekX + 90;
    return members.map((_, i) => {
      const offset = (i - activeIndex + members.length) % members.length;
      if (offset === 0) {
        return { x: "0%", y: "0%", rotateY: 0, scale: 1, opacity: 1, zIndex: 3 };
      }
      if (offset === 1) {
        return {
          x: `${peekX}%`,
          y: `${peekY}%`,
          rotateY: 26,
          scale,
          opacity: 0.96,
          zIndex: 2,
        };
      }
      return {
        x: `${hiddenX}%`,
        y: "16%",
        rotateY: 55,
        scale: 0.5,
        opacity: 0,
        zIndex: 1,
        pointerEvents: "none",
      };
    });
  }, [members, activeIndex, peekX, peekY, scale]);

  const activeMember = members[activeIndex];
  const otherMember = members[(activeIndex + 1) % members.length];
  const activePalette = GENDER_PALETTE[activeMember.gender];
  const otherPalette = GENDER_PALETTE[otherMember.gender];

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = members[(activeIndex + direction + members.length) % members.length];
    onSelect(next.id);
    // Возвращаем фокус на карточку, которая стала активной.
    cardRefs.current.get(next.id)?.focus();
  }

  return (
    <div
      className={styles.deck}
      role="listbox"
      aria-label="Карточки пары — стрелками и кликом выбирайте, кто сейчас в фокусе"
      onKeyDown={handleKeyDown}
    >
      <div className={styles.stage}>
        {/* Слой 1 — цветовые пятна позади карточек, по одному на участника. */}
        <div
          aria-hidden
          className={cn(styles.glow, styles.glowLeft)}
          style={{ background: `radial-gradient(circle, ${activePalette.glow}, transparent 70%)` }}
        />
        <div
          aria-hidden
          className={cn(styles.glow, styles.glowRight)}
          style={{ background: `radial-gradient(circle, ${otherPalette.glow}, transparent 70%)` }}
        />

        {/* Слой 2 — дрейфующие частицы. */}
        <div aria-hidden className={styles.particles}>
          {PARTICLE_META.map((p, i) => (
            <span
              key={i}
              className={styles.particle}
              style={{
                top: p.top,
                left: p.left,
                fontSize: p.size,
                animationDelay: `${p.delay}s`,
              }}
            >
              {p.emoji}
            </span>
          ))}
        </div>

        {/* Слой 3 — сами карточки. */}
        {members.map((person, i) => (
          <ProfileCard
            key={person.id}
            ref={(el) => {
              if (el) cardRefs.current.set(person.id, el);
              else cardRefs.current.delete(person.id);
            }}
            person={person}
            partner={members[(i + 1) % members.length]}
            since={since}
            pose={poses[i]}
            active={person.id === activeId}
            bobDelay={i * -2.2}
            onClick={() => onSelect(person.id)}
          />
        ))}

        {/* Слой 5 — световой свайп, проигрывается заново при каждой смене карточки. */}
        {!reduced && (
          <div aria-hidden className={styles.sweep} key={activeId}>
            <motion.span
              className={styles.sweepBand}
              initial={{ x: "-120%", opacity: 0 }}
              animate={{ x: ["-120%", "320%"], opacity: [0, 0.6, 0] }}
              transition={{ duration: 0.75, ease: "easeInOut" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
