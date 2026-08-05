"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import { findMood, type MoodOption } from "@/lib/moods";

interface MoodContextValue {
  /**
   * Текущее настроение пользователя. null — ещё не выбрано: компоненты
   * показывают базовое настроение из liveliness.ts.
   */
  mood: MoodOption | null;
  /** Выставить настроение по id из MOODS. */
  setMood: (id: string) => void;
}

const MoodContext = createContext<MoodContextValue>({
  mood: null,
  setMood: () => {},
});

const STORAGE_KEY = "heartwood.mood";
const CHANGE_EVENT = "heartwood:mood-change";

function readStoredMood(): MoodOption | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? findMood(stored) : null;
  } catch {
    return null;
  }
}

// Текущее настроение живёт в localStorage (возвращаешься — остаётся «твой»)
// и синхронизируется между вкладками; useSyncExternalStore не пишет состояние
// внутри эффекта. Тот же паттерн, что у GenderProvider в lib/theme.tsx.
export function MoodProvider({ children }: { children: React.ReactNode }) {
  const mood = useSyncExternalStore(
    (onChange) => {
      window.addEventListener(CHANGE_EVENT, onChange);
      return () => window.removeEventListener(CHANGE_EVENT, onChange);
    },
    readStoredMood,
    () => null // getServerSnapshot — на сервере настроения нет, SSR-safe
  );

  const setMood = useCallback((next: string) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // private mode / storage unavailable — просто не сохранится
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return (
    <MoodContext.Provider value={{ mood, setMood }}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood(): MoodContextValue {
  return useContext(MoodContext);
}
