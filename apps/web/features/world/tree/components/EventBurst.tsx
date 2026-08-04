'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { TreeEvent } from '../config/stages';

// Контурные значки событий — вместо эмодзи. Спавнятся над кроной, наследуют
// цвет через `stroke="currentColor"`.
const EVENT_PATH: Record<string, React.ReactNode> = {
  message: (
    <>
      <path d="M4 5.5h16A1.5 1.5 0 0 1 21.5 7v8a1.5 1.5 0 0 1-1.5 1.5H11l-4.5 3.5v-3.5H4A1.5 1.5 0 0 1 2.5 15V7A1.5 1.5 0 0 1 4 5.5Z" />
    </>
  ),
  date: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
      <path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" />
    </>
  ),
  coupon: (
    <>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 0 0 3V14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5a1.5 1.5 0 0 0 0-3V8Z" />
      <path d="M12 6v12" strokeDasharray="2 2" />
    </>
  ),
  memory: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
    </>
  ),
  voice: (
    <>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M5.5 12a6.5 6.5 0 0 0 13 0" />
      <path d="M12 18.5V21" />
    </>
  ),
  milestone: (
    <>
      <path d="M12 3.5 14.6 9l6 .9-4.4 4.3 1.1 6L12 17.4l-5.3 2.8 1.1-6L3.4 9.9l6-.9L12 3.5Z" />
    </>
  ),
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
          <g
            fill="none"
            stroke="#FFC978"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`translate(${cx - 15} ${cy - 15}) scale(1.25)`}
          >
            {EVENT_PATH[event.type] ?? EVENT_PATH.milestone}
          </g>
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
