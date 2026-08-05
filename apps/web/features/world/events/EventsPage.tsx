"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  countdownLabel,
  daysUntil,
  formatDayNumber,
  formatFullDate,
  formatMonthShort,
  toISODate,
  upcomingOccurrences,
} from "@/lib/dateUtils";
import { useEvents } from "@/lib/api-data";
import type { EventView } from "@/lib/types";
import { EventComposer } from "./EventComposer";
import { CalendarGrid } from "./CalendarGrid";
import { DayPanel } from "./DayPanel";
import { CalendarIcon, HeartIcon, PlusIcon, StarIcon, TicketIcon } from "./icons";
import styles from "./EventsPage.module.css";

/** Иконка типа события. */
const KIND_ICON: Record<string, (props: { className?: string }) => React.ReactElement> = {
  date: TicketIcon,
  anniversary: HeartIcon,
  milestone: StarIcon,
};

/**
 * Страница «Календарь» — месяц-сетка пары.
 *
 * В центре — живой месяц: ячейки-дни с маркерами событий, «сегодня» и
 * выбранный день. Справа — боковая панель: что в выбранный день, ближайшие
 * свидания и годовщины, важные даты-вехи. Герой «следующее событие» с
 * обратным отсчётом — как и раньше, сверху. Календарь живой: «сегодня»
 * вычисляется на клиенте, добавленные даты сразу попадают в сетку и панель.
 *
 * Карточки — «стекло»: чистые поверхности, волосяные рамки, одна мягкая
 * тень. Вся гамма — из токенов темы (--hwd-*), перекрашивается по гендеру.
 */
