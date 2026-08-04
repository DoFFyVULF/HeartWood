'use client';
import { useMemo } from 'react';

export interface SwayConfig {
  trunkAmp: number;
  trunkDur: number;
  idleScale: number;
  stageSway: number;
  reduced: boolean;
  calm?: number;
}

export function useIdleSway(cfg: SwayConfig) {
  return useMemo(() => {
    if (cfg.reduced) return { trunk: { rotate: 0 }, branchScale: 0, durScale: 1 };
    const calm = cfg.calm ?? 1;
    const amp = cfg.trunkAmp * cfg.stageSway * cfg.idleScale * calm;
    return {
      trunk: { rotate: amp },
      branchScale: cfg.stageSway * cfg.idleScale * calm,
      durScale: 1 / cfg.idleScale,
    };
  }, [cfg.reduced, cfg.trunkAmp, cfg.idleScale, cfg.stageSway, cfg.calm]);
}