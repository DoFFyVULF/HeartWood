"use client";

import { datesStatus } from "@/lib/data/datesStatus";
import { cn } from "@/lib/utils";
import styles from "./DateStats.module.css";

/**
 * Статистика свиданий — стеклянные карточки с каскадной анимацией.
 * Контент виден без JS (чистый CSS entrance).
 */
export function DateStats() {
  return (
    <section aria-labelledby="dates-stats-title" className={styles.section}>
      <h2 id="dates-stats-title" className="sr-only">
        Статистика свиданий
      </h2>

      {/* ← FIX: dl/dt/dd — валидный HTML */}
      <dl className={styles.grid}>
        {datesStatus.stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              styles.card,
              styles.entrance,
              stat.detail && styles.hasDetail,
            )}
            style={{ animationDelay: `${0.1 + index * 0.06}s` }}
            aria-describedby={stat.detail ? `stat-detail-${index}` : undefined}
          >
            <span aria-hidden className={styles.emoji}>
              {stat.emoji}
            </span>

            <div className={styles.content}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className={styles.value}>{stat.value}</dd>
              <span className={styles.label}>{stat.label}</span>
            </div>

            {stat.detail && (
              <div
                id={`stat-detail-${index}`}
                className={styles.detail}
                role="tooltip"
              >
                {stat.detail}
              </div>
            )}
          </div>
        ))}
      </dl>

      {/* Decorative floating elements */}
      <div className={styles.decorations} aria-hidden>
        <span className={styles.deco} style={{ "--i": "0" } as React.CSSProperties}>💕</span>
        <span className={styles.deco} style={{ "--i": "1" } as React.CSSProperties}>✨</span>
        <span className={styles.deco} style={{ "--i": "2" } as React.CSSProperties}>🌹</span>
        <span className={styles.deco} style={{ "--i": "3" } as React.CSSProperties}>💌</span>
        <span className={styles.deco} style={{ "--i": "4" } as React.CSSProperties}>🥂</span>
        <span className={styles.deco} style={{ "--i": "5" } as React.CSSProperties}>🌿</span>
      </div>
    </section>
  );
}