"use client";

// Виджет личного баланса «сердечек» внизу профиля.
//
// Ключевая деталь приватности: виджет привязан к «Я» — тому, кто открыл
// приложение (findPersonByGender), а НЕ к фокусной карточке профиля. Корень
// получает свой data-gender (мой пол), поэтому кошелёк всегда в моих цветах,
// даже когда в фокусе карточка партнёра. Партнёр своего баланса здесь
// не увидит — это личная секция, а не карточка пары.
//
// Баланс подтягивается из useHearts (localStorage), при тапе открывается
// модал истории за 30 дней (HeartsHistoryModal).

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useGender } from "@/lib/theme";
import { findPersonByGender } from "@/features/world/profile/couple";
import { useHearts } from "./useHearts";
import { HeartsHistoryModal } from "./HeartsHistoryModal";
import styles from "./HeartsWallet.module.css";

/** Аккуратный count-up: число «тикает» от старого баланса к новому. */
function useCountUp(target: number): number {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    if (reduced) {
      setShown(target);
      prevRef.current = target;
      return;
    }
    const from = prevRef.current;
    prevRef.current = target;
    if (from === target) return;

    const start = performance.now();
    const ms = 800;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setShown(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);

  return shown;
}

export function HeartsWallet() {
  const { gender } = useGender();

  // «Я» — владелец кошелька; его пол задаёт палитру виджета (data-gender).
  const me = findPersonByGender(gender);
  const { balance, history } = useHearts(me.id);
  const shown = useCountUp(balance);

  const [open, setOpen] = useState(false);

  return (
    <section
      className={styles.wallet}
      data-gender={gender ?? "neutral"}
      aria-label="Мои сердечки"
    >
      {/* Декоративное свечение */}
      <span className={styles.glow} aria-hidden />

      <button
        type="button"
        onClick={() => setOpen(true)}
        className={styles.button}
        aria-haspopup="dialog"
        aria-label={`Мои сердечки: ${balance}. Открыть историю за 30 дней`}
      >
        <span className={styles.emoji} aria-hidden>
          💛
        </span>

        <span className={styles.text}>
          <span className={styles.label}>Мои сердечки</span>
          <span className={styles.balance}>
            <span data-balance>{shown}</span>
            <span className={styles.unit} aria-hidden>
              {" "}
              💛
            </span>
          </span>
        </span>

        <span className={styles.chevron} aria-hidden>
          ›
        </span>
      </button>

      <p className={styles.caption}>
        История за 30 дней · только вы видите свой баланс
      </p>

      {open && (
        <HeartsHistoryModal
          balance={balance}
          history={history}
          onClose={() => setOpen(false)}
        />
      )}
    </section>
  );
}
