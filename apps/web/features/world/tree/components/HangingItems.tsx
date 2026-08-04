'use client';

import { motion } from 'framer-motion';
import { HangingItem } from '../config/stages';

const KIND_ICON: Record<string, string> = { surprise: '🎁', memory: '📷', coupon: '🎟️', date: '💌' };

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
              <text textAnchor="middle" dominantBaseline="central" fontSize={14}>
                {KIND_ICON[item.kind] ?? '🎀'}
              </text>
            </g>
          </motion.g>
        );
      })}
    </g>
  );
}