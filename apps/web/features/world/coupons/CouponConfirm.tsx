"use client";

// Подтверждение погашения купона — спокойный билет-диалог.
//
// Каркас повторяет ForgotPasswordDialog (портал + фокус-трап + Escape +
// блокировка скролла), вход — мягкий fade + лёгкий подъём (ease-out, ~300ms).
// Без декоративных анимаций. На подтверждении — галочка в акцентном круге.
//
// Глубина слоёв:
//   0 — скрим-подложка
//   1 — мягкое свечение за билетом
//   2 — билет-карточка (перфорация по бокам)
//   3 — контент и действия
//
// Празднование целиком живёт здесь: страница по подтверждению просто гасит
// купон, а диалог сам показывает «Готово!» и закрывается.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useGender } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Coupon } from "@/lib/data/coupons";
import { CheckIcon, HeartIcon } from "./icons";
import { couponNumber } from "./number";
import styles from "./CouponConfirm.module.css";

/* ─── Хореография входа: мягко, без прыжков ─────────────────── */

const overlayVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, ease: "easeOut" } as const },
};

const auraVariants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut", delay: 0.1 } as const },
};

const ticketVariants = {
  hidden: { opacity: 0, y: 26, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.34, ease: "easeOut" } as const,
  },
};

const bodyVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.16 } as const },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } as const },
};

const medallionVariants = {
  hidden: { opacity: 0, scale: 0.7 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: "easeOut", delay: 0.08 } as const },
};

type Phase = "confirm" | "success";

interface CouponConfirmProps {
  coupon: Coupon;
  /**
   * Хватает ли у выкупающего сердечек на цену. Если нет — подтверждение
   * недоступно и вместо цены показывается «Не хватает N сердечек».
   */
  canAfford: boolean;
  onClose: () => void;
  /** Гасит купон; возвращает, действительно ли погашение произошло. */
  onConfirm: () => boolean;
}

export function CouponConfirm({ coupon, canAfford, onClose, onConfirm }: CouponConfirmProps) {
  const reduced = useReducedMotion();
  const { gender } = useGender();
  const [phase, setPhase] = useState<Phase>("confirm");
  const panelRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<Phase>(phase);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Монтирование: фокус на первичную кнопку, трап Tab, Escape закрывает,
  // блокировка скролла body, при размонтировании фокус возвращается к карточке.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const trigger = document.activeElement as HTMLElement | null;
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
    const primary = panel.querySelector<HTMLElement>("button:not([disabled])");
    (primary ?? panel).focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [onClose]);

  // Когда появляется статус успеха — переводим фокус на него, чтобы
  // скринридер озвучил результат (aria-live + фокус).
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

  const handleConfirm = useCallback(() => {
    if (phase !== "confirm") return;
    const ok = onConfirm();
    if (!ok) {
      onClose();
      return;
    }
    setPhase("success");
    closeTimer.current = setTimeout(onClose, 1700);
  }, [phase, onConfirm, onClose]);

  const handleBackdrop = useCallback(() => {
    // После подтверждения клик по фону не обрывает празднование раньше времени.
    if (phaseRef.current === "confirm") onClose();
  }, [onClose]);

  return createPortal(
    <div data-gender={gender ?? "neutral"} className={styles.overlay}>
      {/* 0 · Скрим-подложка */}
      <motion.div
        className={styles.backdrop}
        variants={overlayVariants}
        initial={reduced ? false : "hidden"}
        animate="show"
        aria-hidden
        onClick={handleBackdrop}
      />

      {/* 1 · Мягкое свечение за билетом */}
      <motion.div
        className={styles.aura}
        variants={auraVariants}
        initial={reduced ? false : "hidden"}
        animate="show"
        aria-hidden
      />

      <div className={styles.stage}>
        <div className={styles.ticketWrap}>
          {/* 2 · Билет-карточка */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="coupon-confirm-title"
            aria-describedby="coupon-confirm-desc"
            tabIndex={-1}
            className={styles.ticket}
            variants={ticketVariants}
            initial={reduced ? false : "hidden"}
            animate="show"
          >
            <motion.div
              className={styles.body}
              variants={bodyVariants}
              initial={reduced ? false : "hidden"}
              animate="show"
            >
              <motion.div variants={itemVariants} className={styles.ticketTop}>
                <motion.span
                  variants={medallionVariants}
                  className={styles.medallion}
                  aria-hidden
                >
                  {coupon.emoji}
                </motion.span>
                <span className={styles.ticketNo} aria-hidden>
                  № {couponNumber(coupon.id)}
                </span>
              </motion.div>

              <motion.h3
                variants={itemVariants}
                id="coupon-confirm-title"
                className={styles.title}
              >
                {coupon.title}
              </motion.h3>

              <motion.p
                variants={itemVariants}
                id="coupon-confirm-desc"
                className={styles.desc}
              >
                {coupon.description}
              </motion.p>

              {/* Линия перфорации — отрывает корешок от действий */}
              <motion.div variants={itemVariants} className={styles.perf} aria-hidden />

              {phase === "confirm" ? (
                <>
                  <motion.p variants={itemVariants} className={styles.question}>
                    {coupon.price > 0 ? (
                      <>
                        Выкупаем за
                        <span className={styles.questionHeart} aria-hidden>
                          <HeartIcon className={styles.questionHeartIcon} />
                        </span>
                        {coupon.price}? Сердечки сгорят
                      </>
                    ) : (
                      "Гасим купон? Время пришло"
                    )}
                  </motion.p>

                  <motion.div variants={itemVariants} className={styles.actions}>
                    <button
                      type="button"
                      onClick={onClose}
                      className={styles.cancel}
                    >
                      Передумали
                    </button>
                    {canAfford ? (
                      <motion.button
                        type="button"
                        onClick={handleConfirm}
                        whileTap={reduced ? undefined : { scale: 0.97 }}
                        className={styles.confirm}
                      >
                        <HeartIcon className={styles.confirmIcon} />
                        {coupon.price > 0
                          ? `Выкупить за ${coupon.price}`
                          : "Использовать"}
                      </motion.button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className={cn(styles.confirm, styles.confirmDisabled)}
                        title="Сначала заработайте сердечки"
                      >
                        Не хватает {coupon.price} сердечек
                      </button>
                    )}
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
                  <span className={styles.successMark} aria-hidden>
                    <CheckIcon className={styles.successCheck} />
                  </span>
                  <p className={styles.successTitle}>Готово!</p>
                  <p className={styles.successSub}>
                    Купон погашен — момент зарезервирован
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
