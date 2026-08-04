"use client";

// Хук «Списка желаний»: localStorage для пользовательских желаний,
// useSyncExternalStore для чтения. Тот же паттерн, что в useEvents.ts /
// useGoals.ts: модульный кэш хранит ссылку на объект хранилища,
// пересоздаётся только при записи или кросс-таб синке. Инвалидация — только
// в subscribe, иначе useSyncExternalStore увидит новую ссылку на каждом
// рендере.
//
// Состояние хранит только СОЗДАННЫЕ желания. Seed-желания живут в
// lib/data/wishlist.ts; серверная гидрация получает пустое хранилище.
//
// Игровая механика «кто-то готовит подарок»: партнёр мечтателя может
// заклеймить желание (claim) — стать тем, кто дарит. Мечтатель при этом
// видит только статус «готовится подарок», но не имя заклеймившего: сюрприз
// важнее учёта. Вернуть подарок в общий список можно в любой момент.

import { useMemo, useSyncExternalStore } from "react";
import { seedWishes, type AuthorId, type Wish } from "@/lib/data/wishlist";

const STORAGE_KEY = "heartwood.wishlist";
const CHANGE_EVENT = "heartwood:wishlist-change";

/** Вход для нового желания из композера. */
export interface NewWishInput {
  title: string;
  description?: string;
  /** Кто загадал («Мечта Димы» / «Мечта Ани»). */
  wisherId: AuthorId;
}

interface WishlistStore {
  created: Wish[];
}

/* ─── Пустое хранилище (серверная гидрация) ───────────────────── */

const EMPTY_WISHLIST: WishlistStore = { created: [] };

/* ─── Вспомогательное ────────────────────────────────────────── */

/** Короткий id — время + случайная суффиксная буква. */
function wishId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/* ─── Модульный кэш ─────────────────────────────────────────── */

let cache: WishlistStore | null = null;

function readStored(): WishlistStore | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WishlistStore;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function readAll(): WishlistStore {
  return readStored() ?? EMPTY_WISHLIST;
}

/** Снапшот для серверной гидрации — список клиентский, сервер видит пустоту. */
function getServerSnapshot(): WishlistStore {
  return EMPTY_WISHLIST;
}

function getSnapshot(): WishlistStore {
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

function write(next: WishlistStore): boolean {
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
 * Добавляет желание (сохранённое в хранилище). Вернуть id — для notice.
 * Мечтать можно и за партнёра (wisherId из композера), но создаёт текущий
 * участник (createdBy).
 */
export function addWish(input: NewWishInput, createdBy: AuthorId): string | null {
  const store = readAll();
  const id = wishId("wsh");
  const wish: Wish = {
    id,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    wisherId: input.wisherId,
    createdBy,
  };
  const next: WishlistStore = {
    ...store,
    created: [wish, ...store.created],
  };
  return write(next) ? id : null;
}

/**
 * Взять желание в подарок (claim). Может только партнёр мечтателя — нельзя
 * подарить самому себе: теряется сюрприз. Возвращает false, если желание
 * уже взято/подарено или это своё.
 */
export function claimWish(id: string, claimerId: AuthorId): boolean {
  const store = readAll();
  const wish = store.created.find((w) => w.id === id);
  if (!wish || wish.wisherId === claimerId || wish.claimerId || wish.fulfilled) return false;
  const next: WishlistStore = {
    ...store,
    created: store.created.map((w) =>
      w.id === id ? { ...w, claimerId } : w,
    ),
  };
  return write(next);
}

/**
 * Вернуть подарок в общий список (unclaim). Может только тот, кто взял.
 * Возвращает false, если желание не в работе у этого участника.
 */
export function unclaimWish(id: string, claimerId: AuthorId): boolean {
  const store = readAll();
  const wish = store.created.find((w) => w.id === id);
  if (!wish || wish.claimerId !== claimerId) return false;
  // undefined-значение сериализуется в JSON как отсутствующее — заклеймивший
  // полностью исчезает из хранилища.
  const next: WishlistStore = {
    ...store,
    created: store.created.map((w) =>
      w.id === id ? { ...w, claimerId: undefined } : w,
    ),
  };
  return write(next);
}

/**
 * Отметить желание подаренным (fulfill). Кто может: заклеймивший даритель
 * (это его работа) или сам мечтатель (мало ли, сам купил). Сбывшееся желание
 * переезжает в раздел «Подарено» и больше не в работе.
 */
export function fulfillWish(id: string, who: AuthorId): boolean {
  const store = readAll();
  const wish = store.created.find((w) => w.id === id);
  if (!wish || wish.fulfilled) return false;
  if (wish.wisherId !== who && wish.claimerId !== who) return false;
  const next: WishlistStore = {
    ...store,
    created: store.created.map((w) =>
      w.id === id ? { ...w, fulfilled: true, claimerId: undefined } : w,
    ),
  };
  return write(next);
}

/**
 * Удаляет созданное желание (seed-желания неудаляемы). Удалить может
 * создатель или мечтатель — по сути «я передумал мечтать».
 */
export function removeWish(id: string, who: AuthorId): boolean {
  const store = readAll();
  const wish = store.created.find((w) => w.id === id);
  if (!wish) return false;
  if (wish.createdBy !== who && wish.wisherId !== who) return false;
  const next: WishlistStore = {
    ...store,
    created: store.created.filter((w) => w.id !== id),
  };
  return write(next);
}

/**
 * Хук «Списка желаний». Возвращает все желания (seed + созданные, свежие
 * сверху) и операции claim/unclaim/fulfill/remove. Хук хранит только данные
 * и SSR-чист: статусы и разделы считает страница.
 */
export function useWishlist() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const wishes = useMemo<Wish[]>(() => [...store.created, ...seedWishes], [store]);

  return {
    wishes,
    add: addWish,
    claim: claimWish,
    unclaim: unclaimWish,
    fulfill: fulfillWish,
    remove: removeWish,
  };
}
