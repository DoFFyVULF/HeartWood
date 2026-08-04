// Данные страницы «Календарь» (/events) — единый источник правды для дат пары.
//
// Календарь — самый «социальный» хаб: здесь живут годовщины (повторяются
// каждый год), предстоящие свидания (одноразовые даты впереди) и важные
// даты-вехи из истории пары. Три типа закрывают три вопроса:
//   «что мы отмечаем каждый год» — anniversary (recurring),
//   «куда идём в ближайшее время» — date,
//   «что уже случилось и осталось в сердце» — milestone.
//
// Все даты — ISO (YYYY-MM-DD). Годовщины хранят «образец» дня (месяц/число),
// а следующее вхождение считается на клиенте относительно «сегодня» — поэтому
// чисто датные функции живут здесь, а количество дней до события — в хуке.
// Seed-события иммутабельны; пользовательские добавляются в localStorage
// (см. features/world/events/useEvents.ts).

/** Тип события — определяет иконку, поведение даты и раздел страницы. */
export type EventKind = "date" | "anniversary" | "milestone";

/** Кто добавил событие (для пользовательских) — id участника из coupleProfile. */
export type AuthorId = "dima" | "anya";

/** Русские имена участников — для подписей «Зовёт Дима» / «Добавила Аня». */
export const AUTHOR_NAMES: Record<AuthorId, string> = {
  dima: "Дима",
  anya: "Аня",
};

export interface CoupleEvent {
  /** Стабильный id; у seeds — строки вида "seed-…". */
  id: string;
  kind: EventKind;
  title: string;
  description?: string;
  /**
   * ISO-дата (YYYY-MM-DD). Для годовщин — «образец» дня: повторяется ежегодно,
   * следующее вхождение считается через nextOccurrence.
   */
  date: string;
  /** Годовщина повторяется каждый год. У date/milestone — false. */
  recurring?: boolean;
  /** Для свиданий — кто зовёт («Зовёт Дима»). */
  invitedBy?: AuthorId;
  /** Для пользовательских — кто добавил («Добавила Аня»). */
  createdBy?: AuthorId;
}

/** Календарь пары из коробки. Даты — вокруг «сегодня» (август 2026). */
export const seedEvents: CoupleEvent[] = [
  // ── Предстоящие свидания (одноразовые, впереди) ──────────────────
  {
    id: "seed-roof-cinema",
    kind: "date",
    title: "Кино на крыше",
    description: "Летний кинотеатр под открытым небом — плед, «Амели» и звёзды.",
    date: "2026-08-15",
    invitedBy: "dima",
  },
  {
    id: "seed-picnic",
    kind: "date",
    title: "Пикник у реки",
    description: "Вафли, плед и солнце наперегонки — наша скамейка ждёт.",
    date: "2026-08-23",
    invitedBy: "anya",
  },
  {
    id: "seed-rain-dance",
    kind: "date",
    title: "Танцы под дождём",
    description: "Секретная поляна и старый плеер Димы — если пойдёт ливень.",
    date: "2026-09-05",
    invitedBy: "dima",
  },
  // ── Годовщины (повторяются каждый год) ───────────────────────────
  {
    id: "seed-anniversary-couple",
    kind: "anniversary",
    title: "День, когда мы стали парой",
    description: "14 февраля — наша история началась с кофейни «Ветка».",
    date: "2024-02-14",
    recurring: true,
  },
  {
    id: "seed-anniversary-first",
    kind: "anniversary",
    title: "Годовщина первого свидания",
    description: "Ровно год после разговоров до утра и первого «давай повторим?».",
    date: "2023-02-14",
    recurring: true,
  },
  // ── Важные даты (вехи из истории) ────────────────────────────────
  {
    id: "seed-first-kiss",
    kind: "milestone",
    title: "Первый поцелуй",
    description: "На набережной, на полпути от нашей скамейки, под фонарём.",
    date: "2024-02-28",
  },
  {
    id: "seed-first-love",
    kind: "milestone",
    title: "Первое «люблю»",
    description: "Сказалось само, когда заваривали чай и никто не смотрел.",
    date: "2024-04-12",
  },
  {
    id: "seed-move-in",
    kind: "milestone",
    title: "Переехали вместе",
    description: "Две коробки книг и одна очень большая коробка пледов.",
    date: "2025-01-18",
  },
];

/* ─── Чистые функции дат (SSR-safe: не читают «сейчас» сами) ─────── */

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
export function nextDate(event: CoupleEvent, today: Date): Date {
  if (event.recurring) return nextOccurrence(event.date, today);
  return parseISO(event.date);
}

/**
 * Целых дней от «сегодня» до цели (0 — сегодня, 1 — завтра, и т.д.).
 * Считает полночь-к-полуночи: цель и «сегодня» сводятся к началу своих дней,
 * поэтому разность кратна суткам и не ловит «полуденный» сдвиг целей
 * (иначе событие «завтра» показывалось бы как «через 2 дня»).
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
  events: CoupleEvent[],
  y: number,
  m: number,
): Map<number, CoupleEvent[]> {
  const map = new Map<number, CoupleEvent[]>();
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
  events: CoupleEvent[],
  iso: string,
): Array<{ event: CoupleEvent; years?: number }> {
  const sel = parseISO(iso);
  const out: Array<{ event: CoupleEvent; years?: number }> = [];
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
  event: CoupleEvent;
  /** Дата следующего вхождения (для годовщин — в этом или следующем году). */
  date: Date;
  /** Целых дней до даты (0 — сегодня). */
  days: number;
}

/**
 * Ближайшие будущие вхождения: свидания и годовщины (вехи — отдельно, в панели).
 * Считается обёрткой над nextDate/daysUntil — полночь-к-полуночи, без сдвига.
 */
export function upcomingOccurrences(events: CoupleEvent[], now: Date): UpcomingOccurrence[] {
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
