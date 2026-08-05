import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { coupleNameOf } from '../common/couple-name.js';
import { PublicCouple, PublicUser, toPublicCouple, toPublicUser } from '../auth/user.mapper.js';
import { CoupleRole } from '../generated/prisma/client.js';
import type { Couple, User } from '../generated/prisma/client.js';

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Публичное представление участника для пары. */
export interface MemberView {
  id: string;
  name: string;
  gender: 'boy' | 'girl' | null;
  emoji: string | null;
  tagline: string | null;
  role: string;
  mood: string | null;
  presence: { state: 'online' | 'recent' | 'away' | 'expected'; label: string };
  reactions: Array<{ emoji: string; count: number }>;
}

/** Присутствие по времени последней активности. */
function presenceFor(user: User): MemberView['presence'] {
  const mins = Math.max(0, Math.floor((Date.now() - user.updatedAt.getTime()) / MINUTE_MS));
  const was = user.gender === 'girl' ? 'Была' : 'Был';
  const came = user.gender === 'girl' ? 'Заходила' : 'Заходил';
  if (mins < 5) return { state: 'online', label: 'Сейчас онлайн' };
  if (mins < 60) return { state: 'recent', label: `${was} ${mins} мин. назад` };
  if (mins < 24 * 60) return { state: 'recent', label: `${was} сегодня` };
  const days = Math.floor(mins / (24 * 60));
  if (days < 7) return { state: 'away', label: `${came} ${days} дн. назад` };
  return { state: 'expected', label: 'Заглянет к вечеру' };
}

/**
 * Общий сервис пары: каждый запрос приходит с userId из JWT, и почти каждый
 * модуль хочет знать «в какой я паре и кто моя вторая половинка». Здесь —
 * единственное место, где это резолвится.
 */
@Injectable()
export class CoupleService {
  constructor(private readonly prisma: PrismaService) {}

  /** Пользователь с его парой и всеми участниками; 404, если пары нет. */
  async context(userId: string): Promise<{
    me: User;
    couple: Couple & { members: User[] };
  }> {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        couple: { include: { members: true } },
      },
    });
    if (!me?.couple) {
      throw new NotFoundException('Пара не найдена — вы ещё не присоединились к паре.');
    }
    return { me, couple: me.couple };
  }

  /** Просто id пары текущего пользователя. */
  async coupleIdOf(userId: string): Promise<string> {
    const { couple } = await this.context(userId);
    return couple.id;
  }

  /** Вторая половинка — участник пары с другим id. */
  async partnerOf(userId: string): Promise<User> {
    const { me, couple } = await this.context(userId);
    return couple.members.find((m) => m.id !== me.id) ?? me;
  }

  /**
   * Полный профиль пары для страницы /profile и шапки: участники с живостью
   * (присутствие, настроение, реакции), primaryId и mutualReactions.
   */
  async profile(userId: string): Promise<{
    couple: {
      id: string;
      code: string;
      coupleName: string;
      since: string;
      sinceLabel: string;
      streakDays: number;
      primaryId: string;
      mutualReactions: number;
      members: MemberView[];
    };
    me: { id: string; name: string; role: string };
  }> {
    const { me, couple } = await this.context(userId);

    const reactions = await this.prisma.reaction.findMany({
      where: { coupleId: couple.id },
    });
    const reactionsByMember = new Map<string, Array<{ emoji: string; count: number }>>();
    for (const r of reactions) {
      const list = reactionsByMember.get(r.memberId) ?? [];
      list.push({ emoji: r.emoji, count: r.count });
      reactionsByMember.set(r.memberId, list);
    }

    const primary = couple.members.find((m) => m.role === 'primary') ?? couple.members[0];
    const sinceLabel = couple.since.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const members: MemberView[] = couple.members.map((m) => ({
      id: m.id,
      name: m.name,
      gender: m.gender ?? null,
      emoji: m.emoji ?? null,
      tagline: m.tagline ?? null,
      role: m.role === 'primary' ? 'Ваша половина' : 'Вторая половинка',
      mood: m.mood ?? null,
      presence: presenceFor(m),
      reactions: reactionsByMember.get(m.id) ?? [],
    }));

    return {
      couple: {
        id: couple.id,
        code: couple.code,
        coupleName: couple.coupleName,
        since: couple.since.toISOString(),
        sinceLabel,
        streakDays: couple.streakDays,
        primaryId: primary.id,
        mutualReactions: couple.mutualReactions,
        members,
      },
      me: { id: me.id, name: me.name, role: me.role },
    };
  }

  /**
   * Вступление залогиненного пользователя в пару второй половинки по коду.
   * Работает только если в своей паре ты пока один; в целевой паре — тоже
   * одно место (иначе 409). Возвращает обновлённого пользователя и пару.
   */
  async join(
    userId: string,
    code: string,
  ): Promise<{ user: PublicUser; couple: PublicCouple }> {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { couple: true },
    });
    if (!me?.couple) {
      throw new NotFoundException('Пара не найдена — вы ещё не присоединились к паре.');
    }

    const currentCount = await this.prisma.user.count({ where: { coupleId: me.coupleId } });
    if (currentCount >= 2) {
      throw new ConflictException('В вашей паре уже два участника — половинка на месте');
    }

    const target = await this.prisma.couple.findUnique({
      where: { code: code.trim().toUpperCase() },
    });
    if (!target) {
      throw new BadRequestException('Код пары не найден — проверьте его у второй половинки');
    }
    if (target.id === me.coupleId) {
      throw new BadRequestException('Это код вашей пары — вы уже в ней');
    }

    const memberCount = await this.prisma.user.count({ where: { coupleId: target.id } });
    if (memberCount >= 2) {
      throw new ConflictException('В этой паре уже два участника');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { coupleId: target.id, role: CoupleRole.partner },
      include: { couple: { include: { members: true } } },
    });

    // Название пары с учётом нового участника.
    const names = user.couple!.members.map((m) => m.name);
    const coupleName = coupleNameOf(...names);
    if (coupleName !== user.couple!.coupleName) {
      await this.prisma.couple.update({ where: { id: target.id }, data: { coupleName } });
    }

    const freshCouple = await this.prisma.couple.findUnique({
      where: { id: target.id },
      include: { members: true },
    });

    return {
      user: toPublicUser(user),
      couple: toPublicCouple(freshCouple!),
    };
  }
}
