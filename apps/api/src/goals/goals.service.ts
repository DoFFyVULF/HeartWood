import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CoupleService } from '../couple/couple.service.js';
import { CreateGoalDto } from './dto/goals.dto.js';

export interface MilestoneView {
  label: string;
  progress: number;
}

export interface ContributionView {
  userId: string;
  name: string;
  amount: number;
}

export interface GoalView {
  id: string;
  kind: 'trip' | 'home' | 'celebration';
  title: string;
  description: string;
  saved: number;
  target: number;
  /** 0–100, из saved/target. */
  progress: number;
  deadline: string;
  /** Метка последнего вклада («вчера»), если вклад был. */
  updatedAt: string | null;
  milestones: MilestoneView[];
  contributions: ContributionView[];
}

/** Склонение дней: 1 день / 2 дня / 5 дней. */
function pluralDays(n: number): string {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return 'день';
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return 'дня';
  return 'дней';
}

/** Метка «вчера» / «N дней назад» от времени последнего вклада. */
function agoLabel(at: Date): string {
  const days = Math.floor((Date.now() - at.getTime()) / 86_400_000);
  if (days <= 0) return 'сегодня';
  if (days === 1) return 'вчера';
  return `${days} ${pluralDays(days)} назад`;
}

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couple: CoupleService,
  ) {}

  /** Список целей + суммарные счётчики для шапки страницы. */
  async list(userId: string): Promise<{
    goals: GoalView[];
    totalSaved: number;
    totalRemaining: number;
  }> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const goals = await this.prisma.goal.findMany({
      where: { coupleId },
      orderBy: { createdAt: 'asc' },
      include: {
        milestones: { orderBy: { id: 'asc' } },
        contributions: { orderBy: { at: 'desc' }, include: { user: { select: { id: true, name: true } } } },
      },
    });

    const views = goals.map((g) => {
      const saved = g.saved;
      const progress = Math.min(100, Math.round((Math.min(saved, g.target) / Math.max(1, g.target)) * 100));
      // По одному вкладу на участника: сумма по пользователю.
      const perUser = new Map<string, { userId: string; name: string; amount: number }>();
      let lastAt: Date | null = null;
      for (const c of g.contributions) {
        const entry = perUser.get(c.userId) ?? { userId: c.userId, name: c.user.name, amount: 0 };
        entry.amount += c.amount;
        perUser.set(c.userId, entry);
        if (!lastAt || c.at > lastAt) lastAt = c.at;
      }
      return {
        id: g.id,
        kind: g.kind as GoalView['kind'],
        title: g.title,
        description: g.description,
        saved,
        target: g.target,
        progress,
        deadline: g.deadline,
        updatedAt: lastAt ? agoLabel(lastAt) : null,
        milestones: g.milestones.map((m) => ({ label: m.label, progress: m.progress })),
        contributions: [...perUser.values()],
      };
    });

    return {
      goals: views,
      totalSaved: views.reduce((n, g) => n + g.saved, 0),
      totalRemaining: views.reduce((n, g) => n + Math.max(0, g.target - g.saved), 0),
    };
  }

  async create(userId: string, dto: CreateGoalDto): Promise<GoalView> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const goal = await this.prisma.goal.create({
      data: {
        kind: dto.kind,
        title: dto.title.trim(),
        target: dto.target,
        coupleId,
        createdById: userId,
      },
      include: {
        milestones: true,
        contributions: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    const { goals } = await this.list(userId);
    return goals.find((g) => g.id === goal.id)!;
  }

  /** Вклад в копилку: сумма кладётся в общий кошелёк цели. */
  async contribute(userId: string, goalId: string, amount: number): Promise<GoalView> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const goal = await this.prisma.goal.findFirst({ where: { id: goalId, coupleId } });
    if (!goal) throw new NotFoundException('Цель не найдена');

    await this.prisma.$transaction([
      this.prisma.goalContribution.create({
        data: { goalId, userId, amount },
      }),
      this.prisma.goal.update({
        where: { id: goalId },
        data: { saved: goal.saved + amount, updatedAt: new Date() },
      }),
      // Вклад в общую мечту тоже кормит дерево.
      this.prisma.couple.update({
        where: { id: coupleId },
        data: { treePoints: { increment: 1 } },
      }),
    ]);

    const { goals } = await this.list(userId);
    return goals.find((g) => g.id === goalId)!;
  }

  async remove(userId: string, goalId: string): Promise<void> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const goal = await this.prisma.goal.findFirst({ where: { id: goalId, coupleId } });
    if (!goal) throw new NotFoundException('Цель не найдена');
    await this.prisma.goal.delete({ where: { id: goalId } });
  }
}
