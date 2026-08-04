'use client';

import { motion } from 'framer-motion';
import { HangingItem } from '../config/stages';

// Контурные значки висящих элементов — вместо эмодзи. Рендерятся внутри
// SVG-сцены, наследуют цвет через `stroke="currentColor"`.
const KIND_PATH: Record<string, React.ReactNode> = {
  surprise: (
    <>
      <rect x="4" y="10.5" width="16" height="9" rx="1.5" />
      <path d="M4 15h16M12 10.5v9" />
      <path d="M12 10.5c-3.5 0-5.5-2-5.5-3.5S9 5 10.5 6C11 6.5 12 8.5 12 10.5Z" />
      <path d="M12 10.5c3.5 0 5.5-2 5.5-3.5S15 5 13.5 6C13 6.5 12 8.5 12 10.5Z" />
    </>
  ),
  memory: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7.5 7.5 5.5 7.5-5.5" />
    </>
  ),
  coupon: (
    <>
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 0 0 3V14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5a1.5 1.5 0 0 0 0-3V8Z" />
      <path d="M12 6v12" strokeDasharray="2 2" />
    </>
  ),
  date: (
    <>
      <rect x="4" y="5.5" width="16" height="15" rx="2.5" />
      <path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" />
      <path d="M9 15.5h.01M12.5 15.5h.01M16 15.5h.01" strokeWidth="2.4" />
    </>
  ),
};

interface Props {
  items: HangingItem[];
  anchors: { x: number; y: number }[];
  reduced: boolean;
  onItemOpen?: (item: HangingItem) => void;
}

export default function HangingItems({ items, anchors, reduced, onItemOpen }: Props) {
  return (
    <g>
      {items.map((item) => {
        const a = anchors[item.anchor % anchors.length];
        if (!a) return null;
        const amp = reduced ? 0 : 3;
        return (
          <motion.g
            key={item.id}
            role="button"
            tabIndex={0}
            aria-label={`Открыть: ${item.kind}`}
            style={{ transformOrigin: `${a.x}px ${a.y}px`, cursor: 'pointer' }}
            animate={{ rotate: [-amp, amp, -amp] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            onClick={() => onItemOpen?.(item)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onItemOpen?.(item); }}
            whileHover={reduced ? {} : { scale: 1.12 }}
          >
            <line x1={a.x} y1={a.y} x2={a.x} y2={a.y + 26} stroke="#8a6a4a" strokeWidth={1.2} />
            <g transform={`translate(${a.x} ${a.y + 38})`}>
              <circle r={14} fill="#FFFFFF" stroke="#F2789F" strokeWidth={1.5} opacity={0.95} />
              <g
                fill="none"
                stroke="#F2789F"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="translate(-9 -9) scale(0.75)"
              >
                {KIND_PATH[item.kind] ?? KIND_PATH.surprise}
              </g>
            </g>
          </motion.g>
        );
      })}
    </g>
  );
}
