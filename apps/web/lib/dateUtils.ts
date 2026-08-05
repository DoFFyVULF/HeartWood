// Чистые функции дат для календаря — SSR-safe: не читают «сейчас» сами.
// Вынесены из lib/data/events.ts: это утилиты, а не seed-данные, поэтому
// пережили удаление статики. Тип события живёт в lib/types.ts (EventView).

import type { EventView } from "@/lib/types";

/** ISO → Date в полдень, чтобы сдвиг таймзоны не уводил день назад. */
export function parseISO(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

/** Полночь «сегодня» — точка отсчёта для сравнения дат. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Следующее вхождение годовщины (рекуррентной даты): тот же месяц/число,
 * что в «образце», но в этом году — или в следующем, если уже прошло.
 * Полдень, чтобы сравнение с полночью «сегодня» не ловило DST-артефакты.
 */
export function nextOccurrence(iso: string, today: Date): Date {
  const base = parseISO(iso);
  const candidate = new Date(today.getFullYear(), base.getMonth(), base.getDate(), 12);
  return candidate >= startOfDay(today)
    ? candidate
    : new Date(today.getFullYear() + 1, base.getMonth(), base.getDate(), 12);
}

/**
 * Ближайшая дата события: для годовщины — следующее вхождение в этом или
 * следующем году; для одноразовых — сама дата (даже если уже прошла).
 */
export function nextDate(event: EventView, today: Date): Date {
  if (event.recurring) return nextOccurrence(event.date, today);
  return parseISO(event.date);
}

/**
 * Целых дней от «сегодня» до цели (0 — сегодня, 1 — завтра, и т.д.).
 * Считает полночь-к-полуночи: цель и «сегодня» сводятся к началу своих дней,
 * поэтому разность кратна суткам и не ловит «полуденный» сдвиг целей.
 */
export function daysUntil(target: Date, today: Date): number {
  const from = startOfDay(today).getTime();
  const to = startOfDay(target).getTime();
  return Math.round((to - from) / 86_400_000);
}

/** Сколько полных лет прошло с даты (для вех «N лет назад»). */
export function yearsSince(iso: string, today: Date): number {
  const base = parseISO(iso);
  return today.getFullYear() - base.getFullYear();
}

/** Русское склонение: 1 день, 2 дня, 5 дней. */
export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

/** Подпись «сколько осталось»: сегодня / завтра / через N дней. */
export function countdownLabel(days: number): string {
  if (days <= 0) return "сегодня";
  if (days === 1) return "завтра";
  return `через ${days} ${pluralRu(days, "день", "дня", "дней")}`;
}

/* ─── Сетка месяца и сводки (SSR-safe: «сейчас» приходит параметром) ───── */

/** Дата → ISO (YYYY-MM-DD) — как хранит календарь. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Один ли день (без времени) — сравнение по году/месяцу/числу, без DST-артефактов. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Сколько дней в месяце (m — индекс 0..11). */
export function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

/**
 * Сетка календаря: 42 ячейки от Пн=0, включая хвосты соседних месяцев.
 * Детерминирована по паре (y, m) — безопасна для SSR и гидрации.
 */
export function buildMonthGrid(y: number, m: number): Date[] {
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7; // Пн = 0
  return Array.from({ length: 42 }, (_, i) => new Date(y, m, 1 - offset + i));
}

/**
 * События в просматриваемом месяце: день месяца → список событий.
 * Вехи (milestone) на сетку не попадают — они живут в панели «Важные даты».
 * Годовщины повторяются каждый год по месяцу/числу, поэтому показываются
 * в любом году.
 */
export function occurrencesInMonth(
  events: EventView[],
  y: number,
  m: number,
): Map<number, EventView[]> {
  const map = new Map<number, EventView[]>();
  const dim = daysInMonth(y, m);
  for (const ev of events) {
    if (ev.kind === "milestone") continue;
    const base = parseISO(ev.date);
    const day = ev.recurring
      ? base.getMonth() === m
        ? Math.min(base.getDate(), dim)
        : null
      : base.getFullYear() === y && base.getMonth() === m
        ? base.getDate()
        : null;
    if (day === null) continue;
    const list = map.get(day) ?? [];
    list.push(ev);
    map.set(day, list);
  }
  return map;
}

/** События, попадающие на конкретный день (ISO). Для годовщин — N-я годовщина. */
export function eventsOnDate(
  events: EventView[],
  iso: string,
): Array<{ event: EventView; years?: number }> {
  const sel = parseISO(iso);
  const out: Array<{ event: EventView; years?: number }> = [];
  for (const ev of events) {
    const base = parseISO(ev.date);
    if (ev.recurring) {
      if (base.getMonth() === sel.getMonth() && base.getDate() === sel.getDate()) {
        out.push({
          event: ev,
          years: Math.max(sel.getFullYear() - base.getFullYear(), 0),
        });
      }
    } else if (ev.date === iso) {
      out.push({ event: ev });
    }
  }
  return out;
}

export interface UpcomingOccurrence {
  event: EventView;
  /** Дата следующего вхождения (для годовщин — в этом или следующем году). */
  date: Date;
  /** Целых дней до даты (0 — сегодня). */
  days: number;
}

/**
 * Ближайшие будущие вхождения: свидания и годовщины (вехи — отдельно, в панели).
 * Считается обёрткой над nextDate/daysUntil — полночь-к-полуночи, без сдвига.
 */
export function upcomingOccurrences(events: EventView[], now: Date): UpcomingOccurrence[] {
  const today = startOfDay(now);
  return events
    .filter((e) => e.kind !== "milestone")
    .map((e) => ({ event: e, date: nextDate(e, now) }))
    .filter(({ date }) => date >= today)
    .map(({ event, date }) => ({ event, date, days: daysUntil(date, now) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/* ─── Форматирование (ru-RU, стабильно между Node и браузером) ─────────── */

/** День для календарного квадратика: «15». */
export function formatDayNumber(d: Date): string {
  return d.toLocaleDateString("ru-RU", { day: "numeric" });
}

/** Месяц для квадратика: «авг». */
export function formatMonthShort(d: Date): string {
  return d.toLocaleDateString("ru-RU", { month: "short" }).replace(/\.$/, "");
}

/** Полная дата: «15 августа 2026 г.» */
export function formatFullDate(d: Date): string {
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Заголовок месяца в сетке: «Август 2026». */
export function formatMonthYear(d: Date): string {
  const month = d.toLocaleDateString("ru-RU", { month: "long" });
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${d.getFullYear()}`;
}
