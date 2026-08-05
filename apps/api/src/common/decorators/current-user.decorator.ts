import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Пользователь из JWT-контекста (attached в JwtAuthGuard). */
export interface AuthUser {
  id: string;
}

/** @CurrentUser() id — id пользователя из токена. */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as AuthUser;
  },
);
