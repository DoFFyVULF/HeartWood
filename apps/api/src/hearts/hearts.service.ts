import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { HeartReason } from '../generated/prisma/client.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Границы «сегодня» в локальной таймзоне сервера. */
function todayBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/** MS-таймстамп даты N дней назад (для фильтрации истории). */
function daysAgoMs(days: number): number {
  return new Date().getTime() - days * DAY_MS;
}

/**
 * Личная экономика «сердечек». Баланс ЛИЧНЫЙ: у партнёра нельзя посмотреть
 * чужой баланс. Транзакции — единственный способ менять счёт; знак amount
 * несёт направление (+ заработано, − потрачено).
 *
 * Правила начисления (см. lib/data/hearts.ts → HEART_RULES):
 *   daily +10, memory +15, date +20, coupon_send +5, reaction +3,
 *   streak +25, coupon_redeem −price (расход).
 */
@Injectable()
export class HeartsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Текущий баланс — сумма всех транзакций пользователя. */
  async balance(userId: string): Promise<number> {
    const agg = await this.prisma.heartTx.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    return agg._sum.amount ?? 0;
  }

  /** История за последние 30 дней, свежие сверху. */
  async history(userId: string): Promise<
    Array<{ id: string; reason: HeartReason; amount: number; label: string; ts: number }>
  > {
    const txs = await this.prisma.heartTx.findMany({
      where: { userId, at: { gte: new Date(daysAgoMs(30)) } },
      orderBy: { at: 'desc' },
      select: { id: true, reason: true, amount: true, label: true, at: true },
    });
    return txs.map((tx) => ({ ...tx, ts: tx.at.getTime() }));
  }

  /** Полный кошелёк (баланс + история) — ответ для GET /hearts. */
  async wallet(userId: string): Promise<{ balance: number; history: ReturnType<HeartsService['history']> extends Promise<infer T> ? T : never; canClaimDaily: boolean }> {
    const [balance, history, canClaimDaily] = await Promise.all([
      this.balance(userId),
      this.history(userId),
      this.claimAvailable(userId),
    ]);
    return { balance, history, canClaimDaily };
  }

  /** Зачисление. Возвращает созданную транзакцию. */
  grant(userId: string, reason: HeartReason, amount: number, label: string) {
    return this.prisma.heartTx.create({
      data: { userId, reason, amount, label },
    });
  }

  /**
   * Списание с проверкой баланса — атомарно: проверка и запись в одной
   * транзакции, чтобы два параллельных выкупа не ушли в минус. Возвращает
   * true, если списание произошло.
   */
  async spend(userId: string, amount: number, reason: HeartReason, label: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const agg = await tx.heartTx.aggregate({
        where: { userId },
        _sum: { amount: true },
      });
      const balance = agg._sum.amount ?? 0;
      if (balance < amount) return false;
      await tx.heartTx.create({
        data: { userId, reason, amount: -amount, label },
      });
      return true;
    });
  }

  /** Начислен ли уже ежедневный бонус сегодня (идемпотентность). */
  private async dailyClaimedToday(userId: string): Promise<boolean> {
    const { start } = todayBounds();
    const found = await this.prisma.heartTx.findFirst({
      where: { userId, reason: 'daily', at: { gte: start } },
    });
    return found !== null;
  }

  /** Может ли пользователь получить ежедневный бонус прямо сейчас. */
  claimAvailable(userId: string): Promise<boolean> {
    return this.dailyClaimedToday(userId).then((claimed) => !claimed);
  }

  /**
   * Ежедневный бонус: +10 раз в сутки (по серверному дню). Идемпотентно.
   * Параллельно ведёт серию пары (Couple.streakDays): за каждый активный день
   * — +1; пропуск сбрасывает на 1. Каждый 7-й день пары даёт бонус серии +25.
   */
  async claimDaily(
    userId: string,
    coupleId: string,
  ): Promise<{ claimed: boolean; balance: number; history: Awaited<ReturnType<HeartsService['history']>> }> {
    return this.prisma.$transaction(async (tx) => {
      if (await this.dailyClaimedToday(userId)) {
        const [balance, history] = await Promise.all([
          this.balance(userId),
          this.history(userId),
        ]);
        return { claimed: false, balance, history };
      }

      const couple = await tx.couple.findUnique({
        where: { id: coupleId },
        select: { streakDays: true },
      });
      const streak = couple?.streakDays ?? 1;

      // Пропущен ли вчерашний день → серия сбрасывается.
      const yesterdayStart = new Date(todayBounds().start.getTime() - DAY_MS);
      const yesterdayDaily = await tx.heartTx.findFirst({
        where: {
          reason: 'daily',
          at: { gte: yesterdayStart, lt: todayBounds().start },
          user: { coupleId },
        },
        select: { id: true },
      });
      const nextStreak = yesterdayDaily ? streak + 1 : 1;
      await tx.couple.update({
        where: { id: coupleId },
        data: { streakDays: nextStreak, treePoints: { increment: 1 } },
      });

      await tx.heartTx.create({
        data: { userId, reason: 'daily', amount: 10, label: 'Ежедневный вход' },
      });

      // Каждый 7-й день серии — бонус «Серия дней».
      if (nextStreak % 7 === 0) {
        await tx.heartTx.create({
          data: { userId, reason: 'streak', amount: 25, label: 'Серия дней' },
        });
      }

      const [balance, history] = await Promise.all([
        this.balance(userId),
        this.history(userId),
      ]);
      return { claimed: true, balance, history };
    });
  }
}
