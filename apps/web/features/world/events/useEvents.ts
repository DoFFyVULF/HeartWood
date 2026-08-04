"use client";

// Хук календаря: localStorage для пользовательских событий, useSyncExternalStore
// для чтения. Тот же паттерн, что в useGoals.ts / useCoupons.ts: модульный кэш
// хранит ссылку на объект хранилища, пересоздаётся только при записи или
// кросс-таб синке. Инвалидация — только в subscribe, иначе useSyncExternalStore
// увидит новую ссылку на каждом рендере.
//
// Состояние хранит только СОЗДАННЫЕ события. Seed-события живут в
// lib/data/events.ts; серверная гидрация получает пустое хранилище.

import { useMemo, useSyncExternalStore } from "react";
import { seedEvents, type AuthorId, type CoupleEvent, type EventKind } from "@/lib/data/events";

const STORAGE_KEY = "heartwood.events";
const CHANGE_EVENT = "heartwood:events-change";

/** Вход для нового события из композера. */
export interface NewEventInput {
  kind: EventKind;
  title: string;
  /** ISO-дата (YYYY-MM-DD). */
  date: string;
}

interface EventsStore {
  created: CoupleEvent[];
}

/* ─── Пустое хранилище (серверная гидрация) ───────────────────── */

const EMPTY_EVENTS: EventsStore = { created: [] };

/* ─── Вспомогательное ────────────────────────────────────────── */

/** Короткий id — время + случайная суффиксная буква. */
function eventId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ─── Модульный кэш ─────────────────────────────────────────── */

let cache: EventsStore | null = null;

function readStored(): EventsStore | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as EventsStore;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function readAll(): EventsStore {
  return readStored() ?? EMPTY_EVENTS;
}

/** Снапшот для серверной гидрации — календарь клиентский, сервер видит пустоту. */
function getServerSnapshot(): EventsStore {
  return EMPTY_EVENTS;
}

function getSnapshot(): EventsStore {
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

function write(next: EventsStore): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    cache = next;
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    return true;
  } catch {
    return false;
  }
}

/* ─── API ───────────────────────────────────────────────────── */

/** Строка → участник, если id совпадает; иначе null. */
export function toAuthorId(id: string): AuthorId | null {
  return id === "dima" || id === "anya" ? id : null;
}

/**
 * Добавляет пользовательское событие (saved в хранилище). Годовщины из
 * композера становятся рекуррентными — повторяются каждый год по месяцу/числу.
 * Возвращает id события, если запись сохранена.
 */
export function addEvent(input: NewEventInput, createdBy: AuthorId): string | null {
  const store = readAll();
  const id = eventId("evt");
  const event: CoupleEvent = {
    id,
    kind: input.kind,
    title: input.title.trim(),
    date: input.date,
    recurring: input.kind === "anniversary",
    createdBy,
  };
  const next: EventsStore = {
    ...store,
    created: [event, ...store.created],
  };
  return write(next) ? id : null;
}

/** Удаляет созданное событие (seed-события неудаляемы). */
export function removeEvent(id: string): boolean {
  const store = readAll();
  if (!store.created.some((e) => e.id === id)) return false;
  const next: EventsStore = {
    ...store,
    created: store.created.filter((e) => e.id !== id),
  };
  return write(next);
}

/**
 * Хук календаря. Возвращает все события (seed + созданные, свежие сверху)
 * и операции. Расчёт «сколько дней до события» делает страница — хук хранит
 * только данные, чтобы оставаться SSR-чистым.
 */
export function useEvents() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const events = useMemo<CoupleEvent[]>(
    () => [...store.created, ...seedEvents],
    [store],
  );

  return {
    events,
    create: addEvent,
    remove: removeEvent,
  };
}
