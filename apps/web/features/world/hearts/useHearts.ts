"use client";

// Кошелёк «сердечек»: localStorage для состояния, useSyncExternalStore для чтения.
//
// Тот же паттерн, что в useCoupons.ts / useMemories.ts: модульный кэш хранит
// ссылку на объект хранилища, который пересоздаётся только при записи или
// кросс-таб синке. Инвалидация — только в subscribe, иначе useSyncExternalStore
// увидит новую ссылку на каждом рендере → бесконечный ререндер.
//
// Баланс ЛИЧНЫЙ: кошелёк привязан к personId владельца, чужой баланс не
// читается. Серверная гидрация получает пустое хранилище — кошельки клиентские.

import { useEffect, useMemo } from "react";
import { useSyncExternalStore } from "react";
import {
  EMPTY_HEARTS,
  type HeartTx,
  type HeartTxReason,
  type HeartsStore,
} from "@/lib/data/hearts";

const STORAGE_KEY = "heartwood.hearts";
const CHANGE_EVENT = "heartwood:hearts-change";

/* ─── Вспомогательное ────────────────────────────────────────── */

/** Локальный день «2026-08-04» — ключ идемпотентности ежедневного бонуса. */
export function todayKey(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** SSR-safe метка «5 августа» — только на клиенте. */
function labelForNow(): string {
  return new Date().toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

/** Короткий id записи — время + случайная суффиксная буква. */
function txId(): string {
  return `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Граница 30 дней назад (ms) для фильтрации истории. */
function monthAgo(): number {
  return Date.now() - 30 * 24 * 60 * 60 * 1000;
}

/* ─── Модульный кэш ─────────────────────────────────────────── */

let cache: HeartsStore | null = null;

function readStored(): HeartsStore | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HeartsStore;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function readAll(): HeartsStore {
  return readStored() ?? EMPTY_HEARTS;
}

/** Снапшот для серверной гидрации — кошельки клиентские, сервер видит пустоту. */
function getServerSnapshot(): HeartsStore {
  return EMPTY_HEARTS;
}

function getSnapshot(): HeartsStore {
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

function write(next: HeartsStore): boolean {
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

/**
 * Зачисляет сердечки владельцу. Возвращает true, если запись сохранена.
 * Используется внутренне и для будущих правил начисления.
 */
export function grantHearts(
  personId: string,
  amount: number,
  reason: HeartTxReason,
  label: string,
): boolean {
  const store = readAll();
  const wallet = store.wallets[personId] ?? { balance: 0, txs: [] };
  const tx: HeartTx = {
    id: txId(),
    reason,
    amount,
    label,
    at: labelForNow(),
    ts: Date.now(),
  };
  const next: HeartsStore = {
    ...store,
    wallets: {
      ...store.wallets,
      [personId]: {
        balance: wallet.balance + amount,
        txs: [tx, ...wallet.txs],
      },
    },
  };
  return write(next);
}

/**
 * Списание сердечек (выкуп купона). Проверяет баланс и не даёт уйти в минус.
 * Возвращает true, если списание произошло.
 */
export function spendHearts(
  personId: string,
  amount: number,
  reason: HeartTxReason,
  label: string,
): boolean {
  const store = readAll();
  const wallet = store.wallets[personId] ?? { balance: 0, txs: [] };
  if (wallet.balance < amount) return false;
  const tx: HeartTx = {
    id: txId(),
    reason,
    amount: -amount,
    label,
    at: labelForNow(),
    ts: Date.now(),
  };
  const next: HeartsStore = {
    ...store,
    wallets: {
      ...store.wallets,
      [personId]: {
        balance: wallet.balance - amount,
        txs: [tx, ...wallet.txs],
      },
    },
  };
  return write(next);
}

/** Ежедневный бонус (+10). Идемпотентно: раз в локальный день. */
export function claimDaily(personId: string): boolean {
  const store = readAll();
  const today = todayKey();
  if (store.lastDaily[personId] === today) return false;
  // Начисление через grantHearts пишет новый кэш — читаем хранилище заново,
  // чтобы не перезатереть только что добавленную транзакцию.
  if (!grantHearts(personId, 10, "daily", "Ежедневный вход")) return false;
  const next: HeartsStore = {
    ...readAll(),
    lastDaily: { ...readAll().lastDaily, [personId]: today },
  };
  return write(next);
}

/**
 * Хук кошелька конкретного участника. `history` — транзакции за последние
 * 30 дней (свежие сверху); `spend` — списание с проверкой баланса.
 */
export function useHearts(personId: string) {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Ежедневный бонус начисляется при первом посещении дня.
  useEffect(() => {
    claimDaily(personId);
  }, [personId]);

  const wallet = store.wallets[personId];

  const history = useMemo<HeartTx[]>(() => {
    const txs = wallet?.txs ?? [];
    const cutoff = monthAgo();
    return txs.filter((tx) => tx.ts >= cutoff).sort((a, b) => b.ts - a.ts);
  }, [wallet]);

  const balance = wallet?.balance ?? 0;

  return {
    balance,
    history,
    spend: (amount: number, reason: HeartTxReason, label: string) =>
      spendHearts(personId, amount, reason, label),
  };
}
