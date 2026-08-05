"use client";

import { useDates } from "@/lib/api-data";
import { cn } from "@/lib/utils";
import styles from "./DateStats.module.css";

/** Одна стеклянная карточка статистики. */
interface DatesStat {
  emoji: string;
  value: string;
  label: string;
  detail?: string;
}

/**
 * Строит карточки статистики из агрегата /dates: счётчики, любимое место,
 * средняя оценка, рекорд серии и топ-форматы.
 */
function buildStats(dates: {
  total: number;
  inviteScore: Record<string, number>;
  hoursTogether: number;
  bestStreak: number;
  averageRating: string;
  favoriteSpot: string | null;
  topTypes: Array<{ emoji: string; label: string; count: number }>;
}): DatesStat[] {
  const invited = Object.values(dates.inviteScore).reduce((a, b) => a + b, 0);
  const stats: DatesStat[] = [
    {
      emoji: "📅",
      value: String(dates.total),
      label: "Свиданий всего",
      detail: dates.total ? "Встречи, которые уже случились" : undefined,
    },
    {
      emoji: "💌",
      value: String(invited),
      label: "Приглашений отправлено",
    },
    {
      emoji: "⏱️",
      value: String(dates.hoursTogether),
      label: "Часов вместе",
      detail: "И каждая минута — драгоценна",
    },
    {
      emoji: "🔥",
      value: String(dates.bestStreak),
      label: "Рекорд подряд",
    },
  ];

  if (dates.averageRating !== "—") {
    stats.push({ emoji: "💯", value: dates.averageRating, label: "Средняя оценка" });
  }

  // Любимое место — только если оно есть в истории.
  if (dates.favoriteSpot) {
    stats.push({ emoji: "📍", value: dates.favoriteSpot, label: "Любимое место" });
  }

  // Топ-форматы — до двух карточек.
  for (const t of dates.topTypes.slice(0, 2)) {
    stats.push({ emoji: t.emoji, value: String(t.count), label: t.label });
  }

  return stats;
}

/**
 * Статистика свиданий — стеклянные карточки с каскадной анимацией.
 * Данные приходят с /dates (useDates); пока они грузятся, секция пустая.
 */
export function DateStats() {
  const { data } = useDates();
  const stats = data ? buildStats(data) : [];

  return (
    <section aria-labelledby="dates-stats-title" className={styles.section}>
      <h2 id="dates-stats-title" className="sr-only">
        Статистика свиданий
      </h2>

      {/* ← FIX: dl/dt/dd — валидный HTML */}
      <dl className={styles.grid}>
        {stats.map((stat, index) => (
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
