"use client";

// Хук воспоминаний: метаданные — из API, локальные cover/media — из IndexedDB.
//
// Метаданные (название, эмодзи, дата, история) хранятся на сервере и читаются
// через useMemories из api-data. Полные фото/видео (Blob) — в IndexedDB;
// к id воспоминания привязан маленький реестр ссылок (см. mediaStore).
//
// Мутации асинхронные и возвращают Promise: addMemory создаёт метаданные на
// сервере, затем привязывает локальные cover/media к полученному id.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMemories as useMemoriesApi } from "@/lib/api-data";
import {
  deleteMediaMany,
  deleteMemoryMeta,
  getMemoryMeta,
  isMediaStorageNearFull,
  putMemoryMeta,
} from "./mediaStore";
import { toMemory, type Memory, type MemoryMedia } from "./memoryModel";

export interface AddMemoryInput {
  title: string;
  emoji: string;
  date: string;
  story?: string;
  cover?: string;
  media: MemoryMedia[];
}

export interface AddMemoryResult {
  ok: boolean;
  memory?: Memory;
}

/** Локальные дополнения по id воспоминания — загружаются из IndexedDB. */
type ExtrasMap = Record<string, { cover?: string; media: MemoryMedia[] }>;

export function useMemories() {
  const { data, add, update, remove, loading } = useMemoriesApi();
  const [extras, setExtras] = useState<ExtrasMap>({});
  const [storageNearFull, setStorageNearFull] = useState(false);

  /* Подгрузка локальных cover/media для каждого воспоминания из API.
     Появление данных — единственный триггер; экстрас дозагружаются один раз. */
  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    void (async () => {
      const found: ExtrasMap = {};
      await Promise.all(
        data.map(async (view) => {
          const meta = await getMemoryMeta(view.id);
          if (meta && !cancelled) found[view.id] = meta;
        }),
      );
      if (!cancelled) setExtras(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [data]);

  /* Оценка занятости IndexedDB — разово и при добавлении/удалении медиа. */
  useEffect(() => {
    let cancelled = false;
    void isMediaStorageNearFull().then((near) => {
      if (!cancelled) setStorageNearFull(near);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const memories = useMemo<Memory[]>(
    () => (data ?? []).map((view) => toMemory(view, extras[view.id])),
    [data, extras],
  );

  /** Создаёт метаданные на сервере и привязывает локальные cover/media. */
  const addMemory = useCallback(
    async (input: AddMemoryInput): Promise<AddMemoryResult> => {
      const view = await add({
        title: input.title,
        emoji: input.emoji,
        date: input.date,
        story: input.story,
      });
      if (!view) return { ok: false };
      const local = { cover: input.cover, media: input.media };
      await putMemoryMeta(view.id, local);
      setExtras((prev) => ({ ...prev, [view.id]: local }));
      return { ok: true, memory: toMemory(view, local) };
    },
    [add],
  );

  /**
   * Обновляет метаданные (title/emoji/date/story) и/или локальные
   * cover/media. Возвращает false, если серверное обновление не прошло.
   */
  const updateMemory = useCallback(
    async (id: string, patch: Partial<AddMemoryInput>): Promise<boolean> => {
      const { cover, media, ...metaPatch } = patch;
      const hasMeta = Object.keys(metaPatch).length > 0;
      if (hasMeta) {
        const ok = await update(id, metaPatch);
        if (!ok) return false;
      }
      if (cover !== undefined || media !== undefined) {
        const prev = extras[id] ?? { media: [] };
        const next = { cover: cover ?? prev.cover, media: media ?? prev.media };
        await putMemoryMeta(id, next);
        setExtras((p) => ({ ...p, [id]: next }));
      }
      return true;
    },
    [update, extras],
  );

  /** Удаляет локальные Blob-ы, реестр и метаданные на сервере. */
  const deleteMemory = useCallback(
    async (id: string): Promise<boolean> => {
      const local = extras[id];
      const ids = local?.media?.map((m) => m.id) ?? [];
      if (ids.length > 0) {
        try {
          await deleteMediaMany(ids);
        } catch {
          // Blob-ы могут отсутствовать — метаданные всё равно удаляем
        }
      }
      try {
        await deleteMemoryMeta(id);
      } catch {
        // реестр может отсутствовать
      }
      setExtras((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return remove(id);
    },
    [remove, extras],
  );

  return {
    memories,
    addMemory,
    updateMemory,
    deleteMemory,
    storageNearFull,
    loading,
  };
}
