"use client";

// Авторизация: хранит JWT-токен (localStorage/sessionStorage), на старте
// подтягивает /auth/me и раскрывает текущего пользователя и его пару.
// Guard-ы ниже превращают состояние в редиректы:
//   RequireAuth        — (world): без пользователя → /login
//   RedirectIfAuthed   — (auth):  залогинен → /  (мир)

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { api, clearToken, getToken, setToken } from "@/lib/api";
import { clearResourceCache } from "@/lib/useResource";
import type { PublicCouple, PublicUser, RegisterInput } from "@/lib/types";

interface RegisterResult {
  /** Код НОВОЙ пары — регистрация первой половинки (см. страницу register). */
  coupleCode?: string;
}

interface AuthContextValue {
  user: PublicUser | null;
  couple: PublicCouple | null;
  /** Первая проверка завершена: /auth/me попытались или токена не было. */
  ready: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (input: RegisterInput, remember: boolean) => Promise<RegisterResult>;
  logout: () => void;
  /** Перечитать /auth/me (после обновления профиля/настроения). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  couple: null,
  ready: false,
  login: async () => {},
  register: async () => ({}),
  logout: () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [couple, setCouple] = useState<PublicCouple | null>(null);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setReady(true);
      return;
    }
    try {
      const res = await api.me();
      setUser(res.user);
      setCouple(res.couple);
    } catch {
      // 401 → токен протух/невалиден; request() уже почистил его.
      setUser(null);
      setCouple(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const res = await api.login({ email, password });
    setToken(res.token, remember);
    clearResourceCache();
    setUser(res.user);
    setCouple(res.couple);
    setReady(true);
  }, []);

  const register = useCallback(
    async (input: RegisterInput, remember: boolean): Promise<RegisterResult> => {
      const res = await api.register(input);
      setToken(res.token, remember);
      // Новая пара: не логиним контекст — страница показывает код, чтобы
      // позвать вторую половинку (guard (auth) не должен редиректить).
      // Переход в мир подтянет /auth/me по токену.
      if (!res.coupleCode) {
        setUser(res.user);
        setCouple(res.couple);
      }
      setReady(true);
      return { coupleCode: res.coupleCode };
    },
    [],
  );

  const logout = useCallback(() => {
    clearToken();
    clearResourceCache();
    setUser(null);
    setCouple(null);
    setReady(true);
  }, []);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return (
    <AuthContext.Provider value={{ user, couple, ready, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

// ─── Guard-ы ─────────────────────────────────────────────────────────────

/** (world): ждём первую проверку, потом либо мир, либо /login. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <AuthLoading />;
  if (!user) redirect("/login");
  return <>{children}</>;
}

/**
 * (auth): залогинен — в мир. Не блокируем первую проверку: форма рендерится
 * сразу (в т.ч. в SSR-разметке), а редирект происходит, как только /auth/me
 * вернёт пользователя (или не вернёт — и форма просто остаётся).
 */
export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) redirect("/");
  return <>{children}</>;
}

/** Короткий спиннер на время первой проверки auth. */
function AuthLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-(--hwd-bg)">
      <div className="flex items-center gap-3 text-(--hwd-ink-soft)">
        <span
          aria-hidden
          className="size-5 animate-spin rounded-full border-[3px] border-white/40 border-t-white"
        />
        <span className="text-sm font-bold">Загружаем ваш мир…</span>
      </div>
    </div>
  );
}
