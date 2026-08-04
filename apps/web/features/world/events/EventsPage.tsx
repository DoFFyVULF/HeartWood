"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useGender } from "@/lib/theme";
import { findPersonByGender } from "@/features/world/profile/couple";
import {
  type CoupleEvent,
  type EventKind,
  daysUntil,
  nextDate,
  pluralRu,
  startOfDay,
  yearsSince,
  countdownLabel,
} from "@/lib/data/events";
import { useEvents, toAuthorId, type NewEventInput } from "./useEvents";
import { EventComposer } from "./EventComposer";
import { CalendarIcon, HeartIcon, PlusIcon, StarIcon, TicketIcon, TrashIcon } from "./icons";
import styles from "./EventsPage.module.css";

// Стаггер на первичный вход — события всплывают каскадом снизу.
const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 26, scale: 0.96 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", bounce: 0.32, duration: 0.6 } as const,
  },
};

/** Иконка типа события. */
const KIND_ICON: Record<EventKind, (props: { className?: string }) => React.ReactElement> = {
  date: TicketIcon,
  anniversary: HeartIcon,
  milestone: StarIcon,
};

/** Русские имена участников — для подписей «Зовёт Дима» / «Добавила Аня». */
const PERSON_NAME: Record<string, string> = {
  dima: "Дима",
  anya: "Аня",
};

/** День для календарного квадратика: «15». */
function dayNum(d: Date): string {
  return d.toLocaleDateString("ru-RU", { day: "numeric" });
}

/** Месяц для календарного квадратика: «авг.». */
function monthShort(d: Date): string {
  return d.toLocaleDateString("ru-RU", { month: "short" }).replace(/\.$/, "");
}

/** Полная дата: «15 августа 2026 г.» */
function fullDate(d: Date): string {
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Страница «Календарь» — самый социальный хаб пары.
 *
 * Здесь собраны три взгляда на даты: герой «следующее событие» с обратным
 * отсчётом, раздел предстоящих свиданий, годовщины (повторяются каждый год)
 * и важные даты-вехи из истории. Календарь живой: «сегодня» вычисляется на
 * клиенте, поэтому отсчёт дней всегда актуален, а добавленные даты сразу
 * попадают в нужный раздел и считаются в сводке.
 *
 * Карточки — «стекло»: чистые поверхности, волосяные рамки, одна мягкая
 * тень. Вся гамма — из токенов темы (--hwd-*), перекрашивается по гендеру.
 */
export function EventsPage() {
  const reduced = useReducedMotion();
  const { gender } = useGender();

  const me = findPersonByGender(gender);
  const { events, create, remove } = useEvents();

  const [today, setToday] = useState<Date | null>(null);
  const [composing, setComposing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // «Сегодня» известно только на клиенте. До первого кадра используем
  // фиксированную дату (SSR-гидрация совпадает), затем — реальную.
  useEffect(() => {
    const t = requestAnimationFrame(() => setToday(new Date()));
    return () => cancelAnimationFrame(t);
  }, []);

  // SSR-fallback: дата вокруг seed-событий, чтобы сортировка не менялась.
  // useMemo — чтобы ссылка на Date была стабильной между рендерами.
  const now = useMemo(() => today ?? new Date(2026, 7, 4), [today]);

  // Событие с ближайшей датой — герой «следующее».
  const nextUp = useMemo(() => {
    return events
      .filter((e) => e.kind !== "milestone")
      .map((e) => ({ e, next: nextDate(e, now) }))
      .filter(({ next }) => next >= startOfDay(now))
      .sort((a, b) => a.next.getTime() - b.next.getTime())[0] ?? null;
  }, [events, now]);

  // Разделы: свидания впереди / годовщины / важные даты.
  const sections = useMemo(() => {
    const upcoming = events
      .map((e) => ({ e, next: nextDate(e, now) }))
      .filter(({ e, next }) => e.kind === "date" && next >= startOfDay(now))
      .sort((a, b) => a.next.getTime() - b.next.getTime());

    const anniversaries = events
      .filter((e) => e.kind === "anniversary")
      .map((e) => ({ e, next: nextDate(e, now) }))
      .sort((a, b) => a.next.getTime() - b.next.getTime());

    const milestones = events
      .filter((e) => e.kind === "milestone")
      .map((e) => ({ e, next: parseLocalDate(e.date) }))
      .sort((a, b) => b.next.getTime() - a.next.getTime());

    return { upcoming, anniversaries, milestones };
  }, [events, now]);

  const upcomingCount = sections.upcoming.length;
  const anniversaryCount = sections.anniversaries.length;
  const milestoneCount = sections.milestones.length;

  /** Добавляет событие и закрывает композер. */
  const handleCreate = useCallback(
    (input: NewEventInput): boolean => {
      const author = toAuthorId(me.id) ?? "dima";
      const id = create(input, author);
      if (!id) return false;
      setComposing(false);
      setNotice(`Дата «${input.title}» в календаре`);
      return true;
    },
    [create, me.id],
  );

  const handleRemove = useCallback(
    (event: CoupleEvent) => {
      remove(event.id);
      setNotice(`Дата «${event.title}» удалена`);
    },
    [remove],
  );

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
      {nextUp && <NextHero event={nextUp.e} next={nextUp.next} now={now} />}

      {/* Кнопка новой даты */}
      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={() => setComposing(true)}
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

      {/* Свидания впереди */}
      {sections.upcoming.length > 0 && (
        <Section
          title="Свидания впереди"
          count={sections.upcoming.length}
          plural={(n) => pluralRu(n, "свидание", "свидания", "свиданий")}
        >
          <motion.ul
            className={styles.grid}
            variants={gridVariants}
            initial={reduced ? false : "hidden"}
            animate="show"
            aria-label="Предстоящие свидания"
          >
            {sections.upcoming.map(({ e, next }) => (
              <motion.li key={e.id} layout variants={itemVariants} className={styles.gridItem}>
                <EventCard
                  event={e}
                  next={next}
                  now={now}
                  onRemove={() => handleRemove(e)}
                />
              </motion.li>
            ))}
          </motion.ul>
        </Section>
      )}

      {/* Годовщины */}
      {sections.anniversaries.length > 0 && (
        <Section
          title="Годовщины"
          count={sections.anniversaries.length}
          plural={(n) => pluralRu(n, "годовщина", "годовщины", "годовщин")}
        >
          <motion.ul
            className={styles.grid}
            variants={gridVariants}
            initial={reduced ? false : "hidden"}
            animate="show"
            aria-label="Годовщины пары"
          >
            {sections.anniversaries.map(({ e, next }) => (
              <motion.li key={e.id} layout variants={itemVariants} className={styles.gridItem}>
                <EventCard
                  event={e}
                  next={next}
                  now={now}
                  onRemove={() => handleRemove(e)}
                />
              </motion.li>
            ))}
          </motion.ul>
        </Section>
      )}

      {/* Важные даты */}
      {sections.milestones.length > 0 && (
        <Section
          title="Важные даты"
          count={sections.milestones.length}
          plural={(n) => pluralRu(n, "дата", "даты", "дат")}
        >
          <motion.ul
            className={styles.grid}
            variants={gridVariants}
            initial={reduced ? false : "hidden"}
            animate="show"
            aria-label="Важные даты пары"
          >
            {sections.milestones.map(({ e, next }) => (
              <motion.li key={e.id} layout variants={itemVariants} className={styles.gridItem}>
                <EventCard
                  event={e}
                  next={next}
                  now={now}
                  milestone
                  onRemove={() => handleRemove(e)}
                />
              </motion.li>
            ))}
          </motion.ul>
        </Section>
      )}

      {events.length === 0 && (
        <p className={styles.footnote}>
          Пока календарь пуст — добавьте первую важную дату
        </p>
      )}

      <p className={styles.footnote}>
        Годовщины повторяются каждый год — календарь всегда помнит о важном
      </p>

      {/* Добавление даты */}
      {composing && (
        <EventComposer onCreate={handleCreate} onClose={() => setComposing(false)} />
      )}
    </div>
  );
}

/** Раздел с заголовком и счётчиком. */
function Section({
  title,
  count,
  plural,
  children,
}: {
  title: string;
  count: number;
  plural: (n: number) => string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section} aria-label={title}>
      <h2 className={styles.sectionTitle}>
        {title}
        <span className={styles.sectionCount}>
          {count} {plural(count)}
        </span>
      </h2>
      {children}
    </section>
  );
}

