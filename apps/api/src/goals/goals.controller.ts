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
import { GoalsService } from './goals.service.js';
import { ContributeDto, CreateGoalDto } from './dto/goals.dto.js';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.goals.list(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateGoalDto) {
    return this.goals.create(user.id, dto);
  }

  @Post(':id/contribute')
  @HttpCode(HttpStatus.OK)
  contribute(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ContributeDto) {
    return this.goals.contribute(user.id, id, dto.amount);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.goals.remove(user.id, id);
  }
}
