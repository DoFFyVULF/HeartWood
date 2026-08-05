import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CoupleService } from '../couple/couple.service.js';
import { HeartsService } from '../hearts/hearts.service.js';
import { TreeService } from '../tree/tree.service.js';
import { CreateEventDto } from './dto/events.dto.js';

/** Объект участника для подписей «Зовёт Дима» / «Добавила Аня». */
export interface MemberRef {
  id: string;
  name: string;
}

export interface EventView {
  id: string;
  kind: 'date' | 'anniversary' | 'milestone';
  title: string;
  description: string | null;
  /** ISO-дата (YYYY-MM-DD). */
  date: string;
  /** Годовщина повторяется каждый год. */
  recurring: boolean;
  invitedBy: MemberRef | null;
  createdBy: MemberRef | null;
}

function memberRef(u: { id: string; name: string } | null): MemberRef | null {
  return u ? { id: u.id, name: u.name } : null;
}

function toView(e: {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  date: Date;
  recurring: boolean;
  invitedBy: { id: string; name: string } | null;
  createdBy: { id: string; name: string } | null;
}): EventView {
  return {
    id: e.id,
    kind: e.kind as EventView['kind'],
    title: e.title,
    description: e.description,
    date: e.date.toISOString().slice(0, 10),
    recurring: e.recurring,
    invitedBy: memberRef(e.invitedBy),
    createdBy: memberRef(e.createdBy),
  };
}

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couple: CoupleService,
    private readonly hearts: HeartsService,
    private readonly tree: TreeService,
  ) {}

  async list(userId: string): Promise<EventView[]> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const events = await this.prisma.event.findMany({
      where: { coupleId },
      orderBy: { date: 'asc' },
      include: {
        invitedBy: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    return events.map(toView);
  }

  /** Создаёт событие; для свиданий зовёт текущий пользователь и +20 сердечек. */
  async create(userId: string, dto: CreateEventDto): Promise<EventView> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const event = await this.prisma.event.create({
      data: {
        kind: dto.kind,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        date: new Date(`${dto.date}T12:00:00`),
        recurring: dto.kind === 'anniversary',
        coupleId,
        createdById: userId,
        invitedById: dto.kind === 'date' ? userId : null,
      },
      include: {
        invitedBy: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (dto.kind === 'date') {
      await this.hearts.grant(userId, 'date', 20, 'Свидание');
      // Свидание в планах — общее дерево пары растёт.
      await this.tree.award(coupleId, 1);
    }
    return toView(event);
  }

  async remove(userId: string, id: string): Promise<void> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const event = await this.prisma.event.findFirst({ where: { id, coupleId } });
    if (!event) throw new NotFoundException('Событие не найдено');
    await this.prisma.event.delete({ where: { id } });
  }
}
