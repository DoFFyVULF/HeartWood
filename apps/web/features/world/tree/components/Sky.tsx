'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { TimeOfDay, SKY_PALETTES } from '../config/stages';
import { mulberry32 } from '../lib/random';

const SKY_TRANSITION = { duration: 2.5, ease: 'easeInOut' as const };

const WASH: Record<TimeOfDay, { top: string; bottom: string }> = {
  dawn:  { top: 'rgba(46,74,90,0.16)',   bottom: 'rgba(247,178,103,0.30)' },
  day:   { top: 'rgba(168,221,224,0)',   bottom: 'rgba(234,247,239,0)' },
  dusk:  { top: 'rgba(53,88,107,0.26)',  bottom: 'rgba(242,140,107,0.40)' },
  night: { top: 'rgba(11,30,42,0.58)',   bottom: 'rgba(18,50,64,0.34)' },
};

interface SkyProps { uid: string; timeOfDay: TimeOfDay; seed: number; reduced?: boolean; }

export default function Sky({ uid, timeOfDay, seed, reduced }: SkyProps) {
  const palette = SKY_PALETTES[timeOfDay];
  const stars = useMemo(() => {
    if (palette.stars <= 0) return [];
    const rng = mulberry32(seed ^ 0x5151);
    return Array.from({ length: 80 }, (_, i) => ({
      id: i, x: rng() * 800, y: rng() * 650, r: 0.4 + rng() * 1.5, twinkle: rng(),
    }));
  }, [palette.stars, seed]);

  return (
    <g aria-hidden="true">
      <defs>
        {(Object.keys(WASH) as TimeOfDay[]).map((tod) => {
          const w = WASH[tod];
          return (
            <linearGradient key={tod} id={`${uid}-sky-${tod}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={w.top} /><stop offset="100%" stopColor={w.bottom} />
            </linearGradient>
          );
        })}
        <radialGradient id={`${uid}-sky-vignette`} cx="50%" cy="60%" r="75%">
          <stop offset="60%" stopColor="rgba(0,0,0,0)" /><stop offset="100%" stopColor="rgba(0,0,0,0.10)" />
        </radialGradient>
      </defs>

      {(Object.keys(WASH) as TimeOfDay[]).map((tod) => (
        <motion.rect key={tod} x={0} y={0} width={800} height={1000} fill={`url(#${uid}-sky-${tod})`}
          initial={false} animate={{ opacity: tod === timeOfDay ? 1 : 0 }}
          transition={reduced ? { duration: 0 } : SKY_TRANSITION} style={{ pointerEvents: 'none' }}
        />
      ))}

      <AnimatePresence>
        {stars.length > 0 && (
          <motion.g key="stars" initial={{ opacity: 0 }} animate={{ opacity: palette.stars }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 2 }}>
            {stars.map((s) => (
              <motion.circle key={s.id} cx={s.x} cy={s.y} r={s.r} fill="#FFF6D6"
                animate={reduced ? { opacity: 0.7 } : { opacity: [0.3, 1, 0.3] }}
                transition={reduced ? { duration: 0 } : { duration: 2.5 + s.twinkle * 4, repeat: Infinity, ease: 'easeInOut', delay: s.twinkle * 3 }}
              />
            ))}
          </motion.g>
        )}
      </AnimatePresence>

      <rect x={0} y={0} width={800} height={1000} fill={`url(#${uid}-sky-vignette)`} />
    </g>
  );
}