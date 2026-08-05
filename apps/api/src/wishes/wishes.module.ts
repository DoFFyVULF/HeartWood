import { Module } from '@nestjs/common';
import { WishesController } from './wishes.controller.js';
import { WishesService } from './wishes.service.js';

@Module({
  controllers: [WishesController],
  providers: [WishesService],
})
export class WishesModule {}
