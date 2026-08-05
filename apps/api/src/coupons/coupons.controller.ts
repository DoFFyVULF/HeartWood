import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/decorators/current-user.decorator.js';
import { CouponsService } from './coupons.service.js';
import { CreateCouponDto, SendCouponDto } from './dto/coupons.dto.js';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly coupons: CouponsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.coupons.list(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCouponDto) {
    return this.coupons.create(user.id, dto);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  send(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: SendCouponDto) {
    return this.coupons.send(user.id, id, dto.recipientId);
  }

  @Post(':id/redeem')
  @HttpCode(HttpStatus.OK)
  redeem(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.coupons.redeem(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.coupons.remove(user.id, id);
  }
}
