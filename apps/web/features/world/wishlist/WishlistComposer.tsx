"use client";

// Создатель желания — спокойное модальное окно: чья мечта, название, описание.
//
// Каркас повторяет EventComposer (портал + фокус-трап + Escape + блокировка
// скролла), вход — мягкий fade + лёгкий подъём (ease-out, ~300ms). Без
// декоративных анимаций: чистая поверхность, одна акцентная кнопка.
//
// «Чья мечта» — радио-карточки Дима/Аня: мечтать можно и за партнёра
// (сюрприз), но добавляет желание текущий участник. Созданное желание сразу
// попадает в раздел «В списке».

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGender } from "@/lib/theme";
import type { AuthorId } from "@/lib/data/wishlist";
import type { NewWishInput } from "./useWishlist";
import { DreamIcon, GiftIcon, PlusIcon } from "./icons";
import styles from "./WishlistComposer.module.css";

// Кто загадывает — радио-карточки с именами пары.
const WISHER_OPTIONS: { wisherId: AuthorId; label: string; Icon: typeof GiftIcon }[] = [
  { wisherId: "dima", label: "Дима", Icon: GiftIcon },
  { wisherId: "anya", label: "Аня", Icon: DreamIcon },
];

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

interface WishlistComposerProps {
  /** Создаёт желание; возвращает false, если запись не сохранилась. */
  onCreate: (input: NewWishInput) => boolean;
  onClose: () => void;
}

export function WishlistComposer({ onCreate, onClose }: WishlistComposerProps) {
  const reduced = useReducedMotion();
  const { gender } = useGender();

  const [wisherId, setWisherId] = useState<AuthorId>("dima");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | undefined>();
  const panelRef = useRef<HTMLDivElement>(null);

  // Фокус-трап и прочее — как в EventComposer.
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
    (event: React.FormEvent) => {
      event.preventDefault();
      const t = title.trim();
      if (!t) {
        setError("Название обязательно — без него желание потеряется");
        return;
      }
      setError(undefined);
      const ok = onCreate({ wisherId, title: t, description });
      if (!ok) {
        setError("Не получилось сохранить желание — попробуйте ещё раз");
        return;
      }
      onClose();
    },
    [wisherId, title, description, onCreate, onClose],
  );

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
          aria-labelledby="wishlist-composer-title"
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
                <p className={styles.eyebrow}>Список желаний</p>
                <h2 id="wishlist-composer-title" className={styles.title}>
                  Новая мечта
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
              {/* Чья мечта — радио-карточки с именами */}
              <motion.div variants={itemVariants} className={styles.field}>
                <label className={styles.fieldLabel} id="wishlist-wisher-label">
                  Чья мечта
                </label>
                <div
                  className={styles.wisherRow}
                  role="radiogroup"
                  aria-labelledby="wishlist-wisher-label"
                >
                  {WISHER_OPTIONS.map(({ wisherId: id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={wisherId === id}
                      aria-label={`Мечта ${label}`}
                      onClick={() => setWisherId(id)}
                      className={cn(styles.wisherBtn, wisherId === id && styles.wisherBtnActive)}
                    >
                      <Icon className={styles.wisherIcon} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <p className={styles.hint}>
                  Можно загадать и за партнёра — ему будет сюрприз
                </p>
              </motion.div>

              {/* Название */}
              <motion.div variants={itemVariants} className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="wishlist-title">
                  О чём мечтаем
                </label>
                <input
                  id="wishlist-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Венеция на двоих…"
                  maxLength={60}
                  className={styles.input}
                />
              </motion.div>

              {/* Описание */}
              <motion.div variants={itemVariants} className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="wishlist-description">
                  Что-то ещё
                </label>
                <textarea
                  id="wishlist-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Почему это важно и как бы это выглядело…"
                  rows={3}
                  maxLength={200}
                  className={cn(styles.input, styles.textarea)}
                />
              </motion.div>

              {error && (
                <motion.p variants={itemVariants} role="alert" className={styles.error}>
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
                  Загадать
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
