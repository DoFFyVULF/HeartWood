import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/decorators/current-user.decorator.js';
import { CoupleService } from './couple.service.js';
import { JoinCoupleDto } from './dto/join-couple.dto.js';

@Controller('couple')
export class CoupleController {
  constructor(private readonly couple: CoupleService) {}

  /** Профиль пары с живостью участников — для /profile и шапки. */
  @Get()
  profile(@CurrentUser() user: AuthUser) {
    return this.couple.profile(user.id);
  }

  /** Вступление в пару второй половинки по коду. */
  @Post('join')
  @HttpCode(HttpStatus.OK)
  join(@CurrentUser() user: AuthUser, @Body() dto: JoinCoupleDto) {
    return this.couple.join(user.id, dto.code);
  }
}
