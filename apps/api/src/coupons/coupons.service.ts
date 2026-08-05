import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CoupleService } from '../couple/couple.service.js';
import { HeartsService } from '../hearts/hearts.service.js';
import { TreeService } from '../tree/tree.service.js';
import { CreateCouponDto } from './dto/coupons.dto.js';

/** Объект участника для подписей купона. */
export interface MemberRef {
  id: string;
  name: string;
}

export interface CouponView {
  id: string;
  emoji: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'redeemed';
  price: number;
  /** ISO-строка создания. */
  createdAt: string;
  redeemedAt: string | null;
  createdBy: MemberRef | null;
  recipient: MemberRef | null;
  redeemedBy: MemberRef | null;
}

function memberRef(u: { id: string; name: string } | null): MemberRef | null {
  return u ? { id: u.id, name: u.name } : null;
}

function toView(c: {
  id: string;
  emoji: string;
  title: string;
  description: string;
  status: string;
  price: number;
  createdAt: Date;
  redeemedAt: Date | null;
  createdBy: { id: string; name: string } | null;
  recipient: { id: string; name: string } | null;
  redeemedBy: { id: string; name: string } | null;
}): CouponView {
  return {
    id: c.id,
    emoji: c.emoji,
    title: c.title,
    description: c.description,
    status: c.status as CouponView['status'],
    price: c.price,
    createdAt: c.createdAt.toISOString(),
    redeemedAt: c.redeemedAt ? c.redeemedAt.toISOString() : null,
    createdBy: memberRef(c.createdBy),
    recipient: memberRef(c.recipient),
    redeemedBy: memberRef(c.redeemedBy),
  };
}

@Injectable()
export class CouponsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couple: CoupleService,
    private readonly hearts: HeartsService,
    private readonly tree: TreeService,
  ) {}

  async list(userId: string): Promise<CouponView[]> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const coupons = await this.prisma.coupon.findMany({
      where: { coupleId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        recipient: { select: { id: true, name: true } },
        redeemedBy: { select: { id: true, name: true } },
      },
    });
    return coupons.map(toView);
  }

  /** Создаёт ЧЕРНОВИК купона. */
  async create(userId: string, dto: CreateCouponDto): Promise<CouponView> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const coupon = await this.prisma.coupon.create({
      data: {
        emoji: dto.emoji,
        title: dto.title.trim(),
        description: dto.description.trim(),
        price: dto.price,
        status: 'draft',
        coupleId,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        recipient: { select: { id: true, name: true } },
        redeemedBy: { select: { id: true, name: true } },
      },
    });
    return toView(coupon);
  }

  /** Отправка черновика партнёру: draft → active, +5 сердечек отправителю. */
  async send(userId: string, id: string, recipientId: string): Promise<CouponView> {
    const { couple } = await this.couple.context(userId);
    const recipient = couple.members.find((m) => m.id === recipientId);
    if (!recipient) throw new BadRequestException('Такого участника пары нет');

    const coupon = await this.prisma.coupon.findFirst({
      where: { id, coupleId: couple.id },
    });
    if (!coupon) throw new NotFoundException('Купон не найден');
    if (coupon.status !== 'draft') throw new BadRequestException('Отправить можно только черновик');

    const updated = await this.prisma.coupon.update({
      where: { id },
      data: { status: 'active', recipientId },
      include: {
        createdBy: { select: { id: true, name: true } },
        recipient: { select: { id: true, name: true } },
        redeemedBy: { select: { id: true, name: true } },
      },
    });
    await this.hearts.grant(userId, 'coupon_send', 5, 'Купон отправлен');
    return toView(updated);
  }

  /**
   * Выкуп активного купона. Атомарно: списание −price у выкупающего (через
   * HeartsService.spend) и перевод купона в redeemed. Если сердечек не хватает
   * — 400, купон остаётся активным.
   */
  async redeem(userId: string, id: string): Promise<CouponView> {
    const { couple } = await this.couple.context(userId);
    const coupon = await this.prisma.coupon.findFirst({
      where: { id, coupleId: couple.id },
    });
    if (!coupon) throw new NotFoundException('Купон не найден');
    if (coupon.status !== 'active') throw new BadRequestException('Выкупить можно только активный купон');

    const spent = await this.hearts.spend(userId, coupon.price, 'coupon_redeem', `Выкуп: ${coupon.title}`);
    if (!spent) throw new BadRequestException('Не хватает сердечек для выкупа');

    const updated = await this.prisma.coupon.update({
      where: { id },
      data: { status: 'redeemed', redeemedById: userId, redeemedAt: new Date() },
      include: {
        createdBy: { select: { id: true, name: true } },
        recipient: { select: { id: true, name: true } },
        redeemedBy: { select: { id: true, name: true } },
      },
    });
    // Выкупленный купон — живое действие пары: дерево получает поинты.
    await this.tree.award(couple.id, 2);
    return toView(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const coupon = await this.prisma.coupon.findFirst({ where: { id, coupleId } });
    if (!coupon) throw new NotFoundException('Купон не найден');
    await this.prisma.coupon.delete({ where: { id } });
  }
}
