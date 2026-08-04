"use client";

import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { WorldTree } from "@/features/world/tree/WorldTree";
import { worldStatus } from "@/lib/data/worldStatus";
import { cn } from "@/lib/utils";
import styles from "./OrbitalStage.module.css";
import type {
  Season,
  TimeOfDay,
  Mood,
  HangingItem,
  HangingItemKind,
  TreeEvent,
  TreeEventType,
} from "@/features/world/tree/config/stages";

// ─── Стадии роста: имена и эмодзи для шкалы. Совпадают с STAGE_CONFIG нового дерева. ──
const STAGE_NAMES = [
  "Семечко",
  "Росток",
  "Саженец",
  "Молодое дерево",
  "Цветущее",
  "Могучее",
  "Древнее",
  "Мировое дерево",
];
const STAGE_EMOJI = ["🌰", "🌱", "🌿", "🪴", "🌸", "🌳", "🌲", "🌟"];

const MAX_LEVEL = 7;
/** Шаг кнопок теста: 20% пути к следующей стадии за клик. */
const STEP = 0.2;

type TreeLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const SEASONS: { value: Season; label: string }[] = [
  { value: "spring", label: "Весна" },
  { value: "summer", label: "Лето" },
  { value: "autumn", label: "Осень" },
  { value: "winter", label: "Зима" },
];

const TIMES: { value: TimeOfDay; label: string }[] = [
  { value: "dawn", label: "Рассвет" },
  { value: "day", label: "День" },
  { value: "dusk", label: "Закат" },
  { value: "night", label: "Ночь" },
];

const MOODS: { value: Mood; label: string }[] = [
  { value: null, label: "○ Нейтрально" },
  { value: "sun", label: "☀ Солнце" },
  { value: "rain", label: "🌧 Дождь" },
  { value: "storm", label: "⛈ Гроза" },
  { value: "rainbow", label: "🌈 Радуга" },
  { value: "moon", label: "🌙 Луна" },
];

const EVENT_BUTTONS: { type: TreeEventType; label: string; emoji: string }[] = [
  { type: "message", label: "Сообщение", emoji: "💬" },
  { type: "date", label: "Свидание", emoji: "📅" },
  { type: "coupon", label: "Купон", emoji: "🎫" },
  { type: "memory", label: "Воспоминание", emoji: "💌" },
  { type: "voice", label: "Голос", emoji: "🎙" },
  { type: "milestone", label: "Веха", emoji: "🎉" },
];

const ITEM_KINDS: { kind: HangingItemKind; label: string }[] = [
  { kind: "memory", label: "memory" },
  { kind: "surprise", label: "surprise" },
  { kind: "coupon", label: "coupon" },
  { kind: "date", label: "date" },
];

// Стартовый набор висящих элементов (как в демо workspace: memory@0, surprise@2,
// coupon@4, date@6 — якоря по индексам устойчивых веток дерева).
const INITIAL_ITEMS: HangingItem[] = [
  { id: "h1", kind: "memory", anchor: 0, payload: { label: "Первый поцелуй" } },
  { id: "h2", kind: "surprise", anchor: 2, payload: { label: "Сюрприз" } },
  { id: "h3", kind: "coupon", anchor: 4, payload: { label: "Кино" } },
  { id: "h4", kind: "date", anchor: 6, payload: { label: "Свид" } },
];

// ─── Шкала прогресса роста ────────────────────────────────────────────────────
function ProgressScale({ level, progress }: { level: number; progress: number }) {
  const overall = ((level + progress) / STAGE_NAMES.length) * 100;
  const toNext = Math.round(progress * 100);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-extrabold text-(--hwd-ink)">
          <span aria-hidden className="mr-1">
            {STAGE_EMOJI[level]}
          </span>
          {STAGE_NAMES[level]}
        </p>
        <p className="text-xs font-bold text-(--hwd-primary)">{toNext}% к следующей стадии</p>
      </div>

      {/* 8 сегментов — каждый сегмент одна стадия. Пройденные залиты, текущая частично. */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(overall)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Рост дерева: стадия ${level + 1} из ${STAGE_NAMES.length}`}
        className="mt-3 flex gap-1"
      >
        {STAGE_NAMES.map((name, i) => {
          const filled = i < level ? 100 : i === level ? progress * 100 : 0;
          return (
            <div
              key={name}
              title={name}
              className="relative h-2 flex-1 overflow-hidden rounded-full bg-black/5"
            >
              {filled > 0 && (
                <span
                  className={cn(styles.shimmer, "absolute inset-y-0 left-0 rounded-full")}
                  style={{ width: `${filled}%` }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-[0.7rem] font-bold text-(--hwd-ink-soft)">
        <span>🌰 Семечко</span>
        <span className="hidden sm:inline">
          этап {level + 1} из {STAGE_NAMES.length}
        </span>
        <span>Мировое дерево 🌟</span>
      </div>
    </div>
  );
}

// ─── Группа переключателей (сезон / время суток / настроение / уровень) ───────
function SegGroup<T extends string | number | null>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-bold transition active:scale-95",
            o.value === value
              ? "border-transparent bg-(--hwd-primary) text-white shadow-sm"
              : "border-white/70 bg-white/70 text-(--hwd-ink-soft) hover:bg-white hover:text-(--hwd-ink)",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Слайдер (прогресс / дни / streak) ────────────────────────────────────────
function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-xs font-bold text-(--hwd-ink-soft)">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full min-w-0 accent-(--hwd-primary)"
      />
      <span className="w-12 shrink-0 text-right text-sm font-extrabold text-(--hwd-ink)">
        {format ? format(value) : value}
      </span>
    </div>
  );
}

// ─── Кнопки теста роста: + расти, − уменьшать (стеклянные кружки в углу сцены) ─
function TestControls({ onGrow, onShrink }: { onGrow: () => void; onShrink: () => void }) {
  return (
    <div className="absolute right-4 top-4 z-10 flex gap-2">
      <button
        type="button"
        onClick={onShrink}
        aria-label="Уменьшить дерево"
        title="Уменьшить (тест)"
        className="flex size-9 items-center justify-center rounded-full border border-white/70 bg-white/70 text-base font-bold text-(--hwd-ink-soft) shadow-md backdrop-blur-md transition hover:bg-white hover:text-(--hwd-ink) active:scale-90"
      >
        −
      </button>
      <button
        type="button"
        onClick={onGrow}
        aria-label="Увеличить дерево"
        title="Увеличить (тест)"
        className="flex size-9 items-center justify-center rounded-full border border-white/70 bg-(--hwd-primary-soft) text-base font-bold text-(--hwd-primary) shadow-md backdrop-blur-md transition hover:bg-white active:scale-90"
      >
        +
      </button>
    </div>
  );
}

// ─── Секция тестовой панели с заголовком ──────────────────────────────────────
function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[0.65rem] font-extrabold uppercase tracking-wider text-(--hwd-ink-soft)">
        {title}
      </p>
      {children}
    </div>
  );
}

/**
 * Садовая сцена + тестовая панель. Дерево теперь — новое (из workspace), со всеми
 * пропсами: уровень/прогресс, сезон, время суток, настроение, дни, streak,
 * висящие элементы, события, reduced motion. Панель ниже даёт полный контроль
 * над каждым из них — для проверки дерева.
 */
export function TreeStage() {
  // ── Рост ───────────────────────────────────────────────────────────────────
  const [level, setLevel] = useState<number>(worldStatus.level);
  const [levelProgress, setLevelProgress] = useState<number>(worldStatus.levelProgress);

  // ── Сезон / время суток / настроение ──────────────────────────────────────
  const [season, setSeason] = useState<Season>("summer");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day");
  const [autoCycle, setAutoCycle] = useState(false);
  const [mood, setMood] = useState<Mood>(null);

  // ── Данные пары ────────────────────────────────────────────────────────────
  const [daysTogether, setDaysTogether] = useState<number>(worldStatus.streak);
  const [streak, setStreak] = useState<number>(7);

  // ── Движение / события / висящие элементы ─────────────────────────────────
  const [reduced, setReduced] = useState(false);
  const [lastEvent, setLastEvent] = useState<TreeEvent | undefined>(undefined);
  const [hangingItems, setHangingItems] = useState<HangingItem[]>(INITIAL_ITEMS);
  const [openedItem, setOpenedItem] = useState<string | null>(null);
  const [tapCount, setTapCount] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);

  // Автопереключение времени суток («○ авто»): каждые 8с → следующий этап.
  useEffect(() => {
    if (!autoCycle) return;
    const order: TimeOfDay[] = ["dawn", "day", "dusk", "night"];
    const idx = order.indexOf(timeOfDay);
    const timer = setTimeout(() => {
      setTimeOfDay(order[(idx + 1) % order.length]!);
    }, 8000);
    return () => clearTimeout(timer);
  }, [autoCycle, timeOfDay]);

  const grow = () => {
    const next = levelProgress + STEP;
    if (next >= 1) {
      setLevel(Math.min(MAX_LEVEL, level + 1));
      setLevelProgress(0);
    } else {
      setLevelProgress(next);
    }
  };

  const shrink = () => {
    const next = levelProgress - STEP;
    if (next < 0) {
      setLevel(Math.max(0, level - 1));
      setLevelProgress(level === 0 ? 0 : 1);
    } else {
      setLevelProgress(next);
    }
  };

  const fireEvent = useCallback((type: TreeEventType) => {
    setLastEvent({ type, at: Date.now() });
  }, []);

  const addItem = useCallback((kind: HangingItemKind) => {
    setHangingItems((items) => [
      ...items,
      { id: `h-${Date.now()}-${items.length}`, kind, anchor: items.length % 8, payload: { label: kind } },
    ]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setHangingItems((items) => items.filter((it) => it.id !== id));
  }, []);

  const safeLevel = Math.min(MAX_LEVEL, Math.max(0, level)) as TreeLevel;
  const safeProgress = Math.max(0, Math.min(1, levelProgress));
  const stageName = STAGE_NAMES[safeLevel];
  const stageEmoji = STAGE_EMOJI[safeLevel];

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/60 shadow-2xl shadow-black/5 backdrop-blur-xl">
      {/* Шапка карточки — заголовок, текущая стадия и уровень {level}/7. */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
        <h3 className="text-base font-extrabold text-(--hwd-ink)">Ваш сад</h3>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-(--hwd-primary-soft) px-3 py-1 text-xs font-extrabold text-(--hwd-primary)">
            {stageEmoji} {stageName}
          </span>
          <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-extrabold text-(--hwd-ink-soft)">
            {safeLevel}/7
          </span>
        </span>
      </div>

      {/* Сцена: дерево на стекле. Цветные блобы дают глубину, тёплое свечение
          держит землю у подножия. Кнопки теста +/− — в углу. */}
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-12 -top-16 size-64 rounded-full bg-(--hwd-primary-soft)/80 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-8 size-56 rounded-full bg-[#FFE7D6]/60 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -right-10 size-72 rounded-full bg-[#FFE7D6]/70 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,200,120,0.26),transparent_70%)]"
        />

        <TestControls onGrow={grow} onShrink={shrink} />

        {/* Desktop: полная сцена. Mobile: ниже — но без обрезки, дерево целиком. */}
        <div className="relative hidden lg:block">
          <WorldTree
            level={safeLevel}
            levelProgress={safeProgress}
            daysTogether={daysTogether}
            season={season}
            timeOfDay={timeOfDay}
            partnerMood={mood}
            streak={streak}
            hangingItems={hangingItems}
            lastEvent={lastEvent}
            onTreeTap={() => setTapCount((c) => c + 1)}
            onItemOpen={(item) => setOpenedItem(item.payload?.label ?? item.kind)}
            reducedMotion={reduced}
          />
        </div>
        <div className="relative lg:hidden">
          <WorldTree
            compact
            level={safeLevel}
            levelProgress={safeProgress}
            daysTogether={daysTogether}
            season={season}
            timeOfDay={timeOfDay}
            partnerMood={mood}
            streak={streak}
            hangingItems={hangingItems}
            lastEvent={lastEvent}
            onTreeTap={() => setTapCount((c) => c + 1)}
            onItemOpen={(item) => setOpenedItem(item.payload?.label ?? item.kind)}
            reducedMotion={reduced}
          />
        </div>

        {/* Живой отклик сцены: последний открытый висящий элемент. */}
        {openedItem && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[0.7rem] font-bold text-(--hwd-ink) shadow-sm backdrop-blur-md">
            Открыто: {openedItem}
          </div>
        )}
      </div>

      {/* Шкала прогресса — светлым текстом на стекле страницы. */}
      <div className="border-t border-white/60 bg-white/30 px-5 py-5 sm:px-6">
        <ProgressScale level={safeLevel} progress={safeProgress} />
      </div>

      {/* Тестовая панель — раскрыта по умолчанию, сворачивается кнопкой. */}
      <div className="border-t border-white/60 bg-white/30 px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-xs font-extrabold uppercase tracking-wider text-(--hwd-ink)">
            🧪 Панель тестирования
          </span>
          <span className="text-xs font-bold text-(--hwd-ink-soft)">
            {panelOpen ? "свернуть ▲" : "развернуть ▼"}
          </span>
        </button>

        {panelOpen && (
          <div className="mt-4 grid gap-5">
            {/* Рост: уровень 0–7 + прогресс 0–100% */}
            <PanelSection title="Рост">
              <div className="space-y-3">
                <SegGroup
                  options={[0, 1, 2, 3, 4, 5, 6, 7].map((l) => ({ value: l, label: String(l) }))}
                  value={safeLevel}
                  onChange={(l) => {
                    setLevel(l);
                    setLevelProgress(0);
                  }}
                />
                <SliderRow
                  label="Прогресс"
                  min={0}
                  max={100}
                  value={Math.round(safeProgress * 100)}
                  onChange={(v) => setLevelProgress(v / 100)}
                  format={(v) => `${v}%`}
                />
              </div>
            </PanelSection>

            {/* Сезон */}
            <PanelSection title="Сезон">
              <SegGroup options={SEASONS} value={season} onChange={setSeason} />
            </PanelSection>

            {/* Время суток + авто */}
            <PanelSection title="Время суток">
              <div className="space-y-2.5">
                <SegGroup options={TIMES} value={timeOfDay} onChange={setTimeOfDay} />
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoCycle}
                  onClick={() => setAutoCycle((a) => !a)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold transition active:scale-95",
                    autoCycle
                      ? "border-transparent bg-(--hwd-primary) text-white shadow-sm"
                      : "border-white/70 bg-white/70 text-(--hwd-ink-soft) hover:bg-white hover:text-(--hwd-ink)",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block size-2 rounded-full",
                      autoCycle ? "bg-white" : "bg-(--hwd-ink-soft)/40",
                    )}
                  />
                  ○ авто (8с)
                </button>
              </div>
            </PanelSection>

            {/* Настроение партнёра */}
            <PanelSection title="Настроение партнёра">
              <SegGroup options={MOODS} value={mood} onChange={setMood} />
            </PanelSection>

            {/* Дни вместе / серия */}
            <PanelSection title="Дни пары">
              <div className="space-y-2.5">
                <SliderRow
                  label="Дней вместе"
                  min={0}
                  max={1000}
                  value={daysTogether}
                  onChange={setDaysTogether}
                />
                <SliderRow
                  label="Серия"
                  min={0}
                  max={365}
                  value={streak}
                  onChange={setStreak}
                  format={(v) => `🔥 ${v}`}
                />
              </div>
            </PanelSection>

            {/* События (EventBurst) */}
            <PanelSection title="События">
              <div className="flex flex-wrap gap-1.5">
                {EVENT_BUTTONS.map((e) => (
                  <button
                    key={e.type}
                    type="button"
                    onClick={() => fireEvent(e.type)}
                    className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-bold text-(--hwd-ink-soft) transition hover:bg-white hover:text-(--hwd-ink) active:scale-95"
                  >
                    {e.emoji} {e.label}
                  </button>
                ))}
              </div>
              {tapCount > 0 && (
                <p className="mt-2 text-[0.7rem] font-bold text-(--hwd-ink-soft)">
                  тапов по дереву: {tapCount}
                </p>
              )}
            </PanelSection>

            {/* Висящие элементы */}
            <PanelSection title={`Висящие элементы (${hangingItems.length})`}>
              <div className="flex flex-wrap items-center gap-1.5">
                {hangingItems.map((it) => (
                  <span
                    key={it.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/70 py-1 pl-3 pr-1.5 text-xs font-bold text-(--hwd-ink)"
                  >
                    {it.kind} @#{it.anchor}
                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      aria-label={`Убрать ${it.kind}`}
                      className="flex size-4 items-center justify-center rounded-full bg-black/5 text-(--hwd-ink-soft) transition hover:bg-black/10 hover:text-(--hwd-ink)"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ITEM_KINDS.map((k) => (
                  <button
                    key={k.kind}
                    type="button"
                    onClick={() => addItem(k.kind)}
                    className="rounded-full border border-white/70 bg-(--hwd-primary-soft)/70 px-3 py-1 text-xs font-bold text-(--hwd-primary) transition hover:bg-white active:scale-95"
                  >
                    + {k.label}
                  </button>
                ))}
              </div>
            </PanelSection>

            {/* Движение */}
            <PanelSection title="Движение">
              <button
                type="button"
                role="switch"
                aria-checked={reduced}
                onClick={() => setReduced((r) => !r)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold transition active:scale-95",
                  reduced
                    ? "border-transparent bg-(--hwd-primary) text-white shadow-sm"
                    : "border-white/70 bg-white/70 text-(--hwd-ink-soft) hover:bg-white hover:text-(--hwd-ink)",
                )}
              >
                <span
                  className={cn(
                    "inline-block size-2 rounded-full",
                    reduced ? "bg-white" : "bg-(--hwd-ink-soft)/40",
                  )}
                />
                Только переходы состояний
              </button>
            </PanelSection>
          </div>
        )}
      </div>
    </div>
  );
}
