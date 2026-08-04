"use client";

// Копилки целей: localStorage для состояния, useSyncExternalStore для чтения.
//
// Тот же паттерн, что в useCoupons.ts / useHearts.ts / useMemories.ts:
// модульный кэш хранит ссылку на объект хранилища, который пересоздаётся
// только при записи или кросс-таб синке. Инвалидация — только в subscribe,
// иначе useSyncExternalStore увидит новую ссылку на каждом рендере.
//
// Состояние хранит только ОТКЛОНЕНИЯ от seed-целей: накопленное поверх,
// вклады и созданные цели. Seed-цели остаются в lib/data/goals.ts; серверная
// гидрация получает пустое хранилище — копилки клиентские.

import { useMemo, useSyncExternalStore } from "react";
import { seedGoals, type CoupleGoal } from "@/lib/data/goals";

const STORAGE_KEY = "heartwood.goals";
const CHANGE_EVENT = "heartwood:goals-change";

/** Один вклад участника в копилку. `at` — SSR-safe метка («вчера»). */
export interface GoalContribution {
  personId: string;
  amount: number;
  at: string;
}

/** Отклонение от seed-цели: сколько накоплено дополнительно. */
interface GoalOverride {
  extra: number;
}

/** Вход для новой цели из композера. */
export interface NewGoalInput {
  kind: CoupleGoal["kind"];
  title: string;
  target: number;
}

interface GoalsStore {
  /** goalId → накоплено СВЕРХ seed (у seed-целей saved = seed + extra). */
  overrides: Record<string, GoalOverride>;
  /** goalId → вклады по порядку (свежие сверху). */
  contributions: Record<string, GoalContribution[]>;
  /** Пользовательские цели (созданы в композере). */
  created: CoupleGoal[];
}

/* ─── Пустое хранилище (серверная гидрация) ───────────────────── */

const EMPTY_GOALS: GoalsStore = {
  overrides: {},
  contributions: {},
  created: [],
};

/* ─── Вспомогательное ────────────────────────────────────────── */

/** SSR-safe метка «5 августа» — только на клиенте. */
function labelForNow(): string {
  return new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

/** Короткий id — время + случайная суффиксная буква. */
function goalId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Прогресс 0–100, никогда не выше потолка. */
export function goalProgress(goal: CoupleGoal): number {
  const clamped = Math.min(goal.saved, goal.target);
  return Math.round((clamped / goal.target) * 100);
}

/* ─── Модульный кэш ─────────────────────────────────────────── */

let cache: GoalsStore | null = null;

function readStored(): GoalsStore | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GoalsStore;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function readAll(): GoalsStore {
  return readStored() ?? EMPTY_GOALS;
}

/** Снапшот для серверной гидрации — копилки клиентские, сервер видит пустоту. */
function getServerSnapshot(): GoalsStore {
  return EMPTY_GOALS;
}

function getSnapshot(): GoalsStore {
  if (cache === null) cache = readAll();
  return cache;
}

function subscribe(onStoreChange: () => void): () => void {
  const fire = () => {
    cache = null;
    onStoreChange();
  };
  window.addEventListener(CHANGE_EVENT, fire);
  window.addEventListener("storage", fire); // кросс-таб синк
  return () => {
    window.removeEventListener(CHANGE_EVENT, fire);
    window.removeEventListener("storage", fire);
  };
}

/* ─── Безопасная запись ─────────────────────────────────────── */

function write(next: GoalsStore): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    cache = next;
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    return true;
  } catch {
    return false;
  }
}

/* ─── Чтение целей ──────────────────────────────────────────── */

/** Seed-цели с накопленным сверху (вклады из хранилища). */
function withSeedExtras(store: GoalsStore): CoupleGoal[] {
  return seedGoals.map((goal) => {
    const extra = store.overrides[goal.id]?.extra ?? 0;
    return extra > 0 ? { ...goal, saved: goal.saved + extra } : goal;
  });
}

/* ─── API ───────────────────────────────────────────────────── */

/**
 * Вклад в копилку: кладёт рубли поверх seed-цели. Возвращает true,
 * если запись сохранена. Цели не знают о кошельках сердечек — вклад
 * это просто добавленная сумма в общий кошелёк (симуляция накопления).
 */
export function addContribution(
  goalId: string,
  personId: string,
  amount: number,
): boolean {
  const store = readAll();
  const list = store.contributions[goalId] ?? [];
  const tx: GoalContribution = { personId, amount, at: labelForNow() };
  const next: GoalsStore = {
    ...store,
    overrides: {
      ...store.overrides,
      [goalId]: { extra: (store.overrides[goalId]?.extra ?? 0) + amount },
    },
    contributions: {
      ...store.contributions,
      [goalId]: [tx, ...list],
    },
  };
  return write(next);
}

/** Создаёт новую цель (saved = 0). Возвращает её id, если сохранено. */
export function addGoal(input: NewGoalInput): string | null {
  const store = readAll();
  const id = goalId("goal");
  const goal: CoupleGoal = {
    id,
    kind: input.kind,
    title: input.title.trim(),
    description: "",
    saved: 0,
    target: Math.max(1, input.target),
    deadline: "постепенно",
    milestones: [],
    contributions: { dima: 0, anya: 0 },
  };
  const next: GoalsStore = {
    ...store,
    created: [goal, ...store.created],
  };
  return write(next) ? id : null;
}

/** Удаляет созданную цель (seed-цели неудаляемы). */
export function removeGoal(id: string): boolean {
  const store = readAll();
  if (!store.created.some((g) => g.id === id)) return false;
  const next: GoalsStore = {
    ...store,
    created: store.created.filter((g) => g.id !== id),
  };
  return write(next);
}

/**
 * Хук копилок. Возвращает цели (seed + созданные, с накопленным поверх),
 * историю вкладов и операции. `contribute` добавляет сумму в копилку —
 * ничего не списывая: у целей нет общей валюты с сердечками.
 */
export function useGoals() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const goals = useMemo<CoupleGoal[]>(
    () => [...withSeedExtras(store), ...store.created],
    [store],
  );

  const totalSaved = useMemo(
    () => goals.reduce((n, g) => n + g.saved, 0),
    [goals],
  );

  /** Сколько всего не хватает до всех активных целей (копим дальше). */
  const totalRemaining = useMemo(
    () => goals.reduce((n, g) => n + Math.max(0, g.target - g.saved), 0),
    [goals],
  );

  return {
    goals,
    totalSaved,
    totalRemaining,
    contributions: store.contributions,
    contribute: (goalId: string, personId: string, amount: number) =>
      addContribution(goalId, personId, amount),
    create: addGoal,
    remove: removeGoal,
  };
}
