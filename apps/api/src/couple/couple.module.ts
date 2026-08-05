import { Global, Module } from '@nestjs/common';
import { CoupleController } from './couple.controller.js';
import { CoupleService } from './couple.service.js';

/** Глобальный доступ к контексту пары — любой сервис инжектит CoupleService. */
@Global()
@Module({
  controllers: [CoupleController],
  providers: [CoupleService],
  exports: [CoupleService],
})
export class CoupleModule {}
