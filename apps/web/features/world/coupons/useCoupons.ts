"use client";

// Хук купонной книжки: localStorage для состояния, useSyncExternalStore для чтения.
//
// Коллекция читается с КЭШИРОВАННЫМ снапшотом — тот же паттерн, что в
// useMemories.ts: модульный кэш хранит ссылку на массив, который пересоздаётся
// только при записи или кросс-таб синке. Инвалидация — только в subscribe
// (событие heartwood:coupons-change + нативный storage), иначе useSyncExternalStore
// увидит новую ссылку на каждом рендере → бесконечный ререндер.
//
// Хранится ПОЛНЫЙ список (seed-купон «застывают» в localStorage при первом
// погашении) — так погашенные купоны сохраняются, а дубликаты не появляются,
// потому что readAll читает только localStorage.
//
// Черновики живут здесь же: создание (create) кладёт купон со статусом draft,
// отправка (send) переводит его в active, удаление (remove) убирает из книжки.

import { useSyncExternalStore } from "react";
import {
  seedCoupons,
  type AuthorId,
  type Coupon,
  type CouponStatus,
} from "@/lib/data/coupons";

const STORAGE_KEY = "heartwood.coupons";
const CHANGE_EVENT = "heartwood:coupons-change";

/* ─── Модульный кэш ─────────────────────────────────────────── */

let cache: Coupon[] | null = null;

/**
 * Читает сохранённую книжку и нормализует купоны, сохранённые до появления
 * цены: у старых записей price отсутствует — подставляем 0, чтобы погашение
 * осталось бесплатным, а UI не падал на undefined.
 */
function normalize(coupons: Coupon[]): Coupon[] {
  return coupons.map((c) => ({ ...c, price: typeof c.price === "number" ? c.price : 0 }));
}

/** Читает сохранённую книжку; null, если пользователь ещё ничего не менял. */
function readStored(): Coupon[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Coupon[];
    return Array.isArray(parsed) ? normalize(parsed) : null;
  } catch {
    return null;
  }
}

/** Полная книжка: сохранённая или seed-купон из коробки. */
function readAll(): Coupon[] {
  return readStored() ?? seedCoupons;
}

/** Снапшот для серверной гидрации — только seeds, без клиентских данных. */
function getServerSnapshot(): Coupon[] {
  return seedCoupons;
}

function getSnapshot(): Coupon[] {
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

function write(next: Coupon[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    cache = next;
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    return true;
  } catch {
    return false;
  }
}

/** Метка даты «5 августа» — только на клиенте. */
function labelForNow(): string {
  return new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

/* ─── API ───────────────────────────────────────────────────── */

export interface NewCouponInput {
  emoji: string;
  title: string;
  description: string;
  price: number;
}

export function useCoupons() {
  const coupons = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /**
   * Создаёт купон как ЧЕРНОВИК от имени `by`. Возвращает созданный купон
   * или null, если запись не сохранилась.
   */
  function create(input: NewCouponInput, by: AuthorId): Coupon | null {
    const coupon: Coupon = {
      id: `cp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      emoji: input.emoji,
      title: input.title,
      description: input.description,
      price: input.price,
      status: "draft",
      createdBy: by,
      createdAt: labelForNow(),
    };
    const all = readAll();
    return write([coupon, ...all]) ? coupon : null;
  }

  /**
   * Отправляет черновик партнёру `to` — статус draft → active.
   * Возвращает true, если отправка произошла.
   */
  function send(id: string, to: AuthorId): boolean {
    const all = readAll();
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    const coupon = all[idx];
    if (coupon.status !== "draft") return false;
    const next = [...all];
    next[idx] = { ...coupon, status: "active", recipient: to };
    return write(next);
  }

  /**
   * Удаляет черновик (или любой купон) из книжки. Возвращает true,
   * если удаление произошло.
   */
  function remove(id: string): boolean {
    const all = readAll();
    if (!all.some((c) => c.id === id)) return false;
    return write(all.filter((c) => c.id !== id));
  }

  /**
   * Гасит активный купон от имени `by`. Возвращает true, если погашение
   * произошло (купон был активен и запись сохранилась).
   */
  function redeem(id: string, by: AuthorId): boolean {
    const all = readAll();
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    const coupon = all[idx];
    if (coupon.status !== "active") return false;
    const next = [...all];
    next[idx] = {
      ...coupon,
      status: "redeemed",
      redeemedAt: labelForNow(),
      redeemedBy: by,
    };
    return write(next);
  }

  return { coupons, create, send, remove, redeem };
}
