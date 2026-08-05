"use client";

// Карточка «Вторая половинка ещё не здесь» — появляется в профиле, пока
// в паре один участник. Два пути:
//   1) показать код пары, чтобы вторая половинка вступила при регистрации;
//   2) ввести код, если вторая половинка уже зарегистрировалась и ждёт.
// После успешного вступления onJoined перезагружает кэши и контекст auth —
// карточка исчезает, код пары прячется, в хедере появляется вторая половинка.

import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { cn } from "@/lib/utils";
import styles from "./CoupleJoinCard.module.css";

interface CoupleJoinCardProps {
  /** Код текущей пары — для приглашения второй половинки. */
  code: string;
  /** Вызывается после успешного вступления в чужую пару. */
  onJoined: () => void;
}

export function CoupleJoinCard({ code, onJoined }: CoupleJoinCardProps) {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleJoin = async () => {
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.joinCouple({ code: trimmed });
      onJoined();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Не получилось — попробуйте ещё раз",
      );
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.card} aria-label="Добавить вторую половинку">
      <div className={styles.header}>
        <span className={styles.heart} aria-hidden>
          💛
        </span>
        <div>
          <h2 className={styles.title}>Вторая половинка ещё не здесь</h2>
          <p className={styles.subtitle}>
            Поделитесь кодом пары, чтобы она вступила, или введите её код,
            если она уже зарегистрировалась.
          </p>
        </div>
      </div>

      {/* Путь 1 · мой код — зову вторую половинку */}
      <div className={styles.invite}>
        <span className={styles.inviteLabel}>Код вашей пары</span>
        <div className={styles.codeRow}>
          <code className={styles.code}>{code}</code>
          <button
            type="button"
            onClick={handleCopy}
            className={cn(styles.copyBtn, copied && styles.copyBtnCopied)}
            aria-live="polite"
          >
            {copied ? "Скопировано ✓" : "Копировать"}
          </button>
        </div>
      </div>

      <div className={styles.divider}>
        <span>или</span>
      </div>

      {/* Путь 2 · чужой код — вступаю в пару второй половинки */}
      <form
        className={styles.joinForm}
        onSubmit={(e) => {
          e.preventDefault();
          void handleJoin();
        }}
      >
        <label htmlFor="couple-join-code" className={styles.joinLabel}>
          Код пары второй половинки
        </label>
        <div className={styles.joinRow}>
          <input
            id="couple-join-code"
            className={styles.input}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
            }}
            placeholder="HW-XXXX"
            autoComplete="off"
            spellCheck={false}
            maxLength={20}
          />
          <button
            type="submit"
            className={styles.joinBtn}
            disabled={submitting || input.trim().length < 3}
          >
            {submitting ? "Вступаем…" : "Присоединиться"}
          </button>
        </div>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}
