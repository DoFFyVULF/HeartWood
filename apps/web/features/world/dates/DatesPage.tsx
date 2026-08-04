"use client";

import { useState, useCallback } from "react";
import { DateStats } from "./DateStats";
import { LetterComposer, type LetterData } from "./LetterComposer";
import { datesStatus, type EnvelopeOption } from "@/lib/data/datesStatus";
import { generateId } from "@/lib/сonstants";
import styles from "./DatesPage.module.css";

interface SentLetter extends LetterData {
  id: string;
  sentAt: Date;
}

function sealEmoji(key: string): string {
  const opts = (datesStatus.envelopeCustomizations.find((c) => c.key === "seal")
    ?.options ?? []) as EnvelopeOption[];
  return opts.find((o) => o.key === key)?.emoji ?? "💌";
}

/** Иконки для quick-stats — чтобы пилюли выглядели «живыми». */
const QUICK_STAT_ICONS: Record<string, string> = {
  "свиданий": "💕",
  "в этом месяце": "📅",
  "в планах": "✨",
};

export function DatesPage() {
  const [sent, setSent] = useState<SentLetter[]>([]);

  const handleSend = useCallback((data: LetterData) => {
    setSent((prev) => [...prev, { ...data, id: generateId("inv"), sentAt: new Date() }]);
  }, []);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <div className={`${styles.eyebrow} ${styles.entranceRise}`}>
              <span className={styles.eyebrowDot} aria-hidden />
              Календарь любви
            </div>
            <div className={styles.titleWrap}>
            </div>
            <p
              className={`${styles.subtitle} ${styles.entranceRise}`}
              style={{ animationDelay: "0.1s" }}
            >
              Каждое свидание — новая глава вашей истории
            </p>
          </div>

          <div
            className={`${styles.quickStats} ${styles.entrancePop}`}
            style={{ animationDelay: "0.2s" }}
          >
            {[
              { value: "23", label: "свиданий" },
              { value: "2",  label: "в этом месяце" },
              { value: "1",  label: "в планах" },
            ].map((s) => (
              <span key={s.label} className={styles.quickStat}>
                <span className={styles.quickStatIcon} aria-hidden>
                  {QUICK_STAT_ICONS[s.label] ?? "💕"}
                </span>
                <span className={styles.quickStatBody}>
                  <strong className={styles.quickStatVal}>{s.value}</strong>
                  <small className={styles.quickStatLbl}>{s.label}</small>
                </span>
              </span>
            ))}
          </div>
        </div>

        <div
          className={`${styles.divider} ${styles.entranceStretch}`}
          style={{ animationDelay: "0.3s" }}
          aria-hidden
        />
      </header>

      {/* Stats */}
      <section className={styles.entranceRise} style={{ animationDelay: "0.2s" }}>
        <DateStats />
      </section>

      {/* Письмо */}
      <section
        className={`${styles.composerSection} ${styles.entranceRise}`}
        style={{ animationDelay: "0.3s" }}
        aria-label="Студия письма"
      >
        <LetterComposer onSend={handleSend} />
      </section>

      {/* History */}
      {sent.length > 0 && (
        <section className={styles.entranceRise} aria-label="Отправленные приглашения">
          <h2 className={styles.historyTitle}>
            <span className={styles.historyTitleIcon} aria-hidden>📬</span>
            <span className={styles.historyTitleText}>Отправленные письма</span>
          </h2>
          <ul className={styles.historyList}>
            {sent.slice(-5).reverse().map((inv, i) => (
              <li
                key={inv.id}
                className={styles.historyItem}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <span className={styles.historyEmoji} aria-hidden>
                  {sealEmoji(inv.seal)}
                </span>
                <div className={styles.historyInfo}>
                  <span className={styles.historyTo}>Кому: {inv.to}</span>
                  <span className={styles.historyMeta}>
                    {new Date(inv.sentAt).toLocaleDateString("ru-RU", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    ·{" "}
                    {new Date(inv.sentAt).toLocaleTimeString("ru-RU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span className={styles.historyCheck} aria-label="Отправлено">
                  ✓
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ambient — три слоя с разной глубиной и скоростью */}
      <div className={styles.ambient} aria-hidden>
        {/* Дальний план — крупные, медленные, размытые */}
        <span className={styles.ambientFar} style={{ top: "12%", left: "6%",  animationDelay: "0s" }}>💕</span>
        <span className={styles.ambientFar} style={{ top: "68%", right: "8%", animationDelay: "4s" }}>🌹</span>

        {/* Средний план */}
        <span className={styles.ambientMid} style={{ top: "28%", right: "5%",  animationDelay: "1.5s" }}>✨</span>
        <span className={styles.ambientMid} style={{ top: "55%", left: "3%",   animationDelay: "3s" }}>💌</span>
        <span className={styles.ambientMid} style={{ top: "82%", right: "14%", animationDelay: "5.5s" }}>🥂</span>

        {/* Ближний план — чёткие, быстрее */}
        <span className={styles.ambientNear} style={{ top: "40%", left: "7%",  animationDelay: "0.8s" }}>🌿</span>
        <span className={styles.ambientNear} style={{ top: "72%", left: "11%", animationDelay: "2.4s" }}>❀</span>
      </div>
    </div>
  );
}