import { IsOptional, IsString, MaxLength } from 'class-validator';

/** Письмо из «Студии письма» на странице свиданий. Получатель — партнёр. */
export class CreateLetterDto {
  @IsString({ message: 'Напишите текст письма' })
  @MaxLength(1000, { message: 'Письмо вышло слишком длинным' })
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  ps?: string;

  /** Ключи оформления конверта (paper/seal/stamp из envelope.ts). */
  @IsString()
  @MaxLength(32)
  paper: string;

  @IsString()
  @MaxLength(32)
  seal: string;

  @IsString()
  @MaxLength(32)
  stamp: string;
}