"use client";

// Хук воспоминаний: localStorage для метаданных + IndexedDB для медиа.
//
// Коллекция читается через useSyncExternalStore с КЭШИРОВАННЫМ снапшотом:
// модульный кэш хранит ссылку на массив, который пересоздаётся только при
// записи или кросс-таб синке. Инвалидация — только в subscribe (событие
// heartwood:memories-change + нативный storage), иначе useSyncExternalStore
// увидит новую ссылку на каждом рендере → бесконечный ререндер.

import { useSyncExternalStore } from "react";
import { seedMemories, type Memory } from "@/lib/data/memories";
import { createId } from "./mediaUtils";

const STORAGE_KEY = "heartwood.memories";
const CHANGE_EVENT = "heartwood:memories-change";

/** ~80% лимита localStorage (5MB) — сигнал, что пора чистить. */
const WARN_THRESHOLD = 4 * 1024 * 1024;

/* ─── Модульный кэш ─────────────────────────────────────────── */

let cache: Memory[] | null = null;

/** Читает пользовательские воспоминания из localStorage, парся ровно один раз. */
function readUserMemories(): Memory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Memory[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Полный список: пользовательские (свежие) сверху, seeds — ниже. */
function readAll(): Memory[] {
  const user = readUserMemories();
  return [...user, ...seedMemories];
}

/** Снапшот для серверной гидрации — только seeds, без медиа. */
function getServerSnapshot(): Memory[] {
  return seedMemories;
}

function getSnapshot(): Memory[] {
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

interface WriteResult {
  ok: boolean;
  quota?: boolean;
}

function writeMemories(next: Memory[]): WriteResult {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    cache = [...next, ...seedMemories];
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
    return { ok: true };
  } catch (err) {
    const isQuota =
      err instanceof DOMException &&
      (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED");
    return { ok: false, quota: isQuota };
  }
}

function estimateNearFull(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return (raw?.length ?? 0) > WARN_THRESHOLD;
  } catch {
    return false;
  }
}

/* ─── API ───────────────────────────────────────────────────── */

export interface AddMemoryInput {
  title: string;
  emoji: string;
  date: string;
  story?: string;
  cover?: string;
  media: Memory["media"];
}

export function useMemories() {
  const memories = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /** Создаёт воспоминание. Возвращает { ok, memory?, quota? }. */
  function addMemory(input: AddMemoryInput): WriteResult & { memory?: Memory } {
    const user = readUserMemories();
    const memory: Memory = {
      ...input,
      id: createId(),
      createdAt: Date.now(),
    };
    const result = writeMemories([memory, ...user]);
    if (!result.ok) return result;
    return { ok: true, memory };
  }

  function updateMemory(id: string, patch: Partial<AddMemoryInput>): boolean {
    const user = readUserMemories();
    const idx = user.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    const next = [...user];
    next[idx] = { ...next[idx], ...patch };
    return writeMemories(next).ok;
  }

  function deleteMemory(id: string): boolean {
    const user = readUserMemories();
    const next = user.filter((m) => m.id !== id);
    if (next.length === user.length) return false;
    return writeMemories(next).ok;
  }

  return {
    memories,
    addMemory,
    updateMemory,
    deleteMemory,
    storageNearFull: estimateNearFull(),
  };
}
