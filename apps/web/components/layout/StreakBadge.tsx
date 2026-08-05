"use client";

import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useWorld } from "@/lib/api-data";
import styles from "./StreakBadge.module.css";

/** Милестоуны серии, к которым подводит прогресс-бар в поповере. */
const MILESTONES = [30, 60, 100, 180, 365, 500];

/** Сколько последних дней показываем в сетке-календаре (7×7). */
const WINDOW_DAYS = 49;

/** Склонение: 1 день / 2 дня / 5 дней. */
function pluralDays(n: number) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return `${n} день`;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return `${n} дня`;
  return `${n} дней`;
}

/**
 * Интерактивный бейдж серии в хедере.
 *
 * Кнопка 🔥 + счётчик: число набегает с нуля при загрузке (count-up), а по
 * клику открывается поповер-календарь последних дней серии — сетка «всё
 * подряд» и прогресс к следующему милестоуну. Данные берутся из
 * worldStatus.streak; когда мир станет реактивным, бейдж сам переиграет
 * анимацию при изменении значения.
 */
export function StreakBadge({ className }: { className?: string }) {
  const { data: world } = useWorld();
  const streak = world?.streak ?? 0;
  const couple = world?.couple ?? "";
  const reduced = useReducedMotion();

  // ── Count-up ─────────────────────────────────────────────
  const [count, setCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    // Для reduced-motion просто доезжаем до значения без анимации
    // (длительность ~0), но всё через колбэки animate — без синхронного
    // setState в теле эффекта.
    const controls = animate(0, streak, {
      duration: reduced ? 0.001 : 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setCount(Math.round(v)),
      onComplete: () => setFinished(true),
    });
    return () => controls.stop();
  }, [reduced, streak]);

  // ── Поповер ──────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const popoverId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  // Дата старта серии — считаем только на клиенте (SSR-safe,
  // чтобы сервер и гидрация не расходились по дате «сегодня»).
  const [startLabel, setStartLabel] = useState<string | null>(null);

  // Якорь календарной сетки: реальные дни недели колонок и число «сегодня».
  // Тоже клиентский расчёт после первого кадра — сетка всегда совпадает
  // с настоящим календарём, а не просто «7×7 квадратов».
  const [weekdayHeads, setWeekdayHeads] = useState<string[]>(["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]);
  const [todayDayOfMonth, setTodayDayOfMonth] = useState<number | null>(null);
  // Полная дата «сегодня» для легенды («сегодня · 2 августа»). Считается на
  // клиенте после первого кадра — тот же SSR-safe паттерн, что и startLabel.
  const [todayLabel, setTodayLabel] = useState<string | null>(null);
  useEffect(() => {
    // Дата старта считается только на клиенте, после первого кадра —
    // это и SSR-safe (сервер и гидрация видят одинаковый null),
    // и не вызывает синхронный setState в теле эффекта.
    const id = requestAnimationFrame(() => {
      const d = new Date();
      d.setDate(d.getDate() - (streak - 1));
      setStartLabel(d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }));
    });
    return () => cancelAnimationFrame(id);
  }, [streak]);

  // Реальные дни недели колонок сетки. «Сегодня» — правый нижний угол,
  // значит колонка c (0..6) отстоит на (6 - c) дней назад.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const d = new Date();
      const order = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
      const heads = Array.from({ length: 7 }, (_, c) => order[(d.getDay() - (6 - c) + 7) % 7]);
      setWeekdayHeads(heads);
      setTodayDayOfMonth(d.getDate());
      setTodayLabel(d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Закрытие по клику вне бейджа и по Esc.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Прогресс к следующему милестоуну.
  const nextMilestone = MILESTONES.find((m) => m > streak);
  const prevMilestone = nextMilestone ? MILESTONES[MILESTONES.indexOf(nextMilestone) - 1] ?? 0 : 0;
  const remaining = nextMilestone ? nextMilestone - streak : null;
  const progress = nextMilestone
    ? Math.min(1, (streak - prevMilestone) / (nextMilestone - prevMilestone))
    : 1;

  // Сетка последних дней: старые слева-сверху, сегодня — в правом нижнем углу.
  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => {
    const daysAgo = WINDOW_DAYS - 1 - i;
    return { id: i, daysAgo, done: daysAgo < streak, today: daysAgo === 0 };
  });

  // Подпись, которая объясняет, что означают квадраты в сетке.
  const calCaption =
    streak >= WINDOW_DAYS
      ? "Каждый день · последние 7 недель"
      : startLabel
        ? `Без пропусков с ${startLabel}`
        : "Без пропусков";

  return (
    <div ref={rootRef} className={cn(styles.root, className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={popoverId}
        aria-label={`${streak} дней подряд — открыть статистику серии`}
        title={`${streak} дней подряд`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-2xl bg-white/70 px-3 py-2 shadow-xl shadow-black/5 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)",
          styles.streak,
          finished && styles.streakDone
        )}
      >
        <span aria-hidden className={styles.ember}>
          🔥
        </span>
        <span aria-hidden className={styles.streakCount}>
          {count}
        </span>
        <span className="sr-only">{streak} дней подряд</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="streak-popover"
            id={popoverId}
            role="dialog"
            aria-label={`Серия ${couple}: ${streak} дней подряд`}
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={styles.popover}
          >
            <header className={styles.popHeader}>
              <span aria-hidden className={styles.popFlame}>
                🔥
              </span>
              <div>
                <p className={styles.popTitle}>{pluralDays(streak)} подряд</p>
                <p className={styles.popSub}>{couple} · серия не прерывается</p>
              </div>
            </header>

            <div className={styles.popDivider} aria-hidden />

            {/* Дни недели колонок — сетка привязана к реальному календарю */}
            <div className={styles.calendarHead} aria-hidden>
              {weekdayHeads.map((head, c) => (
                <span key={c} className={styles.calendarHeadCell}>
                  {head}
                </span>
              ))}
            </div>

            <div
              className={styles.calendar}
              role="img"
              aria-label={`Последние ${WINDOW_DAYS} дней серии, каждый день подряд`}
            >
              {days.map((day) => (
                <span
                  key={day.id}
                  aria-hidden
                  className={cn(
                    styles.cell,
                    day.done && styles.cellDone,
                    day.today && styles.cellToday,
                    // Более старые недели приглушаем — «свежее» читается ярче.
                    day.done && !day.today && day.daysAgo >= 7 && styles.cellPast
                  )}
                >
                  {day.today && todayDayOfMonth !== null && (
                    <span className={styles.todayNum}>{todayDayOfMonth}</span>
                  )}
                </span>
              ))}
            </div>

            {/* Легенда: что значат квадраты и кольцо. Декоративные образцы
                скрыты от скринридера, текст читается нормально. */}
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span aria-hidden className={cn(styles.legendSwatch, styles.legendSwatchDone)} />
                день серии
              </span>
              <span className={styles.legendItem}>
                <span aria-hidden className={cn(styles.legendSwatch, styles.legendSwatchToday)} />
                сегодня{todayLabel ? ` · ${todayLabel}` : ""}
              </span>
            </div>

            <p className={styles.calCaption}>{calCaption}</p>

            <footer className={styles.popFooter}>
              <div className={styles.popMeta}>
                <span>{startLabel ? `Старт серии · ${startLabel}` : "Трекинг серии"}</span>
                {remaining !== null && <span>до {nextMilestone}</span>}
              </div>
              <div className={styles.progressTrack} aria-hidden>
                <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
