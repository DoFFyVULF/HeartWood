// Тонкая обёртка над IndexedDB: полные фото/видео (Blob) хранятся здесь,
// а не в localStorage (иначе быстро упрётся в квоту ~5MB). Метаданные
// воспоминания — в API; локально к id воспоминания привязан маленький
// реестр ссылок (cover-thumbnail + список Blob-ов) — см. memoryModel.ts.

import { createId } from "./mediaUtils";
import type { LocalExtras } from "./memoryModel";

const DB_NAME = "heartwood";
const DB_VERSION = 2;
const STORE = "heartwood-media";
const META_STORE = "heartwood-media-meta";

let dbPromise: Promise<IDBDatabase> | null = null;

/** Открывает соединение один раз и кэширует промис. */
function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Не удалось открыть IndexedDB"));
  });

  return dbPromise;
}

/** Сохраняет Blob и возвращает сгенерированный id. */
export async function putMedia(blob: Blob): Promise<string> {
  const db = await openDb();
  const id = createId();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Ошибка записи медиа"));
    tx.onabort = () => reject(tx.error ?? new Error("Запись медиа прервана"));
  });

  return id;
}

/** Достаёт Blob по id; null — если такого медиа нет. */
export async function getMedia(id: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => reject(req.error ?? new Error("Ошибка чтения медиа"));
  });
}

/** Удаляет Blob по id. */
export async function deleteMedia(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Ошибка удаления медиа"));
  });
}

/** Удаляет несколько Blob-ов одним транзакцией. */
export async function deleteMediaMany(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const id of ids) store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Ошибка удаления медиа"));
  });
}

/* ─── Локальный реестр по id воспоминания ─────────────────────── */

/**
 * Читает локальные дополнения воспоминания (cover + список Blob-ов).
 * null — ничего локального нет (метаданные есть на сервере, фото нет).
 */
export async function getMemoryMeta(memoryId: string): Promise<LocalExtras | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readonly");
    const req = tx.objectStore(META_STORE).get(memoryId);
    req.onsuccess = () => resolve((req.result as LocalExtras) ?? null);
    req.onerror = () => reject(req.error ?? new Error("Ошибка чтения реестра медиа"));
  });
}

/** Сохраняет локальные дополнения воспоминания (перезаписывает целиком). */
export async function putMemoryMeta(memoryId: string, meta: LocalExtras): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readwrite");
    tx.objectStore(META_STORE).put(meta, memoryId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Ошибка записи реестра медиа"));
  });
}

/** Удаляет локальный реестр воспоминания (когда удалено само воспоминание). */
export async function deleteMemoryMeta(memoryId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readwrite");
    tx.objectStore(META_STORE).delete(memoryId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Ошибка удаления реестра медиа"));
  });
}

/** ~80% квоты IndexedDB — сигнал, что пора чистить фото и видео. */
export async function isMediaStorageNearFull(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return false;
  try {
    const { usage, quota } = await navigator.storage.estimate();
    if (!quota || !usage) return false;
    return usage / quota > 0.8;
  } catch {
    return false;
  }
}
