import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/* ═══════════════════════════════════════════════════════════════════════════
   <TreeService /> — рост общего дерева пары.

   Дерево — общее у двух половинок: обе своими действиями капают поинты в
   Couple.treePoints (award), а состояние дерева (вид, стадия, прогресс,
   сезон, время суток, настроение) вычисляется чисто из накопленных поинтов
   и текущей даты (state). Так каждый видит ОДНО дерево, но разное небо:
   сезон и время суток у всех одинаковые, а настроение погоды — от второй
   половинки (у каждого участника своё настроение).

   Вид дерева по уровню (спека):
     0  Семечко    — холмик с семечком, дерева ещё нет
     1  Дуб        (oak)
     2  Берёза     (birch)
     3  Ива        (willow)
     4  Сосна      (pine)
     5  Сакура     (sakura) — вершина
   ═══════════════════════════════════════════════════════════════════════════ */

export type TreeSpecies = 'oak' | 'birch' | 'willow' | 'pine' | 'sakura';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type TreeMood = 'clear' | 'rain' | 'storm' | 'rainbow' | 'moonlight';

export interface TreeState {
  /** Есть ли вторая половинка (в паре два участника). */
  hasPartner: boolean;
  /** 0..5 — стадия роста, 0 — семечко, 5 — сакура (вершина). */
  level: number;
  /** 0..1 — прогресс внутри стадии. */
  levelProgress: number;
  /** Вид дерева; null на стадии 0 (семечко). */
  species: TreeSpecies | null;
  /** «Дуб», «Берёза»…, на стадии 0 — «Семечко». */
  speciesLabel: string;
  /** Эмодзи вида (для чипов и прогресса). */
  speciesEmoji: string;
  season: Season;
  timeOfDay: TimeOfDay;
  /** Настроение погоды — производное от настроения второй половинки. */
  mood: TreeMood;
  /** Имя следующей стадии («Росток»), null на максимуме. */
  nextSpeciesLabel: string | null;
  /** Сколько поинтов не хватает до следующей стадии. */
  pointsToNext: number;
}

/** Стадии 0..5: id вида в LivingTree, человеческая подпись, эмодзи.
 * Каждая стадия — новый вид (спека): Семечко → Дуб → Берёза → Ива → Сосна →
 * Сакура. Вершина — Сакура. */
const STAGES: Array<{ id: TreeSpecies | null; label: string; emoji: string }> = [
  { id: null, label: 'Семечко', emoji: '🌰' },
  { id: 'oak', label: 'Дуб', emoji: '🌳' },
  { id: 'birch', label: 'Берёза', emoji: '🕊️' },
  { id: 'willow', label: 'Ива', emoji: '🌿' },
  { id: 'pine', label: 'Сосна', emoji: '🌲' },
  { id: 'sakura', label: 'Сакура', emoji: '🌸' },
];
const MAX_LEVEL = STAGES.length - 1;

/** Поинтов на один уровень — «сходили на свидание» = 1 поинт. */
export const POINTS_PER_LEVEL = 8;

/** Настроение участника (User.mood, id из каталога MOODS) → погода дерева. */
const MOOD_TO_TREE: Record<string, TreeMood> = {
  overjoyed: 'rainbow',
  great: 'clear',
  good: 'clear',
  okay: 'clear',
  calm: 'moonlight',
  tired: 'rain',
  down: 'storm',
};
const DEFAULT_MOOD: TreeMood = 'clear';

/** Сезон по календарной дате: зима дек–фев, весна мар–май, лето июн–авг. */
export function seasonFor(d: Date): Season {
  const m = d.getMonth();
  if (m === 11 || m <= 1) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'autumn';
}

/** Время суток по часу: рассвет 5–8, день 9–16, закат 17–20, ночь 21–4. */
export function timeOfDayFor(d: Date): TimeOfDay {
  const h = d.getHours();
  if (h >= 5 && h <= 8) return 'dawn';
  if (h >= 9 && h <= 16) return 'day';
  if (h >= 17 && h <= 20) return 'dusk';
  return 'night';
}

@Injectable()
export class TreeService {
  constructor(private readonly prisma: PrismaService) {}

  /** Начислить поинты роста дереву пары (общее дерево обоих). */
  async award(coupleId: string, points: number): Promise<void> {
    if (points <= 0) return;
    await this.prisma.couple.update({
      where: { id: coupleId },
      data: { treePoints: { increment: points } },
    });
  }

  /**
   * Полное состояние дерева из накопленных поинтов и контекста пары.
   * Партнёр приходит извне (резолвится в CoupleService.context), чтобы не
   * тянуть сюда зависимости пары — сезон/время суток от серверного «сейчас».
   */
  state(input: {
    points: number;
    hasPartner: boolean;
    partnerMood: string | null;
  }, now: Date = new Date()): TreeState {
    const points = Math.max(0, Math.floor(input.points));
    const level = Math.min(MAX_LEVEL, Math.floor(points / POINTS_PER_LEVEL));
    const levelProgress = (points % POINTS_PER_LEVEL) / POINTS_PER_LEVEL;
    const stage = STAGES[level];
    const next = level < MAX_LEVEL ? STAGES[level + 1] : null;

    return {
      hasPartner: input.hasPartner,
      level,
      levelProgress,
      species: stage.id,
      speciesLabel: stage.label,
      speciesEmoji: stage.emoji,
      season: seasonFor(now),
      timeOfDay: timeOfDayFor(now),
      mood: input.partnerMood ? (MOOD_TO_TREE[input.partnerMood] ?? DEFAULT_MOOD) : DEFAULT_MOOD,
      nextSpeciesLabel: next ? next.label : null,
      pointsToNext: level < MAX_LEVEL ? POINTS_PER_LEVEL - (points % POINTS_PER_LEVEL) : 0,
    };
  }
}
