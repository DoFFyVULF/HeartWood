import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/decorators/current-user.decorator.js';
import { CoupleService } from '../couple/couple.service.js';
import { HeartsService } from './hearts.service.js';

@Controller('hearts')
export class HeartsController {
  constructor(
    private readonly hearts: HeartsService,
    private readonly couple: CoupleService,
  ) {}

  /** Личный кошелёк: баланс + история за 30 дней. */
  @Get()
  wallet(@CurrentUser() user: AuthUser) {
    return this.hearts.wallet(user.id);
  }

  /** Ежедневный бонус (+10). Идемпотентно — раз в сутки. */
  @Post('claim-daily')
  @HttpCode(HttpStatus.OK)
  async claimDaily(@CurrentUser() user: AuthUser) {
    const coupleId = await this.couple.coupleIdOf(user.id);
    return this.hearts.claimDaily(user.id, coupleId);
  }
}
