'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { TreeEvent } from '../config/stages';

const EVENT_EMOJI: Record<string, string> = {
  message: '💬', date: '💌', coupon: '🎟️', memory: '📷', voice: '🎙️', milestone: '⭐',
};

export default function EventBurst({ event, cx, cy, reduced }: {
  event?: TreeEvent; cx: number; cy: number; reduced: boolean;
}) {
  if (!event) return null;
  return (
    <AnimatePresence>
      <motion.g key={event.at} style={{ pointerEvents: 'none' }}>
        <motion.circle cx={cx} cy={cy} r={20} fill="none" stroke="#FFC978" strokeWidth={2}
          initial={{ opacity: 0.8, scale: 0.4 }} animate={{ opacity: 0, scale: 2.2 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          style={{ transformOrigin: `${cx}px ${cy}px` }} />
        <motion.g
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], y: -70, scale: 1.2 }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}>
          <text x={cx} y={cy} textAnchor="middle" fontSize={30}>
            {EVENT_EMOJI[event.type] ?? '✨'}
          </text>
        </motion.g>
        {!reduced && Array.from({ length: 8 }).map((_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <motion.circle key={i} cx={cx} cy={cy} r={2.5} fill="#FFD98A"
              initial={{ opacity: 1, x: 0, y: 0 }}
              animate={{ opacity: 0, x: Math.cos(a) * 70, y: Math.sin(a) * 70 }}
              transition={{ duration: 1.1, ease: 'easeOut' }} />
          );
        })}
      </motion.g>
    </AnimatePresence>
  );
}