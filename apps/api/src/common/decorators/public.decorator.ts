import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Помечает эндпоинт открытым — JwtAuthGuard его пропустит без токена. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
