import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/decorators/current-user.decorator.js';
import { WorldService } from './world.service.js';

@Controller('world')
export class WorldController {
  constructor(private readonly world: WorldService) {}

  /** Агрегат главной страницы «Ваш мир». */
  @Get()
  view(@CurrentUser() user: AuthUser) {
    return this.world.view(user.id);
  }
}
