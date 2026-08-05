"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGender } from "@/lib/theme";
import { MEMORY_EMOJIS, type MemoryMedia } from "./memoryModel";
import { compressImage } from "./mediaUtils";
import { putMedia } from "./mediaStore";
import { CameraIcon, CloseIcon, HeartIcon } from "./icons";
import styles from "./MemoryComposer.module.css";

export interface MemoryDraft {
  title: string;
  emoji: string;
  date: string;
  story?: string;
  cover?: string;
  media: MemoryMedia[];
}

interface MemoryComposerProps {
  open: boolean;
  onClose: () => void;
  /** Возвращает false, если сохранить не удалось. */
  onSave: (draft: MemoryDraft) => Promise<boolean>;
}

/* ─── Хореография входа: мягко, без прыжков ─────────────────── */

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.32, ease: "easeOut" } as const,
  },
};

const bodyVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } as const },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } as const },
};

/**
 * Модалка создания воспоминания: заголовок, дата, эмодзи, история и обложка
 * (сжатие → Blob в IndexedDB, маленький cover-thumbnail — в метаданные).
 * Каркас повторяет CouponComposer: портал + фокус-трап + Escape + блокировка
 * скролла, чистые поверхности и одна акцентная кнопка.
 */
export function MemoryComposer({ open, onClose, onSave }: MemoryComposerProps) {
  const reduced = useReducedMotion();
  const { gender } = useGender();

  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState<string>(MEMORY_EMOJIS[0]);
  const [date, setDate] = useState("");
  const [story, setStory] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverMedia, setCoverMedia] = useState<MemoryMedia[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstFieldRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<() => void>(() => {});

  /* onClose может обновляться между рендерами — каждый рендер пишем актуальную
     версию в ref (нельзя присваивать ref в теле рендера). */
  useEffect(() => {
    closeRef.current = onClose;
  });

  /* Сброс и фокус при каждом открытии — сервер рендерит модалку закрытой,
     поэтому дата «сегодня» считается только на клиенте. Сброс синхронно
     в эффекте нарушает конвенцию React, поэтому всё — в rAF. */
  useEffect(() => {
    if (!open) return;
    const t = requestAnimationFrame(() => {
      setTitle("");
      setEmoji(MEMORY_EMOJIS[0]);
      setDate(new Date().toISOString().split("T")[0]);
      setStory("");
      setCoverPreview(null);
      setCoverMedia([]);
      setError(null);
      setBusy(false);
      firstFieldRef.current?.focus();
    });
    return () => cancelAnimationFrame(t);
  }, [open]);

  /* Escape + фокус-трап + блокировка скролла, как в CouponComposer */
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const current = panelRef.current;
      if (!current) return;

      const items = Array.from(
        current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => !el.hasAttribute("disabled"));
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === current || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  /* Обложка: сжатие → Blob в IndexedDB, thumb — в превью и метаданные */
  async function handleCover(file: File) {
    setBusy(true);
    setError(null);
    try {
      const { blob, thumbDataUrl, failed } = await compressImage(file);
      if (failed) {
        setError("Не удалось обработать изображение — попробуй другое фото");
        return;
      }
      const id = await putMedia(blob);
      setCoverMedia([{ id, kind: "photo" }]);
      setCoverPreview(thumbDataUrl);
    } catch {
      setError("Не удалось загрузить обложку");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Придумай название — без него полароид пустой");
      return;
    }
    setBusy(true);
    const ok = await onSave({
      title: cleanTitle,
      emoji,
      date,
      story: story.trim() || undefined,
      cover: coverPreview ?? undefined,
      media: coverMedia,
    });
    setBusy(false);
    if (!ok) return; // onSave уже показал причину
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <div data-gender={gender ?? "neutral"} className={styles.overlay}>
          {/* 0 · Скрим-подложка */}
          <motion.div
            className={styles.backdrop}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />

          {/* 1 · Мягкое свечение за окном */}
          <div className={styles.aura} aria-hidden />

          <div className={styles.stage}>
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="composer-title"
              tabIndex={-1}
              className={styles.card}
              variants={cardVariants}
              initial={reduced ? false : "hidden"}
              animate="show"
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className={styles.body}
                variants={bodyVariants}
                initial={reduced ? false : "hidden"}
                animate="show"
              >
                <motion.div variants={itemVariants} className={styles.header}>
                  <div>
                    <p className={styles.eyebrow}>Полароид в коллекцию</p>
                    <h2 id="composer-title" className={styles.title}>
                      Новое воспоминание
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрыть"
                    className={styles.close}
                  >
                    <CloseIcon className={styles.closeIcon} />
                  </button>
                </motion.div>

                <form
                  className={styles.form}
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                  noValidate
                >
                  {/* Заголовок */}
                  <motion.div variants={itemVariants} className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="mem-title">
                      Название
                    </label>
                    <input
                      id="mem-title"
                      ref={firstFieldRef}
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Например: Пикник у реки"
                      className={styles.input}
                      maxLength={60}
                      autoComplete="off"
                    />
                  </motion.div>

                  {/* Дата */}
                  <motion.div variants={itemVariants} className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="mem-date">
                      Дата
                    </label>
                    <input
                      id="mem-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={styles.input}
                      required
                    />
                  </motion.div>

                  {/* Эмодзи */}
                  <motion.div variants={itemVariants} className={styles.field}>
                    <label className={styles.fieldLabel} id="mem-emoji-label">
                      Настроение
                    </label>
                    <div
                      className={styles.emojiGrid}
                      role="radiogroup"
                      aria-labelledby="mem-emoji-label"
                    >
                      {MEMORY_EMOJIS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          role="radio"
                          aria-checked={emoji === e}
                          aria-label={`Настроение ${e}`}
                          className={cn(
                            styles.emojiBtn,
                            emoji === e && styles.emojiBtnActive,
                          )}
                          onClick={() => setEmoji(e)}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Обложка */}
                  <motion.div variants={itemVariants} className={styles.field}>
                    <label className={styles.fieldLabel} id="mem-cover-label">
                      Обложка{" "}
                      <span className={styles.optional}>(необязательно)</span>
                    </label>

                    {coverPreview ? (
                      <div className={styles.coverPreviewWrap}>
                        <img
                          src={coverPreview}
                          alt="Обложка воспоминания"
                          className={styles.coverPreview}
                        />
                        <button
                          type="button"
                          className={styles.coverRemove}
                          onClick={() => {
                            setCoverPreview(null);
                            setCoverMedia([]);
                          }}
                          aria-label="Убрать обложку"
                        >
                          <CloseIcon className={styles.coverRemoveIcon} />
                        </button>
                      </div>
                    ) : (
                      <label
                        className={cn(styles.coverDrop, busy && styles.busy)}
                        aria-labelledby="mem-cover-label"
                      >
                        <input
                          type="file"
                          accept="image/*"
                          className={styles.srOnly}
                          disabled={busy}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleCover(file);
                            e.target.value = "";
                          }}
                        />
                        <CameraIcon className={styles.coverIcon} />
                        <span className={styles.coverText}>
                          {busy ? "Обрабатываем…" : "Нажми, чтобы выбрать фото"}
                        </span>
                      </label>
                    )}
                  </motion.div>

                  {/* История */}
                  <motion.div variants={itemVariants} className={styles.field}>
                    <label className={styles.fieldLabel} htmlFor="mem-story">
                      История{" "}
                      <span className={styles.optional}>(необязательно)</span>
                    </label>
                    <textarea
                      id="mem-story"
                      value={story}
                      onChange={(e) => setStory(e.target.value)}
                      placeholder="Что запомнилось больше всего?"
                      className={cn(styles.input, styles.textarea)}
                      rows={4}
                      maxLength={400}
                      autoComplete="off"
                    />
                  </motion.div>

                  {error && (
                    <motion.p
                      variants={itemVariants}
                      role="alert"
                      className={styles.error}
                    >
                      {error}
                    </motion.p>
                  )}

                  <motion.button
                    variants={itemVariants}
                    type="submit"
                    disabled={busy || !title.trim()}
                    className={cn(
                      styles.primaryBtn,
                      (!title.trim() || busy) && styles.primaryBtnOff,
                    )}
                  >
                    <HeartIcon className={styles.submitIcon} />
                    Сохранить воспоминание
                  </motion.button>
                </form>
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
