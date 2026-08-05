import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWishDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  /** Кто загадал — id участника («Мечта Димы»). Можно мечтать за партнёра. */
  @IsString()
  @IsNotEmpty()
  wisherId: string;
}
