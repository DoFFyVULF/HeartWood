import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CoupleService } from '../couple/couple.service.js';
import { TreeService, type TreeState } from '../tree/tree.service.js';

/** Эмодзи-метки настроений — дубликат каталога MOODS из lib/data/moods.ts. */
const MOOD_LABEL: Record<string, string> = {
  overjoyed: 'в прекрасном настроении',
  great: 'в отличном настроении',
  good: 'в хорошем настроении',
  okay: 'в порядке',
  calm: 'спокойно',
  tired: 'устал немного',
  down: 'грустновато',
};

/** Тип иконки спутника/события/статистики — совпадает с WorldIcon на фронте. */
type WorldIcon =
  | 'memory'
  | 'mood'
  | 'date'
  | 'surprise'
  | 'goal'
  | 'coupon'
  | 'flame'
  | 'heart'
  | 'photo';

export interface Satellite {
  key: string;
  icon: WorldIcon;
  label: string;
  status: string;
  path?: string;
  urgent?: boolean;
  badge?: string;
  progress?: number;
}

export interface WorldView {
  couple: string;
  streak: number;
  tree: TreeState;
  greeting: string;
  satellites: Satellite[];
  history: Array<{ icon: WorldIcon; text: string; time: string }>;
  stats: Array<{ icon: WorldIcon; value: string; label: string }>;
}

const DAY_MS = 86_400_000;

function startOfToday(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function agoLabel(at: Date): string {
  const days = Math.floor((Date.now() - at.getTime()) / DAY_MS);
  if (days <= 0) return 'сегодня';
  if (days === 1) return 'вчера';
  const n10 = days % 10;
  const n100 = days % 100;
  const noun =
    n10 === 1 && n100 !== 11 ? 'день' : n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14) ? 'дня' : 'дней';
  return `${days} ${noun} назад`;
}

/** «Сб, 2 авг» — короткая метка даты. */
function shortDate(d: Date): string {
  const s = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/\.$/, '');
}

function greetingFor(hour: number, coupleName: string): string {
  if (hour >= 5 && hour < 11) return `Доброе утро, ${coupleName}`;
  if (hour >= 11 && hour < 17) return `Добрый день, ${coupleName}`;
  if (hour >= 17 && hour < 23) return `Добрый вечер, ${coupleName}`;
  return `Доброй ночи, ${coupleName}`;
}

@Injectable()
export class WorldService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couple: CoupleService,
    private readonly tree: TreeService,
  ) {}

  async view(userId: string): Promise<WorldView> {
    const { me, couple } = await this.couple.context(userId);
    const coupleId = couple.id;
    const partner = couple.members.find((m) => m.id !== me.id) ?? me;

    // Параллельно собираем срезы данных пары.
    const [memories, coupons, events, goals, wishes] = await Promise.all([
      this.prisma.memory.findMany({ where: { coupleId }, orderBy: [{ date: 'desc' }, { createdAt: 'desc' }] }),
      this.prisma.coupon.findMany({
        where: { coupleId },
        orderBy: { createdAt: 'desc' },
        include: { recipient: { select: { id: true } } },
      }),
      this.prisma.event.findMany({
        where: { coupleId },
        include: { createdBy: { select: { id: true, name: true, gender: true } } },
      }),
      this.prisma.goal.findMany({ where: { coupleId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.wish.findMany({ where: { coupleId }, orderBy: { createdAt: 'desc' } }),
    ]);

    const today = startOfToday();
    const activeCoupons = coupons.filter((c) => c.status === 'active');
    const upcomingDates = events
      .filter((e) => e.kind === 'date' && e.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    const mySurprise = activeCoupons.find((c) => c.recipientId === me.id);
    const latestMemory = memories[0];

    // Дерево пары — растёт из накопленных поинтов (за действия обеих половинок).
    const tree = this.tree.state({
      points: couple.treePoints,
      hasPartner: couple.members.length >= 2,
      partnerMood: partner === me ? null : (partner.mood ?? null),
    });

    // ── Спутники ───────────────────────────────────────────────
    const satellites: Satellite[] = [
      {
        key: 'memories',
        icon: 'memory',
        label: 'Воспоминания',
        status: latestMemory ? latestMemory.title : 'Здесь появятся воспоминания',
        path: '/memories',
      },
      {
        key: 'mood',
        icon: 'mood',
        label: 'Настроение',
        status: partner.mood ? `${partner.name} ${MOOD_LABEL[partner.mood] ?? 'в порядке'}` : 'Поделитесь настроением',
      },
      {
        key: 'dates',
        icon: 'date',
        label: 'Свидания',
        status: upcomingDates[0] ? shortDate(upcomingDates[0].date) : 'Спланируйте свидание',
        path: '/dates',
        badge: upcomingDates.length > 0 ? String(upcomingDates.length) : undefined,
      },
    ];

    if (mySurprise) {
      satellites.push({
        key: 'surprise',
        icon: 'surprise',
        label: 'Сюрприз',
        status: 'Тебя ждёт сюрприз',
        urgent: true,
        path: '/coupons',
      });
    }

    const topGoal = [...goals].sort((a, b) => b.saved / Math.max(1, b.target) - a.saved / Math.max(1, a.target))[0];
    satellites.push({
      key: 'goals',
      icon: 'goal',
      label: 'Цели',
      status: topGoal ? topGoal.title : 'Поставьте первую цель',
      path: '/goals',
      progress: topGoal ? Math.min(100, Math.round((Math.min(topGoal.saved, topGoal.target) / Math.max(1, topGoal.target)) * 100)) : undefined,
    });
    satellites.push({
      key: 'coupons',
      icon: 'coupon',
      label: 'Купоны',
      status: activeCoupons.length > 0 ? `${activeCoupons.length} активных купона` : 'Создайте купон',
      path: '/coupons',
      badge: activeCoupons.length > 0 ? String(activeCoupons.length) : undefined,
    });

    // ── Недавняя история: свежие действия, серия всегда первой. ──
    interface Item {
      icon: WorldIcon;
      text: string;
      ts: number;
    }
    const items: Item[] = [];
    for (const m of memories) {
      const author = couple.members.find((u) => u.id === m.createdById);
      if (author) {
        const verb = author.gender === 'girl' ? 'добавила' : 'добавил';
        items.push({ icon: 'memory', text: `${author.name} ${verb} воспоминание «${m.title}»`, ts: m.createdAt.getTime() });
      }
    }
    for (const c of coupons) {
      const author = couple.members.find((u) => u.id === c.createdById);
      if (author && c.status !== 'draft') {
        const verb = author.gender === 'girl' ? (c.status === 'redeemed' ? 'выкупила' : 'отправила') : c.status === 'redeemed' ? 'выкупил' : 'отправил';
        items.push({ icon: 'coupon', text: `${author.name} ${verb} купон «${c.title}»`, ts: c.createdAt.getTime() });
      }
    }
    for (const e of events) {
      const author = e.createdBy;
      if (author && e.kind === 'date') {
        const verb = author.gender === 'girl' ? 'планирует' : 'планирует';
        items.push({ icon: 'date', text: `${author.name} ${verb} свидание «${e.title}»`, ts: e.createdAt.getTime() });
      }
    }
    items.sort((a, b) => b.ts - a.ts);

    const history: WorldView['history'] = [
      { icon: 'flame', text: `День ${couple.streakDays} вместе`, time: 'сегодня' },
      ...items.slice(0, 4).map((i) => ({ icon: i.icon, text: i.text, time: agoLabel(new Date(i.ts)) })),
    ];

    // ── Статистика ─────────────────────────────────────────────
    const stats: WorldView['stats'] = [
      { icon: 'flame', value: String(couple.streakDays), label: 'дней вместе' },
      { icon: 'photo', value: String(memories.length), label: 'воспоминаний' },
      { icon: 'date', value: String(events.filter((e) => e.kind === 'date' && e.date <= today).length), label: 'свидания' },
      { icon: 'coupon', value: String(coupons.length), label: 'купонов' },
    ];

    return {
      couple: couple.coupleName,
      streak: couple.streakDays,
      tree,
      greeting: greetingFor(new Date().getHours(), couple.coupleName),
      satellites,
      history,
      stats,
    };
  }
}
