"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { LivingTree, STAGE_NAMES, TREE_SPECIES } from "@/features/world/tree/LivingTree";
import type { Mood, Season, SpeciesProp, TimeOfDay } from "@/features/world/tree/LivingTree";
import { worldStatus } from "@/lib/data/worldStatus";
import { cn } from "@/lib/utils";
import {
  SeedIcon,
  SproutIcon,
  SaplingIcon,
  PotIcon,
  BloomIcon,
  TreeIcon,
  PineIcon,
  WorldTreeIcon,
  SunIcon,
  RainIcon,
  StormIcon,
  RainbowIcon,
  MoonIcon,
  FlaskIcon,
} from "./components/icons";

// ─── Стадии роста: имена и иконки — синхронизированы с LivingTree. ───────────
const STAGE_ICONS = [
  SeedIcon,
  SproutIcon,
  SaplingIcon,
  PotIcon,
  BloomIcon,
  TreeIcon,
  PineIcon,
  WorldTreeIcon,
];

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

// Настроения LivingTree: clear / rain / storm / rainbow / moonlight.
const MOODS: { value: Mood; label: string; Icon: (p: { className?: string }) => React.ReactElement }[] = [
  { value: "clear", label: "Ясно", Icon: SunIcon },
  { value: "rain", label: "Дождь", Icon: RainIcon },
  { value: "storm", label: "Гроза", Icon: StormIcon },
  { value: "rainbow", label: "Радуга", Icon: RainbowIcon },
  { value: "moonlight", label: "Лунный свет", Icon: MoonIcon },
];

// Виды дерева LivingTree: 'auto' + пять архетипов из TREE_SPECIES.
const SPECIES_OPTIONS: { value: SpeciesProp; label: string }[] = [
  { value: "auto", label: "🎲 Авто" },
  ...Object.values(TREE_SPECIES).map((s) => ({ value: s.id, label: `${s.emoji} ${s.label}` })),
];

const SEED_PRESETS = ["древний дуб", "сакура у реки", "северный кедр", "плакучая ива", "баобаб", "белая берёза", "клен", "горная сосна"];

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
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)",
            o.value === value
              ? "border-transparent bg-(--hwd-primary) text-white shadow-sm"
              : "border-[color-mix(in_srgb,var(--hwd-ink-soft)_22%,transparent)] bg-white/70 text-(--hwd-ink-soft) hover:bg-white hover:text-(--hwd-ink)",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Слайдер (прогресс роста) ─────────────────────────────────────────────────
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
        className="flex size-9 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--hwd-ink-soft)_22%,transparent)] bg-white/70 text-base font-bold text-(--hwd-ink-soft) shadow-[0_10px_24px_-16px_rgb(30_27_60_/_0.35)] backdrop-blur-md transition hover:bg-white hover:text-(--hwd-ink) active:scale-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
      >
        −
      </button>
      <button
        type="button"
        onClick={onGrow}
        aria-label="Увеличить дерево"
        title="Увеличить (тест)"
        className="flex size-9 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--hwd-primary)_28%,transparent)] bg-[color-mix(in_srgb,var(--hwd-primary-soft)_55%,#ffffff)] text-base font-bold text-(--hwd-primary) shadow-[0_10px_24px_-16px_rgb(30_27_60_/_0.35)] backdrop-blur-md transition hover:bg-white active:scale-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
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
 * Садовая сцена + тестовая панель. Дерево — генеративное <LivingTree /> из этого
 * же фиче-каталога: сид, вид, уровень/прогресс, сезон, время суток и настроение
 * управляются панелью ниже. Сцена самодостаточна (SVG + CSS-анимации), поэтому
 * на страницу ложится целиком, в стеклянную карточку языка страницы.
 */
