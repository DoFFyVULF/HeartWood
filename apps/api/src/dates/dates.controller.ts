import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/decorators/current-user.decorator.js';
import { DatesService } from './dates.service.js';

@Controller('dates')
export class DatesController {
  constructor(private readonly dates: DatesService) {}

  /** Агрегат страницы «Свидания». */
  @Get()
  view(@CurrentUser() user: AuthUser) {
    return this.dates.view(user.id);
  }
}
