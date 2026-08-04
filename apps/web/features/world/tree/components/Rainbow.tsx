'use client';

import { motion } from 'framer-motion';

const CX = 400;
const CY = 640;
const GROUND_Y = 900;

const BANDS = [
  { color: '#FF4B3E', r: 480 }, { color: '#FF8A2A', r: 468 }, { color: '#FFD23E', r: 456 },
  { color: '#58C96B', r: 444 }, { color: '#3EA8FF', r: 432 }, { color: '#4A5BE0', r: 420 },
  { color: '#9B4DDB', r: 408 },
];

function bandPath(r: number): string {
  const dy = GROUND_Y - CY;
  const dx = Math.sqrt(Math.max(0, r * r - dy * dy));
  return `M ${(CX - dx).toFixed(1)} ${GROUND_Y} A ${r} ${r} 0 1 1 ${(CX + dx).toFixed(1)} ${GROUND_Y}`;
}

interface RainbowProps { layer: 'back' | 'front'; reduced: boolean; }

export default function Rainbow({ layer, reduced }: RainbowProps) {
  const isBack = layer === 'back';
  return (
    <motion.g aria-hidden="true"
      style={{ pointerEvents: 'none', transformOrigin: `${CX}px ${CY}px`, mixBlendMode: isBack ? ('normal' as const) : ('screen' as const) }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 1.2 } }}
      transition={{ duration: 1.6, ease: 'easeOut' }}
    >
      {isBack ? (
        <>
          <path d={bandPath(486)} fill="none" stroke="#FFFFFF" strokeWidth={95} strokeLinecap="round" opacity={0.05} />
          {BANDS.map((band, i) => (
            <motion.path key={i} d={bandPath(band.r)} fill="none" stroke={band.color} strokeWidth={11.5} strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: reduced ? 0.55 : [0.5, 0.68, 0.5] }}
              transition={{
                pathLength: { duration: 1.6, delay: i * 0.1, ease: 'easeOut' },
                opacity: reduced ? { duration: 1.6, delay: i * 0.1 } : { duration: 5, delay: 1.8 + i * 0.1, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
          ))}
        </>
      ) : (
        BANDS.map((band, i) => (
          <motion.path key={i} d={bandPath(band.r)} fill="none" stroke={band.color} strokeWidth={14} strokeLinecap="round"
            initial={{ opacity: 0 }} animate={{ opacity: 0.13 }}
            transition={{ duration: 1.8, delay: 0.6 + i * 0.08 }} />
        ))
      )}
    </motion.g>
  );
}