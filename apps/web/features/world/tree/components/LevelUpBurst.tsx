'use client';

import { motion } from 'framer-motion';

export default function LevelUpBurst({ triggerKey, bx, by, cx, cy, reduced }: {
  triggerKey: string; bx: number; by: number; cx: number; cy: number; reduced: boolean;
}) {
  if (triggerKey === '0-0') return null;
  return (
    <motion.g key={triggerKey} style={{ pointerEvents: 'none' }}>
      {/* Кольца роста от основания */}
      {[0, 0.25, 0.5].map((delay, i) => (
        <motion.circle key={i} cx={bx} cy={by} r={30} fill="none" stroke="#FFC978" strokeWidth={2.5 - i * 0.6}
          initial={{ opacity: 0.7, scale: 0.3 }} animate={{ opacity: 0, scale: 3.2 + i }}
          transition={{ duration: 1.8, delay, ease: 'easeOut' }}
          style={{ transformOrigin: `${bx}px ${by}px` }} />
      ))}

      {/* Столб света */}
      <motion.rect x={bx - 26} y={cy} width={52} height={by - cy} fill="#FFE9A8"
        initial={{ opacity: 0 }} animate={{ opacity: [0, 0.28, 0] }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
        style={{ filter: 'blur(6px)' }} />

      {/* Золотые искры вверх */}
      {!reduced && Array.from({ length: 14 }).map((_, i) => {
        const off = (i - 7) * 22;
        return (
          <motion.circle key={i} cx={bx + off * 0.4} cy={by} r={2 + (i % 3)} fill={i % 2 ? '#FFD98A' : '#FFC978'}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: -(by - cy) * (0.6 + (i % 4) * 0.12), x: off }}
            transition={{ duration: 1.6 + (i % 3) * 0.3, delay: (i % 5) * 0.08, ease: 'easeOut' }} />
        );
      })}

      {/* Вспышка в кроне */}
      <motion.circle cx={cx} cy={cy} r={60} fill="#FFF3D6"
        initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: [0, 0.5, 0], scale: [0.4, 1.6, 2] }}
        transition={{ duration: 1.4, delay: 0.3, ease: 'easeOut' }}
        style={{ transformOrigin: `${cx}px ${cy}px`, filter: 'blur(8px)' }} />
    </motion.g>
  );
}