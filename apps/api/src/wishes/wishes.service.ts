import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CoupleService } from '../couple/couple.service.js';
import { TreeService } from '../tree/tree.service.js';
import { CreateWishDto } from './dto/wishes.dto.js';

/** Объект участника для «Мечта Димы» / «Готовит Аня». */
export interface MemberRef {
  id: string;
  name: string;
}

export interface WishView {
  id: string;
  title: string;
  description: string | null;
  /** Подарено — желание сбылось. */
  fulfilled: boolean;
  wisher: MemberRef;
  claimer: MemberRef | null;
  createdBy: MemberRef | null;
}

function memberRef(u: { id: string; name: string } | null): MemberRef | null {
  return u ? { id: u.id, name: u.name } : null;
}

function toView(w: {
  id: string;
  title: string;
  description: string | null;
  fulfilled: boolean;
  wisher: { id: string; name: string };
  claimer: { id: string; name: string } | null;
  createdBy: { id: string; name: string } | null;
}): WishView {
  return {
    id: w.id,
    title: w.title,
    description: w.description,
    fulfilled: w.fulfilled,
    wisher: w.wisher,
    claimer: memberRef(w.claimer),
    createdBy: memberRef(w.createdBy),
  };
}

@Injectable()
export class WishesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couple: CoupleService,
    private readonly tree: TreeService,
  ) {}

  async list(userId: string): Promise<WishView[]> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const wishes = await this.prisma.wish.findMany({
      where: { coupleId },
      orderBy: { createdAt: 'desc' },
      include: {
        wisher: { select: { id: true, name: true } },
        claimer: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    return wishes.map(toView);
  }

  async create(userId: string, dto: CreateWishDto): Promise<WishView> {
    const { couple } = await this.couple.context(userId);
    const wisher = couple.members.find((m) => m.id === dto.wisherId);
    if (!wisher) throw new BadRequestException('Мечтать можно за участника вашей пары');

    const wish = await this.prisma.wish.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        wisherId: wisher.id,
        coupleId: couple.id,
        createdById: userId,
      },
      include: {
        wisher: { select: { id: true, name: true } },
        claimer: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    return toView(wish);
  }

  /** Взять в подарок — только партнёр мечтателя. Себя нельзя. */
  async claim(userId: string, wishId: string): Promise<WishView> {
    const wish = await this.ownedWish(userId, wishId);
    if (wish.wisherId === userId) throw new BadRequestException('Нельзя подарить себе — потеряется сюрприз');
    if (wish.claimerId) throw new BadRequestException('Желание уже взято в подарок');
    if (wish.fulfilled) throw new BadRequestException('Желание уже подарено');

    const updated = await this.prisma.wish.update({
      where: { id: wishId },
      data: { claimerId: userId },
      include: {
        wisher: { select: { id: true, name: true } },
        claimer: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    return toView(updated);
  }

  /** Вернуть в общий список — только тот, кто взял. */
  async unclaim(userId: string, wishId: string): Promise<WishView> {
    const wish = await this.ownedWish(userId, wishId);
    if (wish.claimerId !== userId) throw new BadRequestException('Отменить может только тот, кто взял в подарок');

    const updated = await this.prisma.wish.update({
      where: { id: wishId },
      data: { claimerId: null },
      include: {
        wisher: { select: { id: true, name: true } },
        claimer: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    return toView(updated);
  }

  /** Подарить — может заклеймивший даритель или сам мечтатель. */
  async fulfill(userId: string, wishId: string): Promise<WishView> {
    const wish = await this.ownedWish(userId, wishId);
    if (wish.fulfilled) throw new BadRequestException('Желание уже подарено');
    if (wish.wisherId !== userId && wish.claimerId !== userId) {
      throw new BadRequestException('Отметить подаренным может мечтатель или даритель');
    }

    const updated = await this.prisma.wish.update({
      where: { id: wishId },
      data: { fulfilled: true, claimerId: null },
      include: {
        wisher: { select: { id: true, name: true } },
        claimer: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    // Сбывшаяся мечта — заметный рост дерева.
    const coupleId = await this.couple.coupleIdOf(userId);
    await this.tree.award(coupleId, 2);
    return toView(updated);
  }

  /** Удалить — может создатель или мечтатель («передумал мечтать»). */
  async remove(userId: string, wishId: string): Promise<void> {
    const wish = await this.ownedWish(userId, wishId);
    if (wish.createdById !== userId && wish.wisherId !== userId) {
      throw new BadRequestException('Удалить желание может его создатель или мечтатель');
    }
    await this.prisma.wish.delete({ where: { id: wishId } });
  }

  private async ownedWish(
    userId: string,
    wishId: string,
  ): Promise<{ id: string; wisherId: string; claimerId: string | null; fulfilled: boolean; createdById: string | null }> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const wish = await this.prisma.wish.findFirst({ where: { id: wishId, coupleId } });
    if (!wish) throw new NotFoundException('Желание не найдено');
    return wish;
  }
}
