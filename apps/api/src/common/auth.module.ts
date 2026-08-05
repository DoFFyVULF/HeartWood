import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

/**
 * Глобальный модуль JWT: JwtService доступен во всех сервисах для подписи
 * и проверки токенов. Секрет и время жизни — из конфига.
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET') ?? 'dev-secret';
        // В .env значение в секундах (числом). JSON-web-token принимает StringValue | number.
        const rawExpiry = config.get<string>('JWT_EXPIRES_IN') ?? '2592000';
        const expiresIn = /^\d+$/.test(rawExpiry)
          ? Number(rawExpiry)
          : (rawExpiry as import('jsonwebtoken').SignOptions['expiresIn']);
        return { secret, signOptions: { expiresIn } };
      },
    }),
  ],
  exports: [JwtModule],
})
export class AuthModule {}
