"use client";

// Универсальный хук одного серверного ресурса: модульный кэш + подписка.
//
// Тот же паттерн, что в старых хуках localStorage: кэш живёт на уровне
// модуля, поэтому все компоненты страницы (Header, Greeting, бейджи…)
// разделяют ОДИН загруженный ресурс и не делают лишних запросов. Запрос
// уходит при первой подписке, ответ кладётся в кэш и рассылается всем.
//
// Снапшот — стабильная ссылка: пересоздаётся ТОЛЬКО при реальном изменении
// состояния (loading/data/error), иначе useSyncExternalStore увидел бы новую
// ссылку на каждом рендере → бесконечный ререндер.

import { useSyncExternalStore } from "react";

interface ResourceState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ResourceStore<T> {
  snapshot: ResourceState<T>;
  loading: boolean;
  started: boolean;
  fetcher: () => Promise<T>;
  listeners: Set<() => void>;
}

const stores = new Map<string, ResourceStore<unknown>>();

function ensure<T>(key: string, fetcher: () => Promise<T>): ResourceStore<T> {
  let store = stores.get(key) as ResourceStore<T> | undefined;
  if (!store) {
    store = {
      snapshot: { data: null, loading: false, error: null },
      loading: false,
      started: false,
      fetcher,
      listeners: new Set(),
    };
    stores.set(key, store as ResourceStore<unknown>);
  }
  return store;
}

function emit(store: ResourceStore<unknown>): void {
  store.listeners.forEach((listener) => listener());
}

async function load<T>(store: ResourceStore<T>): Promise<void> {
  if (store.loading || store.snapshot.data !== null) return;
  store.loading = true;
  store.snapshot = { data: null, loading: true, error: null };
  emit(store);
  try {
    const data = await store.fetcher();
    store.snapshot = { data, loading: false, error: null };
  } catch (err) {
    store.snapshot = {
      data: null,
      loading: false,
      error: err instanceof Error ? err.message : "Что-то пошло не так",
    };
  } finally {
    store.loading = false;
    emit(store);
  }
}

/** Серверная гидрация всегда пустая — данные приходят только на клиенте. */
const SERVER_SNAPSHOT: ResourceState<never> = { data: null, loading: false, error: null };

export interface Resource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** Перечитать с сервера (сбрасывает кэш и грузит заново). */
  reload: () => void;
}

export function useResource<T>(key: string, fetcher: () => Promise<T>): Resource<T> {
  const store = ensure<T>(key, fetcher);

  const subscribe = (onStoreChange: () => void): (() => void) => {
    store.listeners.add(onStoreChange);
    if (!store.started) {
      store.started = true;
      void load(store);
    }
    return () => store.listeners.delete(onStoreChange);
  };

  const state = useSyncExternalStore(
    subscribe,
    () => store.snapshot,
    () => SERVER_SNAPSHOT,
  );

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    reload: () => {
      store.snapshot = { data: null, loading: false, error: null };
      void load(store);
    },
  };
}

/** Сбросить все кэши — вызывается при logout, чтобы чужие данные не протекали. */
export function clearResourceCache(): void {
  stores.forEach((store) => {
    store.snapshot = { data: null, loading: false, error: null };
    emit(store);
  });
}

/** Перечитать один ресурс по ключу, если он уже подписан (стор создан).
 * Нужен для перезагрузки /world после действий, начисляющих поинты дерева. */
export function refreshResource(key: string): void {
  const store = stores.get(key) as ResourceStore<unknown> | undefined;
  if (!store) return;
  store.snapshot = { data: null, loading: false, error: null };
  void load(store);
}
