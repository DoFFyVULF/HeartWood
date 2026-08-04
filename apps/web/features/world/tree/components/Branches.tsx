'use client';

import { motion } from 'framer-motion';
import { BARK, TimeOfDay } from '../config/stages';
import { TreeGeometry } from '../lib/geometry';

interface BranchesProps {
  geo: TreeGeometry; growing: boolean; sway: number; idleScale: number;
  reduced: boolean; calm: number; timeOfDay: TimeOfDay;
  barkPalette?: { base: string; light: string; dark: string };
}

export default function Branches({
  geo, growing, sway, idleScale, reduced, calm, timeOfDay, barkPalette,
}: BranchesProps) {
  const branches = geo.branches.filter((b) => b.id !== 'b-trunk');
  const bark = barkPalette ?? BARK;
  const barkColor = timeOfDay === 'night' ? bark.light : bark.base;
  const barkDark = timeOfDay === 'night' ? bark.base : bark.dark;

  return (
    <g shapeRendering="geometricPrecision">
      {branches.map((branch, i) => {
        const width = Math.max(2.5, branch.width);
        const depthFactor = Math.min(1, (i + 1) / branches.length);
        const amp = reduced ? 0 : sway * depthFactor * 0.4 * idleScale * calm;
        const growDelay = growing ? (i / branches.length) * 0.8 : 0;
        return (
          <motion.g key={branch.id} style={{ transformOrigin: `${branch.x1}px ${branch.y1}px` }}
            animate={reduced ? {} : { rotate: [0, amp, 0, -amp, 0] }}
            transition={reduced ? undefined : {
              duration: (4 + depthFactor * 3) / idleScale, repeat: Infinity,
              ease: 'easeInOut', times: [0, 0.25, 0.5, 0.75, 1], delay: depthFactor * 0.5,
            }}>
            <path d={branch.d} stroke={barkDark} strokeWidth={width + 1} strokeLinecap="round" fill="none" opacity={0.3} />
            <motion.path d={branch.d} stroke={barkColor} strokeWidth={width} strokeLinecap="round" fill="none"
              initial={growing ? { pathLength: 0, opacity: 0 } : false}
              animate={growing ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
              transition={growing ? { duration: 0.8, delay: growDelay, ease: 'easeOut' } : undefined} />
            {width > 4 && (
              <path d={branch.d} stroke={bark.light} strokeWidth={Math.max(1, width * 0.3)} strokeLinecap="round" fill="none" opacity={0.35} />
            )}
          </motion.g>
        );
      })}

      {/* Поникшие пряди ивы */}
      {geo.strands.map((s, i) => {
        const parts = s.d.split(' ');
        const ox = parseFloat(parts[1]) || 0;
        const oy = parseFloat(parts[2]) || 0;
        return (
          <motion.path key={i} d={s.d} stroke={barkColor} strokeWidth={s.width} strokeLinecap="round" fill="none" opacity={0.75}
            animate={reduced ? {} : { rotate: [0, 1.6, 0, -1.6, 0] }}
            transition={reduced ? undefined : {
              duration: 5 + (i % 3), repeat: Infinity, ease: 'easeInOut',
              times: [0, 0.25, 0.5, 0.75, 1], delay: (i % 4) * 0.4,
            }}
            style={{ transformOrigin: `${ox}px ${oy}px` }} />
        );
      })}
    </g>
  );
}