/** Герой: ближайшее событие с крупным отсчётом. */
function NextHero({
  event,
  next,
  now,
}: {
  event: CoupleEvent;
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
            <strong className={styles.heroDay}>{dayNum(next)}</strong>
            <small className={styles.heroMonth}>{monthShort(next)}</small>
          </span>
          <span className={styles.heroDate}>{fullDate(next)}</span>
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

/** Карточка события: квадратик даты, название, описание, подпись. */
function EventCard({
  event,
  next,
  now,
  milestone = false,
  onRemove,
}: {
  event: CoupleEvent;
  next: Date;
  now: Date;
  milestone?: boolean;
  onRemove: () => void;
}) {
  const Icon = KIND_ICON[event.kind] ?? CalendarIcon;
  const days = milestone ? null : daysUntil(next, now);

  // Подпись «кто»: для свиданий — кто зовёт, для созданных — кто добавил.
  const who = event.kind === "date" && event.invitedBy
    ? `Зовёт ${PERSON_NAME[event.invitedBy] ?? event.invitedBy}`
    : event.createdBy
      ? `Добавил${event.createdBy === "anya" ? "а" : ""} ${PERSON_NAME[event.createdBy] ?? event.createdBy}`
      : null;

  return (
    <article
      className={styles.card}
      aria-label={`${event.title}, ${fullDate(next)}`}
    >
      {/* Квадратик даты */}
      <span className={cn(styles.cardSquare, milestone && styles.cardSquareMilestone)} aria-hidden>
        <strong className={styles.cardDay}>{dayNum(next)}</strong>
        <small className={styles.cardMonth}>{monthShort(next)}</small>
      </span>

      <span className={styles.cardBody}>
        <span className={styles.cardTop}>
          <span className={styles.cardMedallion} aria-hidden>
            <Icon className={styles.cardIcon} />
          </span>
          <span className={styles.cardBadge}>
            {milestone
              ? `${yearsSince(event.date, now)} ${pluralRu(yearsSince(event.date, now), "год", "года", "лет")} назад`
              : countdownLabel(days!)}
          </span>
        </span>

        <h3 className={styles.cardTitle}>{event.title}</h3>
        {event.description && <p className={styles.cardDesc}>{event.description}</p>}

        <span className={styles.cardFooter}>
          <span className={styles.cardDate}>{fullDate(next)}</span>
          {who && <span className={styles.cardWho}>{who}</span>}
        </span>
      </span>

      {event.id.startsWith("evt-") && (
        <button
          type="button"
          onClick={onRemove}
          className={styles.cardTrash}
          aria-label={`Удалить дату «${event.title}»`}
        >
          <TrashIcon className={styles.cardTrashIcon} />
        </button>
      )}
    </article>
  );
}

/** Полдень из ISO — для вех без смещения дня. */
function parseLocalDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}
