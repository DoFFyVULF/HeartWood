"use client";

// Хуки ресурсов поверх useResource: мир, пара, свидания, сердечки и все
// коллекции (воспоминания, купоны, цели, события, желания). Каждый —
// модульный кэш, общий для всех компонентов страницы: Header и главная
// читают один загруженный /world без повторных запросов.

import { useCallback } from "react";
import { api } from "@/lib/api";
import { useResource, refreshResource, type Resource } from "@/lib/useResource";

/**
 * Перечитать /world после действия, начисляющего поинты дерева (свидание,
 * выкуп купона, клейм, взнос в цель…). Кэш мира живёт на уровне модуля,
 * поэтому без этого главная показала бы застарелый прогресс до перезагрузки
 * страницы. Срабатывает только если мир уже подписан (его стор создан).
 */
function refreshWorld(): void {
  refreshResource("world");
}
import type {
  CouponView,
  CoupleProfile,
  DatesView,
  EventView,
  GoalsResponse,
  HeartWallet,
  LetterView,
  MemoryView,
  WishView,
  WorldView,
} from "@/lib/types";

/** Агрегат главной «Ваш мир» — приветствие, спутники, история, статистика. */
export function useWorld(): Resource<WorldView> {
  return useResource<WorldView>("world", () => api.world());
}

/** Профиль пары с живостью участников — для /profile и шапки. */
export function useCouple(): Resource<CoupleProfile> {
  return useResource<CoupleProfile>("couple", () => api.couple());
}

/** Агрегат страницы свиданий — счётчики, топы, история. */
export function useDates(): Resource<DatesView> {
  return useResource<DatesView>("dates", () => api.dates());
}

/** Кошелёк сердечек: баланс + история + ежедневный бонус. */
export function useHearts(): Resource<HeartWallet> & {
  claimDaily: () => Promise<void>;
} {
  const resource = useResource<HeartWallet>("hearts", () => api.hearts());

  const claimDaily = useCallback(async () => {
    await api.claimDaily();
    resource.reload();
    refreshWorld();
  }, [resource]);

  return { ...resource, claimDaily };
}

// ─── Коллекции ────────────────────────────────────────────────────────────

