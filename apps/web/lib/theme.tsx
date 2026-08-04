"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";

export type Gender = "boy" | "girl";

interface GenderContextValue {
  gender: Gender | null;
  setGender: (gender: Gender) => void;
}

const GenderContext = createContext<GenderContextValue>({
  gender: null,
  setGender: () => {},
});

const STORAGE_KEY = "heartwood.gender";
const CHANGE_EVENT = "heartwood:gender-change";

function readStoredGender(): Gender | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "boy" || stored === "girl" ? stored : null;
  } catch {
    return null;
  }
}

// The chosen gender tints the whole world. It lives in localStorage so
// returning visitors land straight back on "their" palette; useSyncExternalStore
// keeps the value in sync without writing state inside an effect.
export function GenderProvider({ children }: { children: React.ReactNode }) {
  const gender = useSyncExternalStore(
    (onChange) => {
      window.addEventListener(CHANGE_EVENT, onChange);
      return () => window.removeEventListener(CHANGE_EVENT, onChange);
    },
    readStoredGender,
    () => null // getServerSnapshot — always neutral on the server
  );

  const setGender = useCallback((next: Gender) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // private mode / storage unavailable — neutral theme is fine
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return (
    <GenderContext.Provider value={{ gender, setGender }}>
      {children}
    </GenderContext.Provider>
  );
}

export function useGender(): GenderContextValue {
  return useContext(GenderContext);
}
