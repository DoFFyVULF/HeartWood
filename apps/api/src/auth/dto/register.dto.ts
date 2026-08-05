import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Gender } from '../../generated/prisma/client.js';

export class RegisterDto {
  @IsString()
  @MinLength(2, { message: 'Как вас зовут? Нужно хотя бы пару букв' })
  @MaxLength(40)
  name: string;

  @IsEmail({}, { message: 'Похоже, это не совсем почта 💌' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен быть от 6 символов' })
  @MaxLength(72)
  password: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  /** Код пары второй половинки — вступаем в существующую пару. */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  coupleCode?: string;
}
