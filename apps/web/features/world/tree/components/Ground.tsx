'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Season, TimeOfDay, SKY_PALETTES } from '../config/stages';
import { mulberry32 } from '../lib/random';

interface GroundProps {
  uid: string; season: Season; timeOfDay: TimeOfDay; seed: number;
  streakFire: number; baseWidth?: number;
}

const GROUND_COLORS: Record<Season, { top: string; bottom: string; grass: string[]; patch: string }> = {
  spring: { top: '#8FD6A6', bottom: '#5FBF8A', grass: ['#6FBF8A', '#8FD6A6', '#A7E6BD'], patch: '#4A6B52' },
  summer: { top: '#5FBF8A', bottom: '#3E9E6E', grass: ['#3E9E6E', '#5FBF8A', '#7FD3A0'], patch: '#3E5C46' },
  autumn: { top: '#C9985A', bottom: '#A87840', grass: ['#B08050', '#C9985A', '#D4A868'], patch: '#6B4E32' },
  winter: { top: '#EAF4F6', bottom: '#C8DDE0', grass: ['#BFD8DC', '#D9ECEF'], patch: '#9DB8BE' },
};

const FLOWER_COLORS = ['#FFD3E0', '#FF9EB5', '#FFF3D6', '#F2789F'];

export default function Ground({ uid, season, timeOfDay, seed, streakFire, baseWidth = 20 }: GroundProps) {
  const colors = GROUND_COLORS[season];
  const sky = SKY_PALETTES[timeOfDay];

  const grassBlades = useMemo(() => {
    const rng = mulberry32(seed ^ 0x6a5d);
    const count = season === 'winter' ? 10 : 22;
    return Array.from({ length: count }, () => ({
      x: 40 + rng() * 720, h: 6 + rng() * 12, lean: (rng() - 0.5) * 8,
      color: colors.grass[Math.floor(rng() * colors.grass.length)]!,
    }));
  }, [seed, colors, season]);

  const snowBumps = useMemo(() => {
    if (season !== 'winter') return [];
    const rng = mulberry32(seed ^ 0x77aa);
    return Array.from({ length: 7 }, () => ({
      x: 40 + rng() * 720, y: 928 + rng() * 42, rx: 30 + rng() * 55, ry: 7 + rng() * 9,
    }));
  }, [seed, season]);

  const snowSparkles = useMemo(() => {
    if (season !== 'winter') return [];
    const rng = mulberry32(seed ^ 0x1ce5);
    return Array.from({ length: 10 }, () => ({
      x: 60 + rng() * 680, y: 920 + rng() * 55, r: 0.6 + rng() * 0.9, phase: rng(),
    }));
  }, [seed, season]);

  const flowers = useMemo(() => {
    if (season !== 'spring' && season !== 'summer') return [];
    const rng = mulberry32(seed ^ 0xf10a);
    return Array.from({ length: 6 }, () => ({
      x: 80 + rng() * 640, y: 926 + rng() * 42, h: 6 + rng() * 7,
      color: FLOWER_COLORS[Math.floor(rng() * FLOWER_COLORS.length)]!, phase: rng(),
    }));
  }, [seed, season]);

  const fallenLeaves = useMemo(() => {
    if (season !== 'autumn') return [];
    const rng = mulberry32(seed ^ 0x9c7);
    return Array.from({ length: 8 }, () => ({
      x: 70 + rng() * 660, y: 924 + rng() * 48, rot: rng() * 360, s: 3 + rng() * 3,
      color: ['#E0704A', '#F2A65A', '#C94F3D'][Math.floor(rng() * 3)]!,
    }));
  }, [seed, season]);

  const speckles = useMemo(() => {
    const rng = mulberry32(seed ^ 0x5eed);
    return Array.from({ length: 5 }, () => ({
      x: 100 + rng() * 600, y: 932 + rng() * 46, rx: 2 + rng() * 3.5, ry: 1 + rng() * 1.4,
    }));
  }, [seed]);

  const bladesA = grassBlades.filter((_, i) => i % 2 === 0);
  const bladesB = grassBlades.filter((_, i) => i % 2 === 1);
  const patchRx = 30 + baseWidth * 1.15;
  const patchRy = 8 + baseWidth * 0.16;

  return (
    <g shapeRendering="geometricPrecision">
      <defs>
        <linearGradient id={`${uid}-ground`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colors.top} /><stop offset="100%" stopColor={colors.bottom} />
        </linearGradient>
        <radialGradient id={`${uid}-ground-glow`} cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#FFE9A8" stopOpacity={0.2 * sky.glowBoost + streakFire * 0.16} />
          <stop offset="100%" stopColor="#FFE9A8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-streak-warm`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFC978" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#FFC978" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FFC978" stopOpacity="0" />
        </radialGradient>
      </defs>

      <path d="M -20 930 Q 200 872 430 904 Q 640 934 820 892 L 820 1010 L -20 1010 Z" fill={`url(#${uid}-ground)`} opacity={0.5} />
      <path d="M -20 1010 L -20 952 Q 180 900 400 906 Q 620 914 820 942 L 820 1010 Z" fill={`url(#${uid}-ground)`} />

      <g fill={colors.patch} opacity={0.35}>
        {speckles.map((s, i) => <ellipse key={i} cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} />)}
      </g>

      <ellipse cx={400} cy={924} rx={260} ry={46} fill={`url(#${uid}-ground-glow)`} />

      {/* Контактный диск */}
      <g>
        <ellipse cx={400} cy={909} rx={patchRx * 1.7} ry={patchRy * 1.9} fill={colors.patch} opacity={0.14} />
        <ellipse cx={400} cy={908} rx={patchRx} ry={patchRy} fill={colors.patch} opacity={0.32} />
        <ellipse cx={400} cy={907} rx={patchRx * 0.55} ry={patchRy * 0.6} fill={colors.patch} opacity={0.3} />
      </g>

      {/* Стрик: тёплые искры из почвы */}
      {streakFire > 0 && (
        <g opacity={streakFire}>
          <motion.ellipse cx={400} cy={907} rx={patchRx * 1.5} ry={patchRy * 1.6} fill={`url(#${uid}-streak-warm)`}
            animate={{ opacity: [0.35, 0.6, 0.35] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }} />
          {[
            { x: 400 - baseWidth * 0.9, delay: 0 }, { x: 400 - baseWidth * 0.3, delay: 0.9 },
            { x: 400 + baseWidth * 0.4, delay: 1.7 }, { x: 400 + baseWidth * 1.0, delay: 0.5 },
          ].map((m, i) => (
            <motion.circle key={i} cx={m.x} cy={906} r={1.6} fill="#FFD98A"
              animate={{ y: [0, -26 - i * 6], opacity: [0, 0.9, 0], x: [0, i % 2 === 0 ? 5 : -5] }}
              transition={{ duration: 2.4, repeat: Infinity, delay: m.delay, ease: 'easeOut' }} />
          ))}
        </g>
      )}

      {snowBumps.map((b, i) => (
        <g key={i}>
          <ellipse cx={b.x} cy={b.y} rx={b.rx} ry={b.ry} fill="#F5FBFF" opacity={0.92} />
          <ellipse cx={b.x - b.rx * 0.2} cy={b.y - b.ry * 0.3} rx={b.rx * 0.5} ry={b.ry * 0.4} fill="#FFFFFF" opacity={0.7} />
        </g>
      ))}

      {snowSparkles.map((s, i) => (
        <motion.circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#FFFFFF"
          animate={{ opacity: [0.15, 0.9, 0.15] }}
          transition={{ duration: 2.2 + s.phase * 3, repeat: Infinity, delay: s.phase * 2.5, ease: 'easeInOut' }} />
      ))}

      {fallenLeaves.map((l, i) => (
        <path key={i} d={`M 0 0 q ${l.s} -${l.s * 1.2} ${l.s * 2} 0 q -${l.s} ${l.s * 1.2} -${l.s * 2} 0 z`}
          transform={`translate(${l.x} ${l.y}) rotate(${l.rot})`} fill={l.color} opacity={0.75} />
      ))}

      <motion.g style={{ transformOrigin: '400px 950px' }} animate={{ rotate: [0, 1.1, 0, -1.1, 0] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', times: [0, 0.25, 0.5, 0.75, 1] }}>
        {bladesA.map((b, i) => (
          <path key={i} d={`M ${b.x} 948 q ${b.lean * 0.4} ${-b.h * 0.6}, ${b.lean} ${-b.h}`}
            stroke={b.color} strokeWidth={1.6} strokeLinecap="round" fill="none" opacity={0.8} />
        ))}
      </motion.g>
      <motion.g style={{ transformOrigin: '400px 950px' }} animate={{ rotate: [0, -1.3, 0, 1.3, 0] }}
        transition={{ duration: 6.6, repeat: Infinity, ease: 'easeInOut', delay: 0.7, times: [0, 0.25, 0.5, 0.75, 1] }}>
        {bladesB.map((b, i) => (
          <path key={i} d={`M ${b.x} 950 q ${b.lean * 0.4} ${-b.h * 0.6}, ${b.lean} ${-b.h}`}
            stroke={b.color} strokeWidth={1.4} strokeLinecap="round" fill="none" opacity={0.7} />
        ))}
      </motion.g>

      {flowers.length > 0 && (
        <motion.g style={{ transformOrigin: '400px 960px' }} animate={{ rotate: [0, 0.9, 0, -0.9, 0] }}
          transition={{ duration: 5.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3, times: [0, 0.25, 0.5, 0.75, 1] }}>
          {flowers.map((f, i) => (
            <g key={i}>
              <path d={`M ${f.x} ${f.y} q 1.5 ${-f.h * 0.5}, 0 ${-f.h}`} stroke={colors.grass[0]} strokeWidth={1} fill="none" strokeLinecap="round" opacity={0.7} />
              <circle cx={f.x} cy={f.y - f.h} r={2.4} fill={f.color} opacity={0.9} />
              <circle cx={f.x} cy={f.y - f.h} r={0.9} fill="#FFF3D6" opacity={0.9} />
            </g>
          ))}
        </motion.g>
      )}
    </g>
  );
}