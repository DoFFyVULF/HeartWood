import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Обновление своего профиля: имя, эмодзи, подпись, настроение, аватарка. */
export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  emoji?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  tagline?: string;

  @IsOptional()
  @IsString()
  @IsIn([
    'overjoyed', 'great', 'good', 'okay', 'calm', 'tired', 'down', '',
  ])
  mood?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  photo?: string;
}
