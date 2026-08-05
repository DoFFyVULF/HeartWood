import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule as JwtAuthModule } from './common/auth.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CoupleModule } from './couple/couple.module.js';
import { HeartsModule } from './hearts/hearts.module.js';
import { TreeModule } from './tree/tree.module.js';
import { MemoriesModule } from './memories/memories.module.js';
import { CouponsModule } from './coupons/coupons.module.js';
import { GoalsModule } from './goals/goals.module.js';
import { EventsModule } from './events/events.module.js';
import { WishesModule } from './wishes/wishes.module.js';
import { LettersModule } from './letters/letters.module.js';
import { WorldModule } from './world/world.module.js';
import { DatesModule } from './dates/dates.module.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';

@Module({
  imports: [
    // Сразу читает .env в process.env (и для config-сервиса).
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    // Глобальный JwtModule (JwtService доступен всем).
    JwtAuthModule,
    // Регистрация / логин / me.
    AuthModule,
    // Контекст пары и экономика сердечек — глобальные.
    CoupleModule,
    HeartsModule,
    // Рост общего дерева пары.
    TreeModule,
    // Доменные модули.
    MemoriesModule,
    CouponsModule,
    GoalsModule,
    EventsModule,
    WishesModule,
    LettersModule,
    // Агрегаты главной и свиданий.
    WorldModule,
    DatesModule,
  ],
  providers: [
    // Глобальный guard авторизации: любой эндпоинт требует JWT,
    // кроме помеченных @Public().
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
