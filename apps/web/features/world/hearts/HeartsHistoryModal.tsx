"use client";

// Модал «История сердечек» — движения баланса за 30 дней.
//
// Каркас повторяет ForgotPasswordDialog: портал в body, фокус-трап Tab,
// Escape закрывает, блокировка скролла, возврат фокуса на кнопку-триггер,
// data-gender на корне портала (личная палитра владельца кошелька).
//
// Сверху — три сводки (Баланс / Заработано / Потрачено), ниже — группировка
// транзакций по дням с эмодзи причины (TX_META). Пустая история — мягкое
// приглашение начать копить.

import { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useGender } from "@/lib/theme";
import { TX_META, type HeartTx } from "@/lib/data/hearts";
import styles from "./HeartsHistoryModal.module.css";

interface HeartsHistoryModalProps {
  balance: number;
  history: HeartTx[];
  onClose: () => void;
}

/** Группирует транзакции по метке дня, сохраняя порядок (свежие сверху). */
function groupByDay(txs: HeartTx[]): { day: string; txs: HeartTx[] }[] {
  const groups: { day: string; txs: HeartTx[] }[] = [];
  for (const tx of txs) {
    const last = groups[groups.length - 1];
    if (last && last.day === tx.at) {
      last.txs.push(tx);
    } else {
      groups.push({ day: tx.at, txs: [tx] });
    }
  }
  return groups;
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", bounce: 0.3, duration: 0.55 } as const,
  },
};

export function HeartsHistoryModal({
  balance,
  history,
  onClose,
}: HeartsHistoryModalProps) {
  const reduced = useReducedMotion();
  const { gender } = useGender();
  const panelRef = useRef<HTMLDivElement>(null);

  const earned = useMemo(
    () => history.filter((tx) => tx.amount > 0).reduce((s, tx) => s + tx.amount, 0),
    [history],
  );
  const spent = useMemo(
    () => history.filter((tx) => tx.amount < 0).reduce((s, tx) => s - tx.amount, 0),
    [history],
  );
  const days = useMemo(() => groupByDay(history), [history]);

  // Фокус на панель, трап Tab, Escape закрывает, блокировка скролла,
  // возврат фокуса к триггеру при размонтировании.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const trigger = document.activeElement as HTMLElement | null;
    (panel.querySelector<HTMLElement>("button, [tabindex]") ?? panel).focus();

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

  return createPortal(
    <div data-gender={gender ?? "neutral"} className={styles.overlay}>
      {/* 0 · Скрим-подложка */}
      <div className={styles.backdrop} aria-hidden onClick={onClose} />

      <div className={styles.stage}>
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="hearts-history-title"
          tabIndex={-1}
          className={styles.panel}
          initial={reduced ? false : { opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", bounce: 0.32, duration: 0.7 }}
        >
          <div className={styles.header}>
            <div>
              <p className={styles.eyebrow}>Личный счёт</p>
              <h2 id="hearts-history-title" className={styles.title}>
                История сердечек
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
          </div>

          {/* Сводка */}
          <div className={styles.summary} aria-label="Сводка за 30 дней">
            <div className={styles.summaryCell}>
              <span className={styles.summaryEmoji} aria-hidden>
                💛
              </span>
              <span className={styles.summaryNum}>{balance}</span>
              <span className={styles.summaryLabel}>Баланс</span>
            </div>
            <div className={styles.summaryCell}>
              <span className={styles.summaryEmoji} aria-hidden>
                ⬆️
              </span>
              <span className={styles.summaryNum}>{earned}</span>
              <span className={styles.summaryLabel}>Заработано</span>
            </div>
            <div className={styles.summaryCell}>
              <span className={styles.summaryEmoji} aria-hidden>
                ⬇️
              </span>
              <span className={styles.summaryNum}>{spent}</span>
              <span className={styles.summaryLabel}>Потрачено</span>
            </div>
          </div>

          {/* История */}
          {days.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyEmoji} aria-hidden>
                🪴
              </span>
              <p className={styles.emptyTitle}>Пока пусто</p>
              <p className={styles.emptySub}>
                Заходите каждый день и получайте +10 💛 — здесь появится история
              </p>
            </div>
          ) : (
            <motion.ul
              className={styles.list}
              variants={listVariants}
              initial={reduced ? false : "hidden"}
              animate="show"
              aria-label="Транзакции за 30 дней"
            >
              {days.map((group) => (
                <li key={group.day} className={styles.dayGroup}>
                  <p className={styles.dayLabel}>{group.day}</p>
                  <ul className={styles.dayList}>
                    {group.txs.map((tx) => (
                      <motion.li
                        key={tx.id}
                        variants={itemVariants}
                        className={styles.row}
                      >
                        <span className={styles.rowEmoji} aria-hidden>
                          {TX_META[tx.reason].emoji}
                        </span>
                        <span className={styles.rowText}>
                          <span className={styles.rowTitle}>
                            {TX_META[tx.reason].title}
                          </span>
                          <span className={styles.rowLabel}>{tx.label}</span>
                        </span>
                        <span
                          className={`${styles.rowAmount} ${
                            tx.amount > 0 ? styles.rowEarned : styles.rowSpent
                          }`}
                        >
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount} 💛
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </li>
              ))}
            </motion.ul>
          )}

          <p className={styles.footnote}>
            Показываются движения за последние 30 дней
          </p>
        </motion.div>
      </div>
    </div>,
    document.body,
  );
}
