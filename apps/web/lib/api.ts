"use client";

// Fetch-клиент к API HeartWood. Единое место, где ходим в сеть:
// базовый URL, авторизация по JWT, типизированные ответы, разбор ошибок.
//
// Токен живёт в localStorage («Запомнить меня») или sessionStorage (вход
// на один заход). Читаем из обоих — приоритет у sessionStorage, чтобы
// «гостевая» сессия не вытеснялась старым «запомненным» токеном.

import type {
  AuthResult,
  CoupleProfile,
  CouponView,
  CreateCouponInput,
  CreateEventInput,
  CreateGoalInput,
  CreateMemoryInput,
  CreateWishInput,
  CreateLetterInput,
  DatesView,
  EventView,
  GoalView,
  GoalsResponse,
  HeartTx,
  HeartWallet,
  LetterView,
  LoginInput,
  MemoryView,
  PublicCouple,
  PublicUser,
  RegisterInput,
  UpdateMeInput,
  WishView,
  WorldView,
} from "@/lib/types";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

const TOKEN_KEY = "heartwood.token";

// ─── Управление токеном ──────────────────────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.sessionStorage.getItem(TOKEN_KEY) ??
      window.localStorage.getItem(TOKEN_KEY)
    );
  } catch {
    return null;
  }
}

export function setToken(token: string, remember: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (remember) {
      window.localStorage.setItem(TOKEN_KEY, token);
      window.sessionStorage.removeItem(TOKEN_KEY);
    } else {
      window.sessionStorage.setItem(TOKEN_KEY, token);
      window.localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // private mode / storage недоступен — сессия всё равно живёт в памяти
  }
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // нечего чистить
  }
}

// ─── Ошибки ──────────────────────────────────────────────────────────────

/** Ошибка API: статус + человеческое сообщение (из тела ответа Nest). */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const STATUS_TEXT: Record<number, string> = {
  400: "Что-то пошло не так — проверьте данные",
  401: "Нужно войти заново",
  403: "У вас нет прав на это действие",
  404: "Не найдено",
  409: "Конфликт — похоже, такие данные уже есть",
  0: "Не удалось связаться с сервером",
};

/** Публичные пути auth — на их 401 не чистим токен. */
const PUBLIC_PATHS = new Set(["/auth/login", "/auth/register"]);

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Человеческое сообщение из тела ошибки Nest ({ message: string | string[] }). */
function errorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const m = (data as { message?: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
    if (Array.isArray(m) && m.length > 0) return m.join(". ");
  }
  return STATUS_TEXT[status] ?? "Что-то пошло не так";
}

// ─── Базовый запрос ──────────────────────────────────────────────────────

export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, STATUS_TEXT[0]);
  }

  if (res.status === 204) return undefined as T;

  const raw = await res.text();
  const data = raw ? safeJson(raw) : undefined;

  if (!res.ok) {
    // Протухший/невалидный токен — выкидываем, чтобы guard вернул на /login.
    if (res.status === 401 && !PUBLIC_PATHS.has(path)) clearToken();
    throw new ApiError(res.status, errorMessage(data, res.status));
  }

  return data as T;
}

// ─── Методы по эндпоинтам ────────────────────────────────────────────────

export const api = {
  // Auth
  login: (body: LoginInput) =>
    request<AuthResult>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  register: (body: RegisterInput) =>
    request<AuthResult>("/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  me: () => request<{ user: PublicUser; couple: PublicCouple }>("/auth/me"),
  updateMe: (body: UpdateMeInput) =>
    request<{ user: PublicUser }>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  // Пара и агрегаты
  couple: () => request<CoupleProfile>("/couple"),
  joinCouple: (body: { code: string }) =>
    request<{ user: PublicUser; couple: PublicCouple }>("/couple/join", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  world: () => request<WorldView>("/world"),
  dates: () => request<DatesView>("/dates"),

  // Сердечки
  hearts: () => request<HeartWallet>("/hearts"),
  claimDaily: () =>
    request<{ claimed: boolean; balance: number; history: HeartTx[] }>(
      "/hearts/claim-daily",
      { method: "POST" },
    ),

  // Воспоминания
  memories: () => request<MemoryView[]>("/memories"),
  createMemory: (body: CreateMemoryInput) =>
    request<MemoryView>("/memories", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateMemory: (id: string, body: Partial<CreateMemoryInput>) =>
    request<MemoryView>(`/memories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteMemory: (id: string) =>
    request<void>(`/memories/${id}`, { method: "DELETE" }),

  // Купоны
  coupons: () => request<CouponView[]>("/coupons"),
  createCoupon: (body: CreateCouponInput) =>
    request<CouponView>("/coupons", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  sendCoupon: (id: string, recipientId: string) =>
    request<CouponView>(`/coupons/${id}/send`, {
      method: "POST",
      body: JSON.stringify({ recipientId }),
    }),
  redeemCoupon: (id: string) =>
    request<CouponView>(`/coupons/${id}/redeem`, { method: "POST" }),
  deleteCoupon: (id: string) =>
    request<void>(`/coupons/${id}`, { method: "DELETE" }),

  // Цели
  goals: () => request<GoalsResponse>("/goals"),
  createGoal: (body: CreateGoalInput) =>
    request<GoalView>("/goals", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  contributeGoal: (id: string, amount: number) =>
    request<GoalView>(`/goals/${id}/contribute`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
  deleteGoal: (id: string) => request<void>(`/goals/${id}`, { method: "DELETE" }),

  // Календарь
  events: () => request<EventView[]>("/events"),
  createEvent: (body: CreateEventInput) =>
    request<EventView>("/events", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteEvent: (id: string) =>
    request<void>(`/events/${id}`, { method: "DELETE" }),

  // Желания
  wishes: () => request<WishView[]>("/wishes"),
  createWish: (body: CreateWishInput) =>
    request<WishView>("/wishes", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  claimWish: (id: string) =>
    request<WishView>(`/wishes/${id}/claim`, { method: "POST" }),
  unclaimWish: (id: string) =>
    request<WishView>(`/wishes/${id}/unclaim`, { method: "POST" }),
  fulfillWish: (id: string) =>
    request<WishView>(`/wishes/${id}/fulfill`, { method: "POST" }),
  deleteWish: (id: string) =>
    request<void>(`/wishes/${id}`, { method: "DELETE" }),

  // Письма (Студия письма → почта в шапке)
  letters: () => request<LetterView[]>("/letters"),
  sendLetter: (body: CreateLetterInput) =>
    request<LetterView>("/letters", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  readLetter: (id: string) =>
    request<LetterView>(`/letters/${id}/read`, { method: "POST" }),
};