/** Купонная книжка: активные, погашенные и черновики. */
export function useCoupons(): Resource<CouponView[]> & {
  create: (input: {
    emoji: string;
    title: string;
    description: string;
    price: number;
  }) => Promise<boolean>;
  send: (id: string, recipientId: string) => Promise<boolean>;
  redeem: (id: string) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
} {
  const resource = useResource<CouponView[]>("coupons", () => api.coupons());

  const create = useCallback(
    async (input: {
      emoji: string;
      title: string;
      description: string;
      price: number;
    }) => {
      try {
        await api.createCoupon(input);
        resource.reload();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  const send = useCallback(
    async (id: string, recipientId: string) => {
      try {
        await api.sendCoupon(id, recipientId);
        resource.reload();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  const redeem = useCallback(
    async (id: string) => {
      try {
        await api.redeemCoupon(id);
        resource.reload();
        refreshWorld();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await api.deleteCoupon(id);
        resource.reload();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  return { ...resource, create, send, redeem, remove };
}

/** Копилки целей: цели + сколько всего накоплено / осталось. */
export function useGoals(): Resource<GoalsResponse> & {
  contribute: (id: string, amount: number) => Promise<boolean>;
  create: (input: { kind: "trip" | "home" | "celebration"; title: string; target: number }) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
} {
  const resource = useResource<GoalsResponse>("goals", () => api.goals());

  const contribute = useCallback(
    async (id: string, amount: number) => {
      try {
        await api.contributeGoal(id, amount);
        resource.reload();
        refreshWorld();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  const create = useCallback(
    async (input: {
      kind: "trip" | "home" | "celebration";
      title: string;
      target: number;
    }) => {
      try {
        await api.createGoal(input);
        resource.reload();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await api.deleteGoal(id);
        resource.reload();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  return { ...resource, contribute, create, remove };
}

/** Календарь пары: события и важные даты. */
export function useEvents(): Resource<EventView[]> & {
  create: (input: { kind: "date" | "anniversary" | "milestone"; title: string; date: string }) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
} {
  const resource = useResource<EventView[]>("events", () => api.events());

  const create = useCallback(
    async (input: {
      kind: "date" | "anniversary" | "milestone";
      title: string;
      date: string;
    }) => {
      try {
        await api.createEvent(input);
        resource.reload();
        // Свидание (kind=date) — живое действие пары: дерево получает +1.
        if (input.kind === "date") refreshWorld();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await api.deleteEvent(id);
        resource.reload();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  return { ...resource, create, remove };
}

/** Список желаний: мечты пары с игровой механикой подарков. */
export function useWishlist(): Resource<WishView[]> & {
  add: (input: { title: string; description?: string; wisherId: string }) => Promise<boolean>;
  claim: (id: string) => Promise<boolean>;
  unclaim: (id: string) => Promise<boolean>;
  fulfill: (id: string) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
} {
  const resource = useResource<WishView[]>("wishes", () => api.wishes());

  const add = useCallback(
    async (input: { title: string; description?: string; wisherId: string }) => {
      try {
        await api.createWish(input);
        resource.reload();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  const claim = useCallback(
    async (id: string) => {
      try {
        await api.claimWish(id);
        resource.reload();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  const unclaim = useCallback(
    async (id: string) => {
      try {
        await api.unclaimWish(id);
        resource.reload();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  const fulfill = useCallback(
    async (id: string) => {
      try {
        await api.fulfillWish(id);
        resource.reload();
        refreshWorld();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await api.deleteWish(id);
        resource.reload();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  return { ...resource, add, claim, unclaim, fulfill, remove };
}

/** Воспоминания: метаданные из API, медиа остаются локально (IndexedDB).
 * add возвращает созданное воспоминание (нужен id, чтобы привязать локальные
 * медиа), а не boolean, как у остальных коллекций. */
export function useMemories(): Resource<MemoryView[]> & {
  add: (input: { title: string; emoji: string; date: string; story?: string }) => Promise<MemoryView | null>;
  update: (id: string, patch: Partial<{ title: string; emoji: string; date: string; story?: string }>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
} {
  const resource = useResource<MemoryView[]>("memories", () => api.memories());

  const add = useCallback(
    async (input: { title: string; emoji: string; date: string; story?: string }) => {
      try {
        const view = await api.createMemory(input);
        resource.reload();
        refreshWorld();
        return view;
      } catch {
        return null;
      }
    },
    [resource],
  );

  const update = useCallback(
    async (
      id: string,
      patch: Partial<{ title: string; emoji: string; date: string; story?: string }>,
    ) => {
      try {
        await api.updateMemory(id, patch);
        resource.reload();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await api.deleteMemory(id);
        resource.reload();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  return { ...resource, add, update, remove };
}

/** Почта пары: все письма (входящие и исходящие) из Студии письма.
 * В отличие от остальных коллекций, read/markRead не сбрасывают кэш сразу —
 * почта в шапке обновляет письмо локально, чтобы читалка не закрывалась. */
export function useLetters(): Resource<LetterView[]> & {
  send: (input: {
    message: string;
    ps?: string;
    paper: string;
    seal: string;
    stamp: string;
  }) => Promise<boolean>;
  markRead: (id: string) => Promise<boolean>;
} {
  const resource = useResource<LetterView[]>("letters", () => api.letters());

  const send = useCallback(
    async (input: {
      message: string;
      ps?: string;
      paper: string;
      seal: string;
      stamp: string;
    }) => {
      try {
        await api.sendLetter(input);
        resource.reload();
        refreshWorld();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  const markRead = useCallback(
    async (id: string) => {
      try {
        await api.readLetter(id);
        resource.reload();
        return true;
      } catch {
        return false;
      }
    },
    [resource],
  );

  return { ...resource, send, markRead };
}
