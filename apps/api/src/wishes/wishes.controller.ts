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
import { WishesService } from './wishes.service.js';
import { CreateWishDto } from './dto/wishes.dto.js';

@Controller('wishes')
export class WishesController {
  constructor(private readonly wishes: WishesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.wishes.list(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWishDto) {
    return this.wishes.create(user.id, dto);
  }

  @Post(':id/claim')
  @HttpCode(HttpStatus.OK)
  claim(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.wishes.claim(user.id, id);
  }

  @Post(':id/unclaim')
  @HttpCode(HttpStatus.OK)
  unclaim(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.wishes.unclaim(user.id, id);
  }

  @Post(':id/fulfill')
  @HttpCode(HttpStatus.OK)
  fulfill(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.wishes.fulfill(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.wishes.remove(user.id, id);
  }
}
