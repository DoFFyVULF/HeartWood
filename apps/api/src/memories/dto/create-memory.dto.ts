import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMemoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  title: string;

  @IsString()
  @MaxLength(8)
  emoji: string;

  /** ISO-дата (YYYY-MM-DD) дня, когда воспоминание случилось. */
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  story?: string;
}

export class UpdateMemoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  emoji?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  story?: string | null;
}
