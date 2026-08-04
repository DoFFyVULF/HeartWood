"use client";

// Создатель цели — спокойное модальное окно: категория, название, размер
// копилки в рублях.
//
// Каркас повторяет CouponComposer (портал + фокус-трап + Escape + блокировка
// скролла), вход — мягкий fade + лёгкий подъём (ease-out, ~300ms). Без
// декоративных анимаций: чистая поверхность, одна акцентная кнопка.
//
// По подтверждению цель создаётся с нуля (saved = 0) и появляется в сетке.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGender } from "@/lib/theme";
import type { GoalKind } from "@/lib/data/goals";
import type { NewGoalInput } from "./useGoals";
import { PlaneIcon, PlusIcon, RubleIcon, SofaIcon, SunsetIcon } from "./icons";
import styles from "./GoalComposer.module.css";

// Категории цели — иконка + подпись, выбираются как радио-карточки.
const KIND_OPTIONS: { kind: GoalKind; label: string; Icon: typeof PlaneIcon }[] = [
  { kind: "trip", label: "Поездка", Icon: PlaneIcon },
  { kind: "home", label: "Дом", Icon: SofaIcon },
  { kind: "celebration", label: "Праздник", Icon: SunsetIcon },
];

// Пресет-размеры копилки — быстрые чипы + ручной ввод.
const TARGET_PRESETS = [10000, 30000, 60000, 100000];

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

interface GoalComposerProps {
  /** Создаёт цель; возвращает null, если запись не сохранилась. */
  onCreate: (input: NewGoalInput) => boolean;
  onClose: () => void;
}

export function GoalComposer({ onCreate, onClose }: GoalComposerProps) {
  const reduced = useReducedMotion();
  const { gender } = useGender();

  const [kind, setKind] = useState<GoalKind>("trip");
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState(30000);
  const [error, setError] = useState<string | undefined>();
  const panelRef = useRef<HTMLDivElement>(null);

  // Фокус-трап и прочее — как в CouponComposer.
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
        setError("Название обязательно — без мечты не накопить");
        return;
      }
      if (target < 1) {
        setError("Копилка должна быть хотя бы 1 ₽");
        return;
      }
      setError(undefined);
      const ok = onCreate({ kind, title: t, target });
      if (!ok) {
        setError("Не получилось сохранить цель — попробуйте ещё раз");
        return;
      }
      onClose();
    },
    [kind, title, target, onCreate, onClose],
  );

  const clampTarget = useCallback((raw: string) => {
    const n = Number.parseInt(raw.replace(/\D/g, ""), 10);
    if (Number.isNaN(n)) return 0;
    return Math.min(99999, Math.max(0, n));
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
          aria-labelledby="goal-composer-title"
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
                <p className={styles.eyebrow}>Новая мечта</p>
                <h2 id="goal-composer-title" className={styles.title}>
                  Создать цель
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
              {/* Категория — радио-карточки с иконками */}
              <motion.div variants={itemVariants} className={styles.field}>
                <label className={styles.fieldLabel} id="goal-kind-label">
                  Куда копим
                </label>
                <div
                  className={styles.kindRow}
                  role="radiogroup"
                  aria-labelledby="goal-kind-label"
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
                <label className={styles.fieldLabel} htmlFor="goal-title">
                  Название
                </label>
                <input
                  id="goal-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Копим на море…"
                  maxLength={60}
                  className={styles.input}
                />
              </motion.div>

              {/* Размер копилки */}
              <motion.div variants={itemVariants} className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="goal-target">
                  Размер копилки
                </label>
                <div className={styles.targetRow}>
                  <input
                    id="goal-target"
                    type="text"
                    inputMode="numeric"
                    value={target}
                    onChange={(e) => setTarget(clampTarget(e.target.value))}
                    className={cn(styles.input, styles.targetInput)}
                    aria-label="Размер копилки в рублях"
                  />
                  <span className={styles.targetSuffix} aria-hidden>
                    <RubleIcon className={styles.targetUnit} />
                  </span>
                  <div className={styles.targetPresets}>
                    {TARGET_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTarget(p)}
                        className={cn(styles.targetChip, target === p && styles.targetChipActive)}
                      >
                        {p.toLocaleString("ru-RU")}
                      </button>
                    ))}
                  </div>
                </div>
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
                  Создать цель
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
