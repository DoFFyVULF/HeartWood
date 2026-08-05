import { Global, Module } from '@nestjs/common';
import { TreeService } from './tree.service.js';

/** Глобальный доступ к росту дерева — любой сервис начисляет поинты. */
@Global()
@Module({
  providers: [TreeService],
  exports: [TreeService],
})
export class TreeModule {}
