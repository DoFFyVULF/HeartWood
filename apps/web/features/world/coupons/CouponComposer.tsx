"use client";

// Создатель купона — спокойное модальное окно: название, описание, цена
// в сердечках, значок-эмодзи.
//
// Каркас повторяет ForgotPasswordDialog (портал + фокус-трап + Escape +
// блокировка скролла), вход — мягкий fade + лёгкий подъём (ease-out, ~300ms).
// Без декоративных анимаций: чистая поверхность, одна акцентная кнопка.
//
// По подтверждению купон создаётся ЧЕРНОВИКОМ (статус draft) и страница
// переключается на вкладку «Черновики».

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGender } from "@/lib/theme";
import { HeartIcon, PlusIcon } from "./icons";
import styles from "./CouponComposer.module.css";

// Пресет-эмодзи — выбор в модале.
const EMOJI_PRESETS = ["💆", "🍳", "🎬", "☕", "🎁", "💌", "🌷", "📷", "🧺", "🚿", "🎤", "🎮", "🛁", "🌙"];

// Пресет-цены — быстрые чипы + ручной ввод.
const PRICE_PRESETS = [5, 10, 15, 25, 50];

interface CouponComposerProps {
  /** Создаёт черновик; возвращает false, если запись не сохранилась. */
  onCreate: (input: {
    emoji: string;
    title: string;
    description: string;
    price: number;
  }) => Promise<boolean>;
  onClose: () => void;
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

export function CouponComposer({ onCreate, onClose }: CouponComposerProps) {
  const reduced = useReducedMotion();
  const { gender } = useGender();

  const [emoji, setEmoji] = useState("💆");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(10);
  const [error, setError] = useState<string | undefined>();
  const panelRef = useRef<HTMLDivElement>(null);

  // Фокус-трап и прочее — как в ForgotPasswordDialog.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const trigger = document.activeElement as HTMLElement | null;
    const firstFocusable = panel.querySelector<HTMLElement>("input, button");
    (firstFocusable ?? panel).focus();

    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [onClose]);

  const submit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const t = title.trim();
      if (!t) {
        setError("Название обязательно — без него не пообещать");
        return;
      }
      if (price < 1 || price > 99) {
        setError("Цена — от 1 до 99 сердечек");
        return;
      }
      setError(undefined);
      const ok = await onCreate({
        emoji,
        title: t,
        description: description.trim(),
        price,
      });
      if (!ok) {
        setError("Не получилось сохранить купон — попробуйте ещё раз");
        return;
      }
      onClose();
    },
    [title, description, price, emoji, onCreate, onClose],
  );

  const clampPrice = useCallback((raw: string) => {
    const n = Number.parseInt(raw.replace(/\D/g, ""), 10);
    if (Number.isNaN(n)) return 0;
    return Math.min(99, Math.max(0, n));
  }, []);

  return createPortal(
    <div data-gender={gender ?? "neutral"} className={styles.overlay}>
      {/* 0 · Скрим-подложка */}
      <motion.div
        className={styles.backdrop}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        aria-hidden
        onClick={onClose}
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
        >
          <motion.div
            className={styles.body}
            variants={bodyVariants}
            initial={reduced ? false : "hidden"}
            animate="show"
          >
            <motion.div variants={itemVariants} className={styles.header}>
              <div>
                <p className={styles.eyebrow}>Новое обещание</p>
                <h2 id="composer-title" className={styles.title}>
                  Создать купон
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className={styles.close}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className={styles.closeIcon}
                  aria-hidden
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </motion.div>

            <form onSubmit={submit} className={styles.form} noValidate>
              {/* Эмодзи — пресет-выбор */}
              <motion.div variants={itemVariants} className={styles.field}>
                <label className={styles.fieldLabel} id="composer-emoji-label">
                  Значок купона
                </label>
                <div
                  className={styles.emojiGrid}
                  role="radiogroup"
                  aria-labelledby="composer-emoji-label"
                >
                  {EMOJI_PRESETS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      role="radio"
                      aria-checked={emoji === e}
                      aria-label={`Значок ${e}`}
                      onClick={() => setEmoji(e)}
                      className={cn(styles.emojiBtn, emoji === e && styles.emojiBtnActive)}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Название */}
              <motion.div variants={itemVariants} className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="composer-title-input">
                  Название
                </label>
                <input
                  id="composer-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Массаж на диване…"
                  maxLength={60}
                  className={styles.input}
                />
              </motion.div>

              {/* Описание */}
              <motion.div variants={itemVariants} className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="composer-desc">
                  Описание
                </label>
                <textarea
                  id="composer-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Что именно обещаете…"
                  rows={2}
                  maxLength={140}
                  className={cn(styles.input, styles.textarea)}
                />
              </motion.div>

              {/* Цена */}
              <motion.div variants={itemVariants} className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="composer-price">
                  Цена в сердечках
                </label>
                <div className={styles.priceRow}>
                  <input
                    id="composer-price"
                    type="text"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => setPrice(clampPrice(e.target.value))}
                    className={cn(styles.input, styles.priceInput)}
                    aria-label="Цена в сердечках"
                  />
                  <span className={styles.priceSuffix} aria-hidden>
                    <HeartIcon className={styles.priceHeart} />
                  </span>
                  <div className={styles.pricePresets}>
                    {PRICE_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPrice(p)}
                        className={cn(styles.priceChip, price === p && styles.priceChipActive)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
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

              {/* Действия */}
              <motion.div variants={itemVariants} className={styles.actions}>
                <button type="button" onClick={onClose} className={styles.cancel}>
                  Отмена
                </button>
                <motion.button
                  type="submit"
                  whileTap={reduced ? undefined : { scale: 0.97 }}
                  className={styles.submit}
                >
                  <PlusIcon className={styles.submitIcon} />
                  Создать черновик
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>,
    document.body,
  );
}
