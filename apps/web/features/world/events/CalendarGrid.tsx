"use client";

// Месяц-сетка календаря: 42 ячейки (Пн=0), навигация по месяцам и кнопка
// «Сегодня». Ячейки — кнопки: клик выбирает день, на днях с событиями —
// мини-иконки типов. Всё из токенов темы (--hwd-*), перекрашивается по
// data-gender, как остальная страница.
//
// Вид месяца хранится как null = «следуй за now»: пока клиент не знает
// реальную дату (SSR/первый кадр), рисуется месяц fallback-даты, затем он
// сам подхватывает «сегодня» без прыжков и эффектов. Явный prev/next
// закрепляет конкретный месяц; «Сегодня» возвращает к now.

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  buildMonthGrid,
  formatDayNumber,
  formatFullDate,
  formatMonthYear,
  isSameDay,
  occurrencesInMonth,
  toISODate,
  type CoupleEvent,
} from "@/lib/data/events";
import { ChevronLeftIcon, ChevronRightIcon, KIND_ICON } from "./icons";
import styles from "./CalendarGrid.module.css";

/** Дни недели — хардкод, чтобы избежать расхождений ICU между Node и браузером. */
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

/** Пара (год, месяц) на шаг delta вперёд/назад. */
function shiftMonth(view: { y: number; m: number }, delta: number): { y: number; m: number } {
  const d = new Date(view.y, view.m + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
}

interface CalendarGridProps {
  events: CoupleEvent[];
  /** «сейчас» — уже разрешённая клиентская дата (fallback до гидрации). */
  now: Date;
  /** Выбранный день (ISO) или null до клиентской гидрации. */
  selected: string | null;
  onSelect: (iso: string) => void;
}

export function CalendarGrid({ events, now, selected, onSelect }: CalendarGridProps) {
  const [view, setView] = useState<{ y: number; m: number } | null>(null);

  // null = следовать за «сегодня»; prev/next фиксируют месяц.
  const effectiveView = view ?? { y: now.getFullYear(), m: now.getMonth() };
  const todayIso = toISODate(now);

  const grid = useMemo(
    () => buildMonthGrid(effectiveView.y, effectiveView.m),
    [effectiveView.y, effectiveView.m],
  );
  const occurrences = useMemo(
    () => occurrencesInMonth(events, effectiveView.y, effectiveView.m),
    [events, effectiveView.y, effectiveView.m],
  );

  // Маркеры только для ячеек видимого месяца.
  const marksByIso = useMemo(() => {
    const map = new Map<string, CoupleEvent[]>();
    occurrences.forEach((list, day) => {
      map.set(
        toISODate(new Date(effectiveView.y, effectiveView.m, day)),
        list,
      );
    });
    return map;
  }, [occurrences, effectiveView.y, effectiveView.m]);

  const goToday = () => {
    setView(null);
    onSelect(todayIso);
  };

  return (
    <div className={styles.card} role="group" aria-label="Календарь месяца">
      {/* Заголовок месяца + навигация */}
      <div className={styles.head}>
        <h3 className={styles.title}>
          {formatMonthYear(new Date(effectiveView.y, effectiveView.m, 1))}
        </h3>
        <div className={styles.nav}>
          <button
            type="button"
            onClick={() => setView(shiftMonth(effectiveView, -1))}
            aria-label="Предыдущий месяц"
            className={styles.navBtn}
          >
            <ChevronLeftIcon className={styles.navIcon} />
          </button>
          <button
            type="button"
            onClick={() => setView(shiftMonth(effectiveView, 1))}
            aria-label="Следующий месяц"
            className={styles.navBtn}
          >
            <ChevronRightIcon className={styles.navIcon} />
          </button>
          <button type="button" onClick={goToday} className={styles.todayBtn}>
            Сегодня
          </button>
        </div>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            {WEEKDAYS.map((d) => (
              <th key={d} scope="col" className={styles.weekDay}>
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, row) => (
            <tr key={row}>
              {Array.from({ length: 7 }, (_, col) => {
                const cell = grid[row * 7 + col];
                const inMonth = cell.getMonth() === effectiveView.m;
                const cellIso = toISODate(cell);
                const isToday = inMonth && isSameDay(cell, now);
                const isSelected = selected === cellIso;
                const marks = inMonth ? (marksByIso.get(cellIso) ?? []) : [];
                const label = `${formatFullDate(cell)}${marks.length ? `, событий: ${marks.length}` : ""}`;

                return (
                  <td key={col} className={styles.cell}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(cellIso);
                        // Клик по хвосту соседнего месяца — перелистнуть к нему.
                        if (!inMonth) setView({ y: cell.getFullYear(), m: cell.getMonth() });
                      }}
                      className={cn(
                        styles.cellBtn,
                        !inMonth && styles.cellOut,
                        isToday && styles.cellToday,
                        isSelected && styles.cellSelected,
                      )}
                      aria-label={label}
                      aria-pressed={isSelected}
                      aria-current={isToday ? "date" : undefined}
                    >
                      <span className={styles.dayNum}>{formatDayNumber(cell)}</span>
                      {marks.length > 0 && (
                        <span className={styles.marks} aria-hidden>
                          {marks.slice(0, 2).map((ev) => {
                            const Icon = KIND_ICON[ev.kind];
                            return <Icon key={ev.id} className={styles.mark} />;
                          })}
                          {marks.length > 2 && (
                            <span className={styles.markMore}>+{marks.length - 2}</span>
                          )}
                        </span>
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
