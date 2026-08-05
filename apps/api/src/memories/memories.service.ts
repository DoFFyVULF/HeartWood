import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CoupleService } from '../couple/couple.service.js';
import { HeartsService } from '../hearts/hearts.service.js';
import { TreeService } from '../tree/tree.service.js';
import { CreateMemoryDto, UpdateMemoryDto } from './dto/create-memory.dto.js';

/** Публичное воспоминание: media/cover локальные (IndexedDB), в API их нет. */
export interface MemoryView {
  id: string;
  title: string;
  emoji: string;
  /** ISO-дата (YYYY-MM-DD). */
  date: string;
  story: string | null;
  /** Порядок создания — тай-брейк при равных датах. */
  createdAt: number;
}

function toView(m: {
  id: string;
  title: string;
  emoji: string;
  date: Date;
  story: string | null;
  createdAt: Date;
}): MemoryView {
  return {
    id: m.id,
    title: m.title,
    emoji: m.emoji,
    date: m.date.toISOString().slice(0, 10),
    story: m.story,
    createdAt: m.createdAt.getTime(),
  };
}

@Injectable()
export class MemoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly couple: CoupleService,
    private readonly hearts: HeartsService,
    private readonly tree: TreeService,
  ) {}

  async list(userId: string): Promise<MemoryView[]> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const memories = await this.prisma.memory.findMany({
      where: { coupleId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return memories.map(toView);
  }

  async getOne(userId: string, id: string): Promise<MemoryView> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const memory = await this.prisma.memory.findFirst({
      where: { id, coupleId },
    });
    if (!memory) throw new NotFoundException('Воспоминание не найдено');
    return toView(memory);
  }

  /** Создаёт воспоминание и начисляет +15 сердечек создателю. */
  async create(userId: string, dto: CreateMemoryDto): Promise<MemoryView> {
    const coupleId = await this.couple.coupleIdOf(userId);
    const memory = await this.prisma.memory.create({
      data: {
        title: dto.title.trim(),
        emoji: dto.emoji,
        date: new Date(`${dto.date}T12:00:00`),
        story: dto.story?.trim() || null,
        coupleId,
        createdById: userId,
      },
    });
    await this.hearts.grant(userId, 'memory', 15, 'Новое воспоминание');
    // Общее воспоминание пары питает дерево.
    await this.tree.award(coupleId, 1);
    return toView(memory);
  }

  async update(userId: string, id: string, dto: UpdateMemoryDto): Promise<MemoryView> {
    const coupleId = await this.couple.coupleIdOf(userId);
    await this.ensureOwned(coupleId, id);
    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.emoji !== undefined) data.emoji = dto.emoji;
    if (dto.date !== undefined) data.date = new Date(`${dto.date}T12:00:00`);
    if (dto.story !== undefined) data.story = dto.story === null ? null : dto.story.trim();
    const memory = await this.prisma.memory.update({ where: { id }, data });
    return toView(memory);
  }

  async remove(userId: string, id: string): Promise<void> {
    const coupleId = await this.couple.coupleIdOf(userId);
    await this.ensureOwned(coupleId, id);
    await this.prisma.memory.delete({ where: { id } });
  }

  private async ensureOwned(coupleId: string, id: string): Promise<void> {
    const found = await this.prisma.memory.findFirst({ where: { id, coupleId } });
    if (!found) throw new NotFoundException('Воспоминание не найдено');
  }
}
