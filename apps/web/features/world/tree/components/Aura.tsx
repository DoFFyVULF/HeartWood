'use client';

import { motion } from 'framer-motion';
import { Mood, MOOD_AURAS } from '../config/stages';

interface AuraProps {
  uid: string; mood: Mood; cx: number; cy: number; radius: number;
  glowBoost: number; calm?: number; reduced?: boolean;
}

const MOOD_TRANSITION = { duration: 2, ease: 'easeInOut' as const };

export default function Aura({ uid, mood, cx, cy, radius, glowBoost, calm = 1, reduced }: AuraProps) {
  const auraKey = mood ?? 'neutral';
  const aura = mood ? MOOD_AURAS[mood] : null;
  const baseOpacity = (aura?.opacity ?? 0.18) * glowBoost * calm;

  return (
    <g aria-hidden="true">
      <defs>
        {(['sun', 'rain', 'storm', 'rainbow', 'moon', 'neutral'] as const).map((m) => {
          const a = m === 'neutral' ? { inner: '#FFC978', outer: 'rgba(255,201,120,0)', opacity: 0.18 } : MOOD_AURAS[m];
          return (
            <radialGradient key={m} id={`${uid}-aura-${m}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={a.inner} stopOpacity={a.opacity} />
              <stop offset="55%" stopColor={a.inner} stopOpacity={a.opacity * 0.45} />
              <stop offset="100%" stopColor={a.outer} stopOpacity={0} />
            </radialGradient>
          );
        })}
      </defs>
      {(['sun', 'rain', 'storm', 'rainbow', 'moon', 'neutral'] as const).map((m) => (
        <motion.circle key={m} cx={cx} cy={cy} r={radius} fill={`url(#${uid}-aura-${m})`} initial={false}
          animate={{ opacity: m === auraKey ? baseOpacity : 0, scale: reduced ? 1 : [1, 1.03, 1] }}
          transition={{ opacity: MOOD_TRANSITION, scale: reduced ? { duration: 0 } : { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
          style={{ transformOrigin: `${cx}px ${cy}px`, mixBlendMode: 'screen' as const }}
        />
      ))}
    </g>
  );
}