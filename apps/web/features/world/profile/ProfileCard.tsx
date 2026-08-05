"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GENDER_PALETTE, type ProfilePerson } from "@/features/world/profile/couple";
import { findMood } from "@/lib/moods";
import { useMood } from "@/lib/mood";
import { api } from "@/lib/api";
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
  /** id текущего пользователя — его карточка показывает «Вы в фокусе». */
  viewerId: string;
  /** Присутствие участника из /couple. */
  presence: { state: string; label: string };
  /** Реакции партнёра на карточку этого участника. */
  reactions: Array<{ emoji: string; count: number }>;
  /** Взаимные реакции пары за месяц — общий счётчик на обеих карточках. */
  mutualCount: number;
}

const SPRING = { type: "spring", stiffness: 220, damping: 24, mass: 0.9 } as const;

/** Настроение, если у участника оно ещё не выбрано. */
const FALLBACK_MOOD = { emoji: "😊", label: "в порядке" };

export function ProfileCard({
  person,
  partner,
  since,
  pose,
  active,
  bobDelay,
  onClick,
  ref,
  viewerId,
  presence,
  reactions,
  mutualCount,
}: ProfileCardProps) {
  const reduced = useReducedMotion();
  const palette = GENDER_PALETTE[person.gender];
  const partnerPalette = GENDER_PALETTE[partner.gender];

  // Живость карточки: присутствие, настроение и реакции этого участника.
  // На карточке «вашего» участника (viewerId) статус заменяется на «Вы в фокусе».
  const isViewer = person.id === viewerId;
  const presenceLive = !isViewer && presence.state === "online";
  const presenceLabel = isViewer ? "Вы в фокусе" : presence.label;

  // Своё настроение, выбранное в хедере, «ваша» карточка показывает живым;
  // партнёр всегда читает базовое настроение из /couple.
  const { mood: liveMood } = useMood();
  const baseMood = findMood(person.mood ?? "");
  const displayedMood =
    isViewer && liveMood
      ? liveMood
      : baseMood ?? FALLBACK_MOOD;

  // Аватарка: загрузка только для своей карточки
  const [photoPreview, setPhotoPreview] = useState<string | null>(person.photo ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setIsUploading(true);
    try {
      // Создаём data URL для мгновенного превью
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setPhotoPreview(dataUrl);
      // Отправляем на сервер
      await api.updateMe({ photo: dataUrl });
    } catch (e) {
      console.error("Failed to upload photo", e);
      setPhotoPreview(person.photo ?? null);
    } finally {
      setIsUploading(false);
    }
  }, [person.photo]);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoChange(file);
    if (e.target) e.target.value = "";
  }, [handlePhotoChange]);

  const removePhoto = useCallback(async () => {
    setIsUploading(true);
    try {
      setPhotoPreview(null);
      await api.updateMe({ photo: "" });
    } catch (e) {
      console.error("Failed to remove photo", e);
      setPhotoPreview(person.photo ?? null);
    } finally {
      setIsUploading(false);
    }
  }, [person.photo]);

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
        className={cn(styles.card, active && styles.cardActive, isViewer && styles.cardOwn)}
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
            {(photoPreview || person.photo) ? (
              <Image
                src={photoPreview ?? person.photo!}
                alt={`Фото ${person.name}`}
                fill
                sizes="(min-width: 1024px) 340px, 72vw"
                style={{ objectFit: "cover", opacity: isUploading ? 0.5 : 1 }}
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

            {/* Матовое стекло — появляется при наведении на свою карточку.
                Создаёт красивый эффект «выхода из фокуса» без грубого блюра. */}
            {isViewer && <div className={styles.frost} aria-hidden />}

            {/* Иконка смены фото — поверх матового слоя, правый верхний угол. */}
            {isViewer && (
              <div
                className={cn(
                  styles.ownActions,
                  isUploading && styles.ownActionsLoading,
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className={styles.fileInput}
                  aria-label="Выбрать аватарку"
                />
                <button
                  type="button"
                  className={styles.cameraBtn}
                  onClick={(e) => { e.stopPropagation(); triggerFileSelect(); }}
                  aria-label="Сменить фото"
                  title="Сменить фото"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <span className={styles.spinner} aria-hidden />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M14.5 4H9.5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4l-1.5-2z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                  )}
                </button>
              </div>
            )}

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
                  {reactions.map((reaction, i) => (
                    <span key={i} role="listitem" className={styles.reactionPill}>
                      <span aria-hidden>{reaction.emoji}</span>
                      <span>{reaction.count}</span>
                    </span>
                  ))}
                </span>
                <span
                  className={styles.mutual}
                  aria-label={`${mutualCount} взаимных реакций за месяц`}
                >
                  <span aria-hidden>🔁</span>
                  <span>{mutualCount} за месяц</span>
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
