import { IsDateString, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { EventKind } from '../../generated/prisma/client.js';

export class CreateEventDto {
  @IsEnum(EventKind)
  kind: EventKind;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  title: string;

  /** ISO-дата (YYYY-MM-DD). Для годовщин — «образец» дня (месяц/число). */
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}