export function EventsPage() {
  const { data: eventsData, create, remove } = useEvents();
  const events = eventsData ?? [];

  const [today, setToday] = useState<Date | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // «Сегодня» известно только на клиенте. До первого кадра используем
  // фиксированную дату (SSR-гидрация совпадает), затем — реальную.
  // Выбранный день тоже живёт только на клиенте: пока нет реальной даты,
  // панель дня рисует пустое состояние, затем авто-выбирает «сегодня».
  useEffect(() => {
    const t = requestAnimationFrame(() => {
      const d = new Date();
      setToday(d);
      setSelected((s) => s ?? toISODate(d));
    });
    return () => cancelAnimationFrame(t);
  }, []);

  // SSR-fallback: дата вокруг seed-событий, чтобы сортировка не менялась.
  // useMemo — чтобы ссылка на Date была стабильной между рендерами.
  const now = useMemo(() => today ?? new Date(2026, 7, 4), [today]);

  // Ближайшие вхождения (свидания + годовщины) — общий feed для героя и
  // панели «Ближайшее». Первое — «следующее событие».
  const upcoming = useMemo(() => upcomingOccurrences(events, now), [events, now]);
  const nextUp = upcoming[0] ?? null;

  // Сводка в шапке: свидания впереди / годовщины / важные даты.
  const upcomingCount = upcoming.filter((o) => o.event.kind === "date").length;
  const anniversaryCount = events.filter((e) => e.kind === "anniversary").length;
  const milestoneCount = events.filter((e) => e.kind === "milestone").length;

  /** Добавляет событие и закрывает композер. */
  const handleCreate = useCallback(
    async (input: {
      kind: "date" | "anniversary" | "milestone";
      title: string;
      date: string;
    }): Promise<boolean> => {
      const ok = await create(input);
      if (!ok) return false;
      setComposing(false);
      setNotice(`Дата «${input.title}» в календаре`);
      return true;
    },
    [create],
  );

  const handleRemove = useCallback(
    async (event: EventView) => {
      await remove(event.id);
      setNotice(`Дата «${event.title}» удалена`);
    },
    [remove],
  );

  /** Открыть композер на конкретный день (из панели дня или «сегодня»). */
  const handleAddDate = useCallback((iso: string) => {
    setSelected(iso);
    setComposing(true);
  }, []);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div
          className={`${styles.eyebrow} ${styles.entranceRise}`}
          style={{ animationDelay: "0.05s" }}
        >
          <span className={styles.eyebrowDot} aria-hidden />
          Общий календарь
        </div>

        <h1
          className={`${styles.title} ${styles.entranceRise}`}
          style={{ animationDelay: "0.1s" }}
        >
          Наши даты
        </h1>

        <p
          className={`${styles.subtitle} ${styles.entranceRise}`}
          style={{ animationDelay: "0.15s" }}
        >
          Годовщины, свидания и важные дни — всё в одном месте
        </p>

        {/* Сводка: впереди / годовщины / важные даты */}
        <div className={styles.summary} role="list" aria-label="События в календаре">
          <div className={styles.summaryItem} role="listitem">
            <span className={styles.summaryIcon} aria-hidden>
              <TicketIcon className={styles.summarySvg} />
            </span>
            <span className={styles.summaryBody}>
              <strong className={styles.summaryNum}>{upcomingCount}</strong>
              <span className={styles.summaryLabel}>свиданий впереди</span>
            </span>
          </div>
          <div className={styles.summaryItem} role="listitem">
            <span className={styles.summaryIcon} aria-hidden>
              <HeartIcon className={styles.summarySvg} />
            </span>
            <span className={styles.summaryBody}>
              <strong className={styles.summaryNum}>{anniversaryCount}</strong>
              <span className={styles.summaryLabel}>годовщин</span>
            </span>
          </div>
          <div className={styles.summaryItem} role="listitem">
            <span className={styles.summaryIcon} aria-hidden>
              <StarIcon className={styles.summarySvg} />
            </span>
            <span className={styles.summaryBody}>
              <strong className={styles.summaryNum}>{milestoneCount}</strong>
              <span className={styles.summaryLabel}>важных дат</span>
            </span>
          </div>
        </div>

        <div
          className={`${styles.divider} ${styles.entranceStretch}`}
          style={{ animationDelay: "0.3s" }}
          aria-hidden
        />
      </header>

      {/* Герой «следующее событие» */}
      {nextUp && <NextHero event={nextUp.event} next={nextUp.date} now={now} />}

      {/* Кнопка новой даты */}
      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={() => handleAddDate(selected ?? toISODate(now))}
          className={styles.addBtn}
          aria-label="Добавить дату"
        >
          <PlusIcon className={styles.addIcon} />
          <span className={styles.addLabel}>Добавить дату</span>
        </button>
      </div>

      {/* Ошибка/уведомление */}
      {notice && (
        <div className={styles.notice} role="status">
          <span className={styles.noticeDot} aria-hidden />
          <span>{notice}</span>
        </div>
      )}

      {/* Месяц-сетка + боковая панель */}
      <div className={styles.calendarLayout}>
        <CalendarGrid
          events={events}
          now={now}
          selected={selected}
          onSelect={setSelected}
        />
        <DayPanel
          events={events}
          now={now}
          selected={selected}
          upcoming={upcoming}
          onAddDate={handleAddDate}
          onRemove={handleRemove}
        />
      </div>

      <p className={styles.footnote}>
        Годовщины повторяются каждый год — календарь всегда помнит о важном
      </p>

      {/* Добавление даты */}
      {composing && (
        <EventComposer
          onCreate={handleCreate}
          onClose={() => setComposing(false)}
          initialDate={selected ?? undefined}
        />
      )}
    </div>
  );
}

/** Герой: ближайшее событие с крупным отсчётом. */
function NextHero({
  event,
  next,
  now,
}: {
  event: EventView;
  next: Date;
  now: Date;
}) {
  const reduced = useReducedMotion();
  const days = daysUntil(next, now);
  const Icon = KIND_ICON[event.kind] ?? CalendarIcon;

  return (
    <div className={styles.hero} role="group" aria-label="Следующее событие">
      <span className={styles.heroMedallion} aria-hidden>
        <Icon className={styles.heroIcon} />
      </span>

      <div className={styles.heroBody}>
        <span className={styles.heroEyebrow}>Следующее событие</span>
        <h2 className={styles.heroTitle}>{event.title}</h2>
        {event.description && <p className={styles.heroDesc}>{event.description}</p>}
        <span className={styles.heroMeta}>
          <span className={styles.heroCalendarSquare} aria-hidden>
            <strong className={styles.heroDay}>{formatDayNumber(next)}</strong>
            <small className={styles.heroMonth}>{formatMonthShort(next)}</small>
          </span>
          <span className={styles.heroDate}>{formatFullDate(next)}</span>
        </span>
      </div>

      <div className={styles.heroRight}>
        <motion.span
          className={styles.heroChip}
          initial={reduced ? undefined : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.4, ease: "easeOut" }}
        >
          {countdownLabel(days)}
        </motion.span>
      </div>
    </div>
  );
}
