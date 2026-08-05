import { ValidationPipe, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin.split(','),
    credentials: true,
  });

  // Все эндпоинты — под /api: /api/auth/login, /api/coupons и т.д.
  app.setGlobalPrefix('api');

  // Валидация DTO: отбрасываем лишние поля, пробрасываем ошибки наружу.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  Logger.log(`API слушает http://localhost:${port}/api`, 'Bootstrap');
}
bootstrap();
