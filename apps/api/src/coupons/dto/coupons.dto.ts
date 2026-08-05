import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCouponDto {
  @IsString()
  @MaxLength(8)
  emoji: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  title: string;

  @IsString()
  @MaxLength(300)
  description: string;

  /** Цена выкупа в сердечках. */
  @IsInt()
  @Min(0)
  @Max(10_000)
  price: number;
}

export class SendCouponDto {
  /** Кому предназначен купон — id партнёра. */
  @IsString()
  @IsNotEmpty()
  recipientId: string;
}
