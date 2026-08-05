import { IsString, MaxLength, MinLength } from 'class-validator';

/** Вступление залогиненного пользователя в пару второй половинки по коду. */
export class JoinCoupleDto {
  @IsString({ message: 'Введите код пары' })
  @MinLength(3, { message: 'Код пары похож на «HW-XXXX»' })
  @MaxLength(20, { message: 'Код пары слишком длинный' })
  code: string;
}
