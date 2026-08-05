import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/decorators/current-user.decorator.js';
import { LettersService } from './letters.service.js';
import { CreateLetterDto } from './dto/letters.dto.js';

@Controller('letters')
export class LettersController {
  constructor(private readonly letters: LettersService) {}

  /** Все письма пары (входящие и исходящие), от новых к старым. */
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.letters.list(user.id);
  }

  /** Отправить письмо второй половинке из «Студии письма». */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLetterDto) {
    return this.letters.create(user.id, dto);
  }

  /** Отметить входящее письмо прочитанным. */
  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.letters.markRead(user.id, id);
  }
}