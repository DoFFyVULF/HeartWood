"use client";

// Отправка купона партнёру — подтверждение перед тем, как черновик уйдёт
// в книжку партнёра. Две фазы: confirm → success (купон «улетает»).
//
// Каркас повторяет ForgotPasswordDialog (портал + фокус-трап + Escape +
// блокировка скролла), вход — по канону epic-design: аура, пружинящая
// карточка, стаггер. На успехе — спокойный кружок с самолётиком, в едином
// стиле с CouponConfirm.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useGender } from "@/lib/theme";
import { findPerson } from "@/features/world/profile/couple";
import type { AuthorId, Coupon } from "@/lib/data/coupons";
import { HeartIcon, PlaneIcon } from "./icons";
import styles from "./CouponSendDialog.module.css";

interface CouponSendDialogProps {
  coupon: Coupon;
  to: AuthorId;
  /** Отправляет черновик; true, если отправка произошла. */
  onSend: () => boolean;
  onClose: () => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9, rotate: -2 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", bounce: 0.34, duration: 0.75 } as const,
  },
};

const bodyVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.18 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", bounce: 0.3, duration: 0.55 } as const,
  },
};

const planeVariants = {
  hidden: { opacity: 0, scale: 0.5, rotate: -20 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", bounce: 0.45, duration: 0.7 } as const,
  },
};

export function CouponSendDialog({ coupon, to, onSend, onClose }: CouponSendDialogProps) {
  const reduced = useReducedMotion();
  const { gender } = useGender();
  const [phase, setPhase] = useState<"confirm" | "success">("confirm");
  const panelRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const recipient = findPerson(to);

  // Фокус-трап, Escape закрывает только в фазе confirm, блокировка скролла,
  // возврат фокуса к триггеру при размонтировании.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const trigger = document.activeElement as HTMLElement | null;
    (panel.querySelector<HTMLElement>("button:not([disabled])") ?? panel).focus();

    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && phaseRef.current === "confirm") {
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

  // Когда появился успех — переводим фокус на статус для скринридера.
  useEffect(() => {
    if (phase !== "success") return;
    const status = panelRef.current?.querySelector<HTMLElement>("[data-success]");
    (status ?? panelRef.current)?.focus();
  }, [phase]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  const handleSend = useCallback(() => {
    if (phase !== "confirm") return;
    const ok = onSend();
    if (!ok) {
      onClose();
      return;
    }
    setPhase("success");
    closeTimer.current = setTimeout(onClose, 1600);
  }, [phase, onSend, onClose]);

  return createPortal(
    <div data-gender={gender ?? "neutral"} className={styles.overlay}>
      {/* 0 · Скрим-подложка */}
      <motion.div
        className={styles.backdrop}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        aria-hidden
        onClick={() => phaseRef.current === "confirm" && onClose()}
      />

      {/* 1 · Аура */}
      <div className={styles.aura} aria-hidden />

      <div className={styles.stage}>
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="send-dialog-title"
          aria-describedby="send-dialog-desc"
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
                <p className={styles.eyebrow}>Черновик → книжка</p>
                <h2 id="send-dialog-title" className={styles.title}>
                  {phase === "confirm"
                    ? `Отправить ${recipient.name}?`
                    : "Купон улетел!"}
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

            {phase === "confirm" ? (
              <>
                {/* Мини-билет купона */}
                <motion.div variants={itemVariants} className={styles.ticket}>
                  <span className={styles.ticketEmoji} aria-hidden>
                    {coupon.emoji}
                  </span>
                  <span className={styles.ticketText}>
                    <span className={styles.ticketTitle}>{coupon.title}</span>
                    <span className={styles.ticketPrice}>
                      <HeartIcon className={styles.ticketHeart} />
                      {coupon.price} при выкупе
                    </span>
                  </span>
                </motion.div>

                <motion.p variants={itemVariants} id="send-dialog-desc" className={styles.desc}>
                  {recipient.name} сможет выкупить его за{" "}
                  <strong className={styles.descPrice}>
                    <HeartIcon className={styles.descHeart} />
                    {coupon.price}
                  </strong>{" "}
                  — сердечки сгорят у выкупающего, вы ничего не получите
                </motion.p>

                <motion.div variants={itemVariants} className={styles.actions}>
                  <button type="button" onClick={onClose} className={styles.cancel}>
                    Ещё подумаю
                  </button>
                  <motion.button
                    type="button"
                    onClick={handleSend}
                    whileTap={reduced ? undefined : { scale: 0.96 }}
                    whileHover={reduced ? undefined : { y: -2 }}
                    className={styles.submit}
                  >
                    <PlaneIcon className={styles.submitIcon} />
                    Отправить {recipient.name}
                  </motion.button>
                </motion.div>
              </>
            ) : (
              <motion.div
                variants={itemVariants}
                className={styles.success}
                data-success
                role="status"
                aria-live="polite"
                tabIndex={-1}
              >
                <motion.span
                  variants={planeVariants}
                  initial={reduced ? false : "hidden"}
                  animate="show"
                  className={styles.successMark}
                  aria-hidden
                >
                  <PlaneIcon className={styles.successPlane} />
                </motion.span>
                <p className={styles.successTitle}>Купон в пути</p>
                <p className={styles.successSub}>
                  {recipient.name} найдёт «{coupon.title}» в книжке купонов
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>,
    document.body,
  );
}
