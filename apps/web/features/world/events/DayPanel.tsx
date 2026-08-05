"use client";

// Боковая панель календаря: три стеклянных панели — «Выбранный день»,
// «Ближайшее» (следующие свидания и годовщины) и «Важные даты» (вехи).
// Тот же дизайн-язык, что и сетка: волосяные рамки, медальоны типов,
// одна мягкая тень, всё из токенов темы (--hwd-*).

import {
  countdownLabel,
  eventsOnDate,
  formatFullDate,
  parseISO,
  pluralRu,
  yearsSince,
  type UpcomingOccurrence,
} from "@/lib/dateUtils";
import type { EventView } from "@/lib/types";
import { CalendarIcon, KIND_ICON, PlusIcon, StarIcon, TrashIcon } from "./icons";
import styles from "./DayPanel.module.css";

interface DayPanelProps {
  events: EventView[];
  /** «сейчас» — разрешённая клиентская дата. */
  now: Date;
  /** Выбранный день (ISO) или null до клиентской гидрации. */
  selected: string | null;
  /** Результат upcomingOccurrences(events, now) — разделяется с героем. */
  upcoming: UpcomingOccurrence[];
  /** Добавить дату на выбранный день. */
  onAddDate: (iso: string) => void;
  onRemove: (event: EventView) => void;
}

export function DayPanel({ events, now, selected, upcoming, onAddDate, onRemove }: DayPanelProps) {
  const dayEvents = selected ? eventsOnDate(events, selected) : [];

  return (
    <aside className={styles.aside} aria-label="Панель календаря">
      {/* Выбранный день */}
      <section className={styles.panel} aria-label="Выбранный день">
        <h3 className={styles.panelTitle}>Выбранный день</h3>

        {!selected ? (
          <div className={styles.empty}>
            <CalendarIcon className={styles.emptyIcon} />
            <p className={styles.emptyText}>Выберите день в календаре</p>
          </div>
        ) : (
          <div className={styles.day}>
            <p className={styles.dayDate}>{formatFullDate(parseISO(selected))}</p>

            {dayEvents.length === 0 ? (
              <p className={styles.dayEmpty}>В этот день пока ничего нет</p>
            ) : (
              <ul className={styles.list}>
                {dayEvents.map(({ event, years }) => {
                  const Icon = KIND_ICON[event.kind];
                  const subtitle =
                    event.kind === "anniversary" && years
                      ? `${years} ${pluralRu(years, "год", "года", "лет")} вместе`
                      : event.kind === "anniversary"
                        ? "Годовщина"
                        : event.createdBy
                          ? `Добавил${event.createdBy.name.endsWith("а") ? "а" : ""} ${event.createdBy.name}`
                          : null;
                  return (
                    <li key={event.id} className={styles.row}>
                      <span className={styles.medallion} aria-hidden>
                        <Icon className={styles.medallionIcon} />
                      </span>
                      <span className={styles.rowBody}>
                        <span className={styles.rowTitle}>{event.title}</span>
                        {subtitle && <span className={styles.rowSub}>{subtitle}</span>}
                      </span>
                      {event.createdBy && (
                        <button
                          type="button"
                          onClick={() => onRemove(event)}
                          aria-label={`Удалить дату «${event.title}»`}
                          className={styles.trash}
                        >
                          <TrashIcon className={styles.trashIcon} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              type="button"
              onClick={() => onAddDate(selected)}
              className={styles.dayAddBtn}
            >
              <PlusIcon className={styles.dayAddIcon} />
              Добавить дату на этот день
            </button>
          </div>
        )}
      </section>

      {/* Ближайшее */}
      <section className={styles.panel} aria-label="Ближайшее">
        <h3 className={styles.panelTitle}>Ближайшее</h3>
        {upcoming.length === 0 ? (
          <div className={styles.empty}>
            <CalendarIcon className={styles.emptyIcon} />
            <p className={styles.emptyText}>Ближайших событий нет</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {upcoming.slice(0, 4).map(({ event, days }) => {
              const Icon = KIND_ICON[event.kind];
              return (
                <li key={event.id} className={styles.upRow}>
                  <span className={styles.medallion} aria-hidden>
                    <Icon className={styles.medallionIcon} />
                  </span>
                  <span className={styles.upBody}>
                    <span className={styles.upTitle}>{event.title}</span>
                    <span className={styles.chip}>{countdownLabel(days)}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Важные даты */}
      <section className={styles.panel} aria-label="Важные даты">
        <h3 className={styles.panelTitle}>Важные даты</h3>
        {milestones(events).length === 0 ? (
          <div className={styles.empty}>
            <StarIcon className={styles.emptyIcon} />
            <p className={styles.emptyText}>Пока нет важных дат</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {milestones(events).map((event) => {
              const years = yearsSince(event.date, now);
              return (
                <li key={event.id} className={styles.milRow}>
                  <span className={styles.medallion} aria-hidden>
                    <StarIcon className={styles.medallionIcon} />
                  </span>
                  <span className={styles.milBody}>
                    <span className={styles.milTitle}>{event.title}</span>
                    <span className={styles.milAgo}>
                      {years === 0
                        ? "В этом году"
                        : `${years} ${pluralRu(years, "год", "года", "лет")} назад`}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </aside>
  );
}

/** Вехи из истории — по убыванию даты. */
function milestones(events: EventView[]): EventView[] {
  return events
    .filter((e) => e.kind === "milestone")
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
}
