import { Global, Module } from '@nestjs/common';
import { HeartsController } from './hearts.controller.js';
import { HeartsService } from './hearts.service.js';

/** Экономика сердечек. Глобальный: сервисом пользуются другие модули
 *  (memory +15, coupon_send +5, coupon_redeem −price и т.д.). */
@Global()
@Module({
  controllers: [HeartsController],
  providers: [HeartsService],
  exports: [HeartsService],
})
export class HeartsModule {}
