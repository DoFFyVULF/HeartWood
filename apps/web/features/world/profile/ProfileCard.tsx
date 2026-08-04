"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  GENDER_PALETTE,
  coupleProfile,
  type ProfilePerson,
} from "@/features/world/profile/couple";
import { liveliness } from "@/lib/data/liveliness";
import { useMood } from "@/lib/mood";
import styles from "./ProfileCard.module.css";

/** Поза карточки в карусели — всё, что анимирует framer-motion. */
export interface CardPose {
  /** Процент от ширины карточки — позиция по горизонтали. */
  x: string;
  /** Процент от высоты карточки — сдвиг по вертикали. */
  y: string;
  rotateY: number;
  scale: number;
  opacity: number;
  zIndex: number;
  pointerEvents?: "none";
}

interface ProfileCardProps {
  person: ProfilePerson;
  partner: ProfilePerson;
  since: string;
  pose: CardPose;
  active: boolean;
  /** Задержка «дыхания» карточки, чтобы слоты не качались в унисон. */
  bobDelay: number;
  onClick: () => void;
  /** React 19 — ref передаётся обычным пропом, forwardRef не нужен. */
  ref?: React.Ref<HTMLDivElement>;
}

const SPRING = { type: "spring", stiffness: 220, damping: 24, mass: 0.9 } as const;

export function ProfileCard({
  person,
  partner,
  since,
  pose,
  active,
  bobDelay,
  onClick,
  ref,
}: ProfileCardProps) {
  const reduced = useReducedMotion();
  const palette = GENDER_PALETTE[person.gender];
  const partnerPalette = GENDER_PALETTE[partner.gender];

  // Живость карточки: присутствие, настроение и реакции этого участника.
  // На карточке «вашего» участника (primaryId) статус заменяется на «Вы в фокусе».
  const liv = liveliness.members[person.id];
  const isViewer = person.id === coupleProfile.primaryId;
  const presenceLive = !isViewer && liv.presence.state === "online";
  const presenceLabel = isViewer ? "Вы в фокусе" : liv.presence.label;

  // Своё настроение, выбранное в хедере, «ваша» карточка показывает живым;
  // пока ничего не выбрано — базовое из liveliness. Карточка партнёра всегда
  // читает базовые данные.
  const { mood: liveMood } = useMood();
  const displayedMood = isViewer && liveMood ? liveMood : liv.mood;

  return (
    <div
      ref={ref}
      className={styles.slot}
      style={{
        zIndex: pose.zIndex,
        opacity: pose.opacity,
        pointerEvents: pose.pointerEvents ?? "auto",
        animationDelay: `${bobDelay}s`,
      }}
    >
      <motion.article
        className={cn(styles.card, active && styles.cardActive)}
        role="option"
        aria-selected={active}
        aria-label={`${person.name} — ${person.tagline}`}
        tabIndex={active ? 0 : -1}
        initial={false}
        animate={{ x: pose.x, y: pose.y, rotateY: pose.rotateY, scale: pose.scale }}
        transition={reduced ? { duration: 0 } : SPRING}
        whileTap={active ? undefined : { scale: pose.scale * 0.94 }}
        onClick={onClick}
      >
        <div className={styles.cardInner}>
          {/* Фото-зона: реальное фото или градиентный плейсхолдер в цвет пола. */}
          <div
            className={styles.photo}
            style={{
              background: `linear-gradient(160deg, ${palette.primary} 0%, ${palette.deep} 100%)`,
            }}
          >
            {person.photo ? (
              <Image
                src={person.photo}
                alt={`Фото ${person.name}`}
                fill
                sizes="(min-width: 1024px) 340px, 72vw"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <>
                <span className={styles.watermark} aria-hidden>
                  {person.name[0]}
                </span>
                <span className={styles.emoji} aria-hidden>
                  {person.emoji}
                </span>
                <span className={styles.texture} aria-hidden />
              </>
            )}

            {/* Градиентная вуаль, чтобы текст читался на любом фоне. */}
            <div className={styles.scrim} aria-hidden />

            <span className={styles.roleChip}>{person.role}</span>

            <div className={styles.info}>
              <h3 className={styles.name}>{person.name}</h3>
              <p className={styles.tagline}>{person.tagline}</p>

              {/* Живость: присутствие + настроение в одну строку. */}
              <div className={styles.statusRow}>
                <span
                  className={cn(styles.presenceDot, presenceLive && styles.presenceDotLive)}
                  style={{ background: palette.primary }}
                  aria-hidden
                />
                <span className={styles.presenceText}>{presenceLabel}</span>
                <span
                  className={styles.moodChip}
                  aria-label={`Настроение ${person.name}: ${displayedMood.label}`}
                >
                  <span aria-hidden>{displayedMood.emoji}</span>
                  <span className={styles.moodLabel}>{displayedMood.label}</span>
                </span>
              </div>

              {/* «Сердечко дня»: реакции партнёра + взаимные за месяц. */}
              <motion.div
                className={styles.reactionsRow}
                initial={reduced ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
              >
                <span
                  className={styles.reactionsList}
                  role="list"
                  aria-label={`Реакции на карточке ${person.name}`}
                >
                  {liv.reactions.map((reaction, i) => (
                    <span key={i} role="listitem" className={styles.reactionPill}>
                      <span aria-hidden>{reaction.emoji}</span>
                      <span>{reaction.count}</span>
                    </span>
                  ))}
                </span>
                <span
                  className={styles.mutual}
                  aria-label={`${liveliness.mutualCount} взаимных реакций за месяц`}
                >
                  <span aria-hidden>🔁</span>
                  <span>{liveliness.mutualCount} за месяц</span>
                </span>
              </motion.div>

              <div className={styles.partnerRow}>
                <span
                  className={styles.miniAvatar}
                  style={{
                    background: `linear-gradient(160deg, ${partnerPalette.primary}, ${partnerPalette.deep})`,
                  }}
                  aria-hidden
                >
                  {partner.emoji}
                </span>
                <span className={styles.partnerText}>
                  Партнёр — <b>{partner.name}</b>
                </span>
                <span className={styles.since}>с {since}</span>
              </div>
            </div>

            {/* Левый бок карточки — подсвечивается цветом участника; при онлайне
                партнёра горит пульсом. */}
            <span
              className={cn(styles.edgeGlow, presenceLive && styles.edgeGlowLive)}
              style={{
                background: `linear-gradient(180deg, ${palette.primary}, ${palette.deep})`,
                boxShadow: `0 0 22px ${palette.glow}`,
              }}
              aria-hidden
            />
          </div>
        </div>
      </motion.article>
    </div>
  );
}
