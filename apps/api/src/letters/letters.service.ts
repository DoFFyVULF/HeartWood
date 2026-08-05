import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CoupleService } from '../couple/couple.service.js';
import { TreeService } from '../tree/tree.service.js';
import { CreateLetterDto } from './dto/letters.dto.js';

/** Короткая ссылка на участника (id + имя) — как в остальных модулях. */
export interface MemberRef {
  id: string;
  name: string;
}

/** Письмо, как его видит фронт: с флагом «входящее для меня» и данными
 * отправителя/получателя. Имена на конверте берутся из участников. */
export interface LetterView {
  id: string;
  message: string;
  ps: string | null;
  paper: string;
  seal: string;
  stamp: string;
  /** Прочитано получателем. */
  read: boolean;
  /** true, если письмо пришло МНЕ (получатель — текущий пользователь). */
  incoming: boolean;
  sender: MemberRef;
  recipient: MemberRef;
  createdAt: string;
}

function memberRef(u: { id: string; name: string; emoji: string | null }): MemberRef & { emoji?: string | null } {
  return { id: u.id, name: u.name, emoji: u.emoji };
}

function toView(
  l: {
    id: string;
    message: string;
    ps: string | null;
    paper: string;
    seal: string;
    stamp: string;
    read: boolean;
    createdAt: Date;
    sender: { id: string; name: string; emoji: string | null };
    recipient: { id: string; name: string; emoji: string | null };
  },
  viewerId: string,
): LetterView {
  return {
    id: l.id,
    message: l.message,
    ps: l.ps,
    paper: l.paper,
    seal: l.seal,
    stamp: l.stamp,
    read: l.read,
    incoming: l.recipient.id === viewerId,
    sender: memberRef(l.sender),
    recipient: memberRef(l.recipient),
    createdAt: l.createdAt.toISOString(),
  };
}

@Injectable()
export class LettersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couple: CoupleService,
    private readonly tree: TreeService,
  ) {}

  /** Все письма пары — от новых к старым. Фронт сам делит на входящие/исходящие. */
  async list(userId: string): Promise<LetterView[]> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const letters = await this.prisma.letter.findMany({
      where: { coupleId },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, name: true, emoji: true } },
        recipient: { select: { id: true, name: true, emoji: true } },
      },
    });
    return letters.map((l) => toView(l, userId));
  }

  /**
   * Написать письмо второй половинке. Получатель — другой участник пары;
   * без привязанной половинки писать некому (409).
   */
  async create(userId: string, dto: CreateLetterDto): Promise<LetterView> {
    const { me, couple } = await this.couple.context(userId);
    const recipient = couple.members.find((m) => m.id !== me.id);
    if (!recipient) {
      throw new ConflictException('Половинка ещё не рядом — писать письма пока некому');
    }

    const letter = await this.prisma.letter.create({
      data: {
        message: dto.message.trim(),
        ps: dto.ps?.trim() || null,
        paper: dto.paper,
        seal: dto.seal,
        stamp: dto.stamp,
        coupleId: couple.id,
        senderId: me.id,
        recipientId: recipient.id,
      },
      include: {
        sender: { select: { id: true, name: true, emoji: true } },
        recipient: { select: { id: true, name: true, emoji: true } },
      },
    });
    // Написанное для половинки письмо — поинт роста.
    await this.tree.award(couple.id, 1);
    return toView(letter, userId);
  }

  /** Отметить письмо прочитанным — только получатель (не сам придумал и не прочитал своё исходящее). */
  async markRead(userId: string, letterId: string): Promise<LetterView> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const letter = await this.prisma.letter.findFirst({ where: { id: letterId, coupleId } });
    if (!letter) throw new NotFoundException('Письмо не найдено');
    if (letter.senderId === userId) {
      throw new BadRequestException('Это ваше письмо — прочитать его может только половинка');
    }

    const updated = await this.prisma.letter.update({
      where: { id: letterId },
      data: { read: true },
      include: {
        sender: { select: { id: true, name: true, emoji: true } },
        recipient: { select: { id: true, name: true, emoji: true } },
      },
    });
    return toView(updated, userId);
  }
}