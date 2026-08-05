import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Похоже, это не совсем почта 💌' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен быть от 6 символов' })
  password: string;
}
