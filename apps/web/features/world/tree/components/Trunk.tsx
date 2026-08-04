'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';
import { BARK, Season, TimeOfDay } from '../config/stages';
import { TreeGeometry } from '../lib/geometry';

interface TrunkProps {
  uid: string; geo: TreeGeometry; glow: number; level: number;
  timeOfDay: TimeOfDay; season: Season; reduced?: boolean; calm?: number;
  onTap?: () => void; onLongPress?: () => void;
  barkPalette?: { base: string; light: string; dark: string };
}

export default function Trunk({
  uid, geo, glow, level, season, reduced, calm = 1, onTap, onLongPress, barkPalette,
}: TrunkProps) {
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bark = barkPalette ?? BARK;
  const trunk = geo.branches.find((b) => b.id === 'b-trunk');
  if (!trunk) return null;

  const showVeins = level >= 4;
  const showMoss = level >= 5;
  const showHollow = level >= 6;
  const breathPulse = level >= 7;

  const startPress = () => {
    if (reduced) return;
    pressTimerRef.current = setTimeout(() => { onLongPress?.(); pressTimerRef.current = null; }, 600);
  };
  const cancelPress = () => {
    if (pressTimerRef.current) { clearTimeout(pressTimerRef.current); pressTimerRef.current = null; }
  };

  return (
    <g role="presentation" shapeRendering="geometricPrecision"
      onPointerDown={startPress} onPointerUp={cancelPress} onPointerLeave={cancelPress} onPointerCancel={cancelPress}
      onClick={(e) => { e.stopPropagation(); if (pressTimerRef.current === null) return; cancelPress(); onTap?.(); }}
      style={{ cursor: 'pointer' }}
    >
      <defs>
        <linearGradient id={`${uid}-trunk-grad`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={bark.dark} /><stop offset="35%" stopColor={bark.base} />
          <stop offset="60%" stopColor={bark.light} /><stop offset="100%" stopColor={bark.dark} />
        </linearGradient>
        <linearGradient id={`${uid}-trunk-vein`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#FFC978" stopOpacity={0} />
          <stop offset="40%" stopColor="#FFC978" stopOpacity={0.85} />
          <stop offset="100%" stopColor="#FFE0A8" stopOpacity={0.95} />
        </linearGradient>
        <radialGradient id={`${uid}-hollow-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE0A8" stopOpacity="1" />
          <stop offset="100%" stopColor="#FFC978" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g opacity={0.9}>
        {geo.roots.map((r) => (
          <path key={r.id} d={r.d} stroke={bark.base} strokeWidth={Math.max(2.5, r.width)} strokeLinecap="round" fill="none" />
        ))}
      </g>

      <motion.path d={trunk.d} stroke={`url(#${uid}-trunk-grad)`} strokeWidth={trunk.width} strokeLinecap="round" fill="none"
        animate={breathPulse && !reduced ? {
          filter: ['drop-shadow(0 0 6px rgba(255,201,120,0.35))', 'drop-shadow(0 0 16px rgba(255,201,120,0.65))', 'drop-shadow(0 0 6px rgba(255,201,120,0.35))'],
        } : {}}
        transition={breathPulse ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />

      {level >= 2 && (
        <g opacity={0.4} stroke={bark.dark} strokeWidth={0.6} fill="none">
          {Array.from({ length: Math.min(level * 2, 12) }).map((_, i) => {
            const t = (i + 1) / 13;
            const x = trunk.x1 + (trunk.x2 - trunk.x1) * t;
            const yTop = trunk.y1 + (trunk.y2 - trunk.y1) * (t + 0.06);
            const yBot = trunk.y1 + (trunk.y2 - trunk.y1) * (t - 0.06);
            return <line key={i} x1={x - trunk.width * 0.18} y1={yBot} x2={x + trunk.width * 0.1} y2={yTop} />;
          })}
        </g>
      )}

      {showVeins && (
        <motion.g opacity={glow * calm}
          animate={reduced ? {} : { opacity: [glow * calm * 0.8, glow * calm, glow * calm * 0.8] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
          {[0.3, 0.55, 0.78].map((t, i) => {
            const x = trunk.x1 + (trunk.x2 - trunk.x1) * t;
            const yTop = trunk.y1 + (trunk.y2 - trunk.y1) * (t + 0.12);
            const yBot = trunk.y1 + (trunk.y2 - trunk.y1) * (t - 0.05);
            return (
              <path key={i} d={`M ${x - trunk.width * 0.25} ${yBot} Q ${x} ${(yBot + yTop) / 2}, ${x + trunk.width * 0.15} ${yTop}`}
                stroke={`url(#${uid}-trunk-vein)`} strokeWidth={Math.max(1, trunk.width * 0.08)} fill="none" strokeLinecap="round" />
            );
          })}
        </motion.g>
      )}

      {showMoss && (
        <g opacity={0.55}>
          {[-0.3, 0.2, 0.5].map((off, i) => (
            <ellipse key={i} cx={trunk.x1 + (trunk.x2 - trunk.x1) * 0.3 + off * trunk.width}
              cy={trunk.y1 - (trunk.y1 - trunk.y2) * 0.25 + i * 8} rx={trunk.width * 0.22} ry={trunk.width * 0.12} fill="#6B8F5E" />
          ))}
        </g>
      )}

      {showHollow && (
        <g>
          <ellipse cx={trunk.x1 + (trunk.x2 - trunk.x1) * 0.5 - trunk.width * 0.15}
            cy={trunk.y1 - (trunk.y1 - trunk.y2) * 0.35} rx={trunk.width * 0.18} ry={trunk.width * 0.26} fill={bark.dark} />
          <motion.circle cx={trunk.x1 + (trunk.x2 - trunk.x1) * 0.5 - trunk.width * 0.15}
            cy={trunk.y1 - (trunk.y1 - trunk.y2) * 0.35} r={trunk.width * 0.14} fill={`url(#${uid}-hollow-glow)`}
            animate={reduced ? {} : { opacity: [0.6, 1, 0.6], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
        </g>
      )}

      {season === 'winter' && (
        <path d={`M ${trunk.x2 - trunk.width * 0.5} ${trunk.y2}
            Q ${trunk.x2} ${trunk.y2 - 4}, ${trunk.x2 + trunk.width * 0.5} ${trunk.y2}
            L ${trunk.x2 + trunk.width * 0.3} ${trunk.y2 + 3}
            Q ${trunk.x2} ${trunk.y2 + 1}, ${trunk.x2 - trunk.width * 0.3} ${trunk.y2 + 3} Z`}
          fill="#F5FBFF" opacity={0.92} />
      )}
    </g>
  );
}