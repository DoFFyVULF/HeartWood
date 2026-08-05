import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CoupleService } from '../couple/couple.service.js';

/** Форматы свиданий — эмодзи и подписи для топов. */
const DATE_TYPES: Record<string, { emoji: string; label: string }> = {
  picnic: { emoji: '🧺', label: 'Пикники' },
  coffee: { emoji: '☕', label: 'Кофейни' },
  cinema: { emoji: '🎬', label: 'Кино' },
  walk: { emoji: '🚶', label: 'Прогулки' },
  craft: { emoji: '🎨', label: 'Мастер-классы' },
  home: { emoji: '🏠', label: 'Домашние ужины' },
  nature: { emoji: '🌿', label: 'На природе' },
  themed: { emoji: '🎭', label: 'Тематические' },
};

export interface DatesView {
  couple: string;
  total: number;
  inviteScore: Record<string, number>;
  hoursTogether: number;
  bestStreak: number;
  favoriteSpot: string | null;
  /** Средняя оценка «4,9» (запятая, 1 знак). */
  averageRating: string;
  topTypes: Array<{ emoji: string; label: string; count: number }>;
  history: Array<{ emoji: string; text: string; who: string | null; when: string }>;
}

function shortDate(d: Date): string {
  const s = d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/\.$/, '');
}

/** Средняя оценка → «4,9». */
function formatRating(rating: number): string {
  return (Math.round(rating * 10) / 10).toLocaleString('ru-RU', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

@Injectable()
export class DatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couple: CoupleService,
  ) {}

  async view(userId: string): Promise<DatesView> {
    const { couple } = await this.couple.context(userId);
    // Статистика свиданий — только прошедшие (встреча случилась). Будущие
    // «Кино на крыше» в счётчиках не участвуют, только в календаре.
    const dates = await this.prisma.event.findMany({
      where: { coupleId: couple.id, kind: 'date', date: { lte: new Date() } },
      orderBy: { date: 'asc' },
      include: { invitedBy: { select: { id: true, name: true, gender: true } } },
    });

    // ── Счётчики ────────────────────────────────────────────────
    const inviteScore: Record<string, number> = { shared: 0 };
    const bySpot = new Map<string, number>();
    let hoursTogether = 0;
    const ratings: number[] = [];
    for (const d of dates) {
      if (d.invitedBy) {
        inviteScore[d.invitedBy.id] = (inviteScore[d.invitedBy.id] ?? 0) + 1;
      } else {
        inviteScore.shared += 1;
      }
      if (d.hours) hoursTogether += d.hours;
      if (d.rating) ratings.push(d.rating);
      if (d.spot) bySpot.set(d.spot, (bySpot.get(d.spot) ?? 0) + 1);
    }
    const favoriteSpot =
      [...bySpot.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const averageRating =
      ratings.length > 0
        ? formatRating(ratings.reduce((a, b) => a + b, 0) / ratings.length)
        : '—';

    // Рекордная серия: свидания подряд без пропусков > 14 дней.
    let bestStreak = 0;
    let run = 0;
    let prev: number | null = null;
    for (const d of dates) {
      const t = d.date.getTime();
      if (prev === null || t - prev <= 14 * 86_400_000) run += 1;
      else run = 1;
      prev = t;
      if (run > bestStreak) bestStreak = run;
    }

    // Топ форматов — по доле от total, до 5.
    const byType = new Map<string, number>();
    for (const d of dates) {
      if (d.type) byType.set(d.type, (byType.get(d.type) ?? 0) + 1);
    }
    const topTypes = [...byType.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({
        emoji: DATE_TYPES[type]?.emoji ?? '✨',
        label: DATE_TYPES[type]?.label ?? type,
        count,
      }));

    // Последние приглашения — свежие сверху.
    const recent = [...dates].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
    const history = recent.map((d) => ({
      emoji: d.type ? DATE_TYPES[d.type]?.emoji ?? '✨' : '✨',
      text: d.title,
      who: d.invitedBy?.name ?? null,
      when: shortDate(d.date),
    }));

    return {
      couple: couple.coupleName,
      total: dates.length,
      inviteScore,
      hoursTogether,
      bestStreak,
      favoriteSpot,
      averageRating,
      topTypes,
      history,
    };
  }
}
