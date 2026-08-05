import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { UpdateMeDto } from './dto/update-me.dto.js';
import { PublicCouple, PublicUser, toPublicCouple, toPublicUser } from './user.mapper.js';
import { coupleNameOf } from '../common/couple-name.js';
import { CoupleRole } from '../generated/prisma/client.js';

export interface AuthResult {
  token: string;
  user: PublicUser;
  couple: PublicCouple;
  /** Код пары — нужен только при регистрации первой половинки. */
  coupleCode?: string;
}

/** Генерация читаемого кода пары: «HW-K3P9». */
function generateCoupleCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `HW-${code}`;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  /** Проверяет пароль пользователя (плоский метод для login и регистрации). */
  private async verifyPassword(user: { passwordHash: string }, password: string): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, user.passwordHash);
  }

  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(password, 12);
  }

  private signToken(userId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId });
  }

  /**
   * Регистрация. Без кода → создаётся новая пара (код возвращается).
   * С кодом → вступаем в существующую пару второй половинкой.
   */
  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('Почта уже занята — попробуйте войти');

    const passwordHash = await this.hashPassword(dto.password);
    const email = dto.email.toLowerCase();

    let coupleId: string;
    let role: CoupleRole = CoupleRole.primary;
    let coupleCode: string | undefined;

    if (dto.coupleCode) {
      // Вступаем в существующую пару.
      const couple = await this.prisma.couple.findUnique({ where: { code: dto.coupleCode.trim().toUpperCase() } });
      if (!couple) throw new BadRequestException('Код пары не найден — проверьте его у второй половинки');
      coupleId = couple.id;
      role = CoupleRole.partner;

      const memberCount = await this.prisma.user.count({ where: { coupleId } });
      if (memberCount >= 2) throw new ConflictException('В этой паре уже есть два участника');
    } else {
      // Создаём новую пару.
      coupleCode = generateCoupleCode();
      const couple = await this.prisma.couple.create({
        data: { code: coupleCode, coupleName: dto.name.trim() },
      });
      coupleId = couple.id;
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name.trim(),
        gender: dto.gender ?? null,
        role,
        coupleId,
      },
      include: { couple: { include: { members: true } } },
    });

    // Название пары с учётом второго участника.
    const names = user.couple!.members.map((m) => m.name);
    const coupleName = coupleNameOf(...names);
    if (coupleName !== user.couple!.coupleName) {
      await this.prisma.couple.update({ where: { id: coupleId }, data: { coupleName } });
    }

    const freshCouple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
      include: { members: true },
    });

    const token = await this.signToken(user.id);
    return {
      token,
      user: toPublicUser(user),
      couple: toPublicCouple(freshCouple!),
      coupleCode,
    };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { couple: { include: { members: true } } },
    });
    if (!user) throw new UnauthorizedException('Неверная почта или пароль');

    const ok = await this.verifyPassword(user, dto.password);
    if (!ok) throw new UnauthorizedException('Неверная почта или пароль');
    if (!user.couple) throw new UnauthorizedException('К паре не привязан аккаунт');

    const token = await this.signToken(user.id);
    return {
      token,
      user: toPublicUser(user),
      couple: toPublicCouple(user.couple),
    };
  }

  /** Текущий пользователь + его пара (по JWT). */
  async me(userId: string): Promise<{ user: PublicUser; couple: PublicCouple }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { couple: { include: { members: true } } },
    });
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    if (!user.couple) throw new UnauthorizedException('К паре не привязан аккаунт');

    return {
      user: toPublicUser(user),
      couple: toPublicCouple(user.couple),
    };
  }

  /** Обновление своего профиля (имя, эмодзи, подпись, настроение, аватарка). */
  async updateMe(userId: string, dto: UpdateMeDto): Promise<{ user: PublicUser }> {
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.emoji !== undefined) data.emoji = dto.emoji === '' ? null : dto.emoji;
    if (dto.tagline !== undefined) data.tagline = dto.tagline === '' ? null : dto.tagline;
    if (dto.mood !== undefined) data.mood = dto.mood === '' ? null : dto.mood;
    if (dto.photo !== undefined) data.photo = dto.photo === '' ? null : dto.photo;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    return { user: toPublicUser(user) };
  }
}