export function TreeStage() {
  // ── Рост ───────────────────────────────────────────────────────────────────
  const [level, setLevel] = useState<number>(worldStatus.level);
  const [levelProgress, setLevelProgress] = useState<number>(worldStatus.levelProgress);

  // ── Вид дерева / сид генерации ─────────────────────────────────────────────
  const [species, setSpecies] = useState<SpeciesProp>("auto");
  const [seed, setSeed] = useState<string>(worldStatus.couple);

  // ── Сезон / время суток / настроение ──────────────────────────────────────
  const [season, setSeason] = useState<Season>("summer");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("day");
  const [autoCycle, setAutoCycle] = useState(false);
  const [mood, setMood] = useState<Mood>("clear");

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

  const safeLevel = Math.min(MAX_LEVEL, Math.max(0, level)) as TreeLevel;
  const safeProgress = Math.max(0, Math.min(1, levelProgress));
  const stageName = STAGE_NAMES[safeLevel];
  const StageIcon = STAGE_ICONS[safeLevel] ?? SeedIcon;

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[color-mix(in_srgb,var(--hwd-primary)_24%,rgb(255_255_255_/_0.8))] bg-[linear-gradient(180deg,rgb(255_255_255_/_0.85),rgb(255_255_255_/_0.6))] shadow-[0_14px_34px_-22px_rgb(30_27_60_/_0.35),inset_0_1px_0_rgb(255_255_255_/_0.85)] backdrop-blur-xl">
      {/* Шапка карточки — заголовок, текущая стадия и уровень {level}/7. */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
        <h3 className="text-base font-extrabold text-(--hwd-ink)">Ваш сад</h3>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--hwd-primary)_28%,transparent)] bg-[color-mix(in_srgb,var(--hwd-primary-soft)_55%,#ffffff)] px-3 py-1 text-xs font-extrabold text-(--hwd-primary)">
            <StageIcon className="size-3.5" />
            {stageName}
          </span>
          <span className="rounded-full border border-[color-mix(in_srgb,var(--hwd-ink-soft)_22%,transparent)] bg-white/70 px-3 py-1 text-xs font-extrabold text-(--hwd-ink-soft)">
            {safeLevel}/7
          </span>
        </span>
      </div>

      {/* Сцена: генеративное живое дерево в собственном тёмном кадре.
          Кнопки теста +/− — в углу поверх кадра. Кадр ограничен по ширине
          пропорцией сцены (1000:780), поэтому боковых полей нет. */}
      <div className="relative mx-auto mt-4 w-full max-w-[820px]">
        <TestControls onGrow={grow} onShrink={shrink} />
        <LivingTree
          seedKey={seed}
          species={species}
          level={safeLevel}
          levelProgress={safeProgress}
          season={season}
          timeOfDay={timeOfDay}
          mood={mood}
          showProgress
        />
      </div>

      {/* Тестовая панель — раскрыта по умолчанию, сворачивается кнопкой. */}
      <div className="border-t border-[color-mix(in_srgb,var(--hwd-ink-soft)_14%,transparent)] bg-white/30 px-5 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
          className="flex w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
        >
          <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-(--hwd-ink)">
            <FlaskIcon className="size-4 text-(--hwd-ink-soft)" />
            Панель тестирования
          </span>
          <span className="text-xs font-bold text-(--hwd-ink-soft)">
            {panelOpen ? "свернуть" : "развернуть"}
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

            {/* Вид дерева */}
            <PanelSection title="Вид дерева">
              <SegGroup options={SPECIES_OPTIONS} value={species} onChange={setSpecies} />
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
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)",
                    autoCycle
                      ? "border-transparent bg-(--hwd-primary) text-white shadow-sm"
                      : "border-[color-mix(in_srgb,var(--hwd-ink-soft)_22%,transparent)] bg-white/70 text-(--hwd-ink-soft) hover:bg-white hover:text-(--hwd-ink)",
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

            {/* Настроение */}
            <PanelSection title="Настроение">
              <SegGroup
                options={MOODS.map(({ value, label, Icon }) => ({
                  value,
                  label: (
                    <span className="inline-flex items-center gap-1.5">
                      <Icon className="size-3.5" />
                      {label}
                    </span>
                  ),
                }))}
                value={mood}
                onChange={setMood}
              />
            </PanelSection>

            {/* Сид генерации */}
            <PanelSection title="Сид">
              <div className="flex flex-wrap items-center gap-1.5">
                <input
                  type="text"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="строка-сид…"
                  className="min-w-40 flex-1 rounded-full border border-[color-mix(in_srgb,var(--hwd-ink-soft)_22%,transparent)] bg-white/70 px-3 py-1 text-xs font-bold text-(--hwd-ink) outline-none transition placeholder:text-(--hwd-ink-soft)/60 focus:border-[color-mix(in_srgb,var(--hwd-primary)_50%,transparent)] focus:ring-4 focus:ring-(--hwd-glow)"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSeed(`${SEED_PRESETS[Math.floor(Math.random() * SEED_PRESETS.length)]}-${Math.floor(Math.random() * 99)}`)
                  }
                  aria-label="Случайный сид"
                  title="Случайный сид"
                  className="rounded-full border border-[color-mix(in_srgb,var(--hwd-primary)_28%,transparent)] bg-[color-mix(in_srgb,var(--hwd-primary-soft)_70%,#ffffff)] px-3 py-1 text-xs font-bold text-(--hwd-primary) transition hover:bg-white active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
                >
                  🎲
                </button>
              </div>
            </PanelSection>
          </div>
        )}
      </div>
    </div>
  );
}
