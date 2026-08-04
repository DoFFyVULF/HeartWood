"use client";

// Создатель даты — спокойное модальное окно: тип события, название, дата.
//
// Каркас повторяет GoalComposer (портал + фокус-трап + Escape + блокировка
// скролла), вход — мягкий fade + лёгкий подъём (ease-out, ~300ms). Без
// декоративных анимаций: чистая поверхность, одна акцентная кнопка.
//
// По подтверждению событие создаётся с нуля и сразу попадает в нужный
// раздел календаря. Годовщины из композера повторяются каждый год.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGender } from "@/lib/theme";
import { toISODate, type EventKind } from "@/lib/data/events";
import type { NewEventInput } from "./useEvents";
import { HeartIcon, PlusIcon, StarIcon, TicketIcon } from "./icons";
import styles from "./EventComposer.module.css";

// Типы события — иконка + подпись, выбираются как радио-карточки.
const KIND_OPTIONS: { kind: EventKind; label: string; Icon: typeof TicketIcon }[] = [
  { kind: "date", label: "Свидание", Icon: TicketIcon },
  { kind: "anniversary", label: "Годовщина", Icon: HeartIcon },
  { kind: "milestone", label: "Важная дата", Icon: StarIcon },
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

interface EventComposerProps {
  /** Создаёт событие; возвращает false, если запись не сохранилась. */
  onCreate: (input: NewEventInput) => boolean;
  onClose: () => void;
  /** Начальная дата (ISO) — выбранный день календаря; иначе «сегодня». */
  initialDate?: string;
}

export function EventComposer({ onCreate, onClose, initialDate }: EventComposerProps) {
  const reduced = useReducedMotion();
  const { gender } = useGender();

  const [kind, setKind] = useState<EventKind>("date");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => initialDate ?? toISODate(new Date()));
  const [error, setError] = useState<string | undefined>();
  const panelRef = useRef<HTMLDivElement>(null);

  // Фокус-трап и прочее — как в GoalComposer.
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
        setError("Название обязательно — без него дата потеряется");
        return;
      }
      if (!date) {
        setError("Выберите дату");
        return;
      }
      setError(undefined);
      const ok = onCreate({ kind, title: t, date });
      if (!ok) {
        setError("Не получилось сохранить дату — попробуйте ещё раз");
        return;
      }
      onClose();
    },
    [kind, title, date, onCreate, onClose],
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
          aria-labelledby="event-composer-title"
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
                <p className={styles.eyebrow}>Общий календарь</p>
                <h2 id="event-composer-title" className={styles.title}>
                  Добавить дату
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
              {/* Тип — радио-карточки с иконками */}
              <motion.div variants={itemVariants} className={styles.field}>
                <label className={styles.fieldLabel} id="event-kind-label">
                  Что это
                </label>
                <div
                  className={styles.kindRow}
                  role="radiogroup"
                  aria-labelledby="event-kind-label"
                >
                  {KIND_OPTIONS.map(({ kind: k, label, Icon }) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={kind === k}
                      aria-label={label}
                      onClick={() => setKind(k)}
                      className={cn(styles.kindBtn, kind === k && styles.kindBtnActive)}
                    >
                      <Icon className={styles.kindIcon} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Название */}
              <motion.div variants={itemVariants} className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="event-title">
                  Название
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Кино на крыше…"
                  maxLength={60}
                  className={styles.input}
                />
              </motion.div>

              {/* Дата */}
              <motion.div variants={itemVariants} className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="event-date">
                  Дата
                </label>
                <input
                  id="event-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={cn(styles.input, styles.dateInput)}
                />
                <p className={styles.hint}>
                  {kind === "anniversary"
                    ? "Годовщина повторяется каждый год — календарь сам напомнит"
                    : "Добавится в раздел с нужной датой"}
                </p>
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
                  Добавить
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
