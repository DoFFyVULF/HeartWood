'use client';

import { motion } from 'framer-motion';
import { Season, TimeOfDay, SEASON_PALETTES, SKY_PALETTES } from '../config/stages';
import { TreeGeometry } from '../lib/geometry';

interface CanopyProps {
  uid: string; geo: TreeGeometry; season: Season; timeOfDay: TimeOfDay;
  glow: number; popping: boolean; reduced: boolean; calm: number;
  leafPalette?: [string, string, string];
  flowerColors?: string[];
  flowersOverLeaves?: boolean;
  fruitColor?: string;
  fruitGlowColor?: string;
}

function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + amt);
  const g = Math.min(255, ((n >> 8) & 255) + amt);
  const b = Math.min(255, (n & 255) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function darken(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 255) - amt);
  const g = Math.max(0, ((n >> 8) & 255) - amt);
  const b = Math.max(0, (n & 255) - amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export default function Canopy({
  uid, geo, season, timeOfDay, glow, popping, reduced, calm,
  leafPalette, flowerColors, flowersOverLeaves, fruitColor, fruitGlowColor,
}: CanopyProps) {
  const sp = SEASON_PALETTES[season];
  const sky = SKY_PALETTES[timeOfDay];
  const baseLeaf = leafPalette ?? sp.leaf;
  const flowers = flowerColors ?? sp.flower;

  // Ночью крона темнеет за счёт самой палитры (без эллипса-оверлея).
  const nightDim = Math.round(sky.stars * 55);
  const leafBase: [string, string, string] = flowersOverLeaves
    ? [lighten(flowers[0] ?? baseLeaf[0], 45), flowers[0] ?? baseLeaf[0], flowers[1] ?? baseLeaf[1]]
    : baseLeaf;
  const leaf: [string, string, string] = nightDim > 0
    ? [darken(leafBase[0], nightDim), darken(leafBase[1], nightDim), darken(leafBase[2], nightDim)]
    : leafBase;

  const fruit = fruitColor ?? sp.fruit;
  const fruitGlow = fruitGlowColor ?? sp.fruitGlow;

  // Мягкая тень допустима только при достаточно пышной кроне —
  // иначе на молодых деревьях она выглядит отдельным овалом.
  const showUnderShadow = geo.leafClusters.length >= 5;

  return (
    <g shapeRendering="geometricPrecision">
      <defs>
        {[0, 1, 2].map((t) => (
          <radialGradient key={t} id={`${uid}-leaf-${t}`} cx="50%" cy="38%" r="65%">
            <stop offset="0%" stopColor={lighten(leaf[t], 20)} stopOpacity="0.95" />
            <stop offset="62%" stopColor={leaf[t]} stopOpacity="0.9" />
            <stop offset="100%" stopColor={leaf[t]} stopOpacity="0" />
          </radialGradient>
        ))}
        <radialGradient id={`${uid}-canopy-glow`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#FFE9A8" stopOpacity={0.3 * glow * calm} />
          <stop offset="100%" stopColor="#FFE9A8" stopOpacity="0" />
        </radialGradient>
        {/* Мягкая тень нижней части кроны — без жёсткого края */}
        <radialGradient id={`${uid}-canopy-shadow`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor={leaf[2]} stopOpacity="0.26" />
          <stop offset="100%" stopColor={leaf[2]} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={geo.canopyCenter.x} cy={geo.canopyCenter.y} r={geo.canopyRadius * 1.2} fill={`url(#${uid}-canopy-glow)`} />

      {/* Мягкие доли кроны */}
      <motion.g
        animate={popping && !reduced ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={popping ? { duration: 0.9, ease: 'easeOut' } : undefined}
        style={{ transformOrigin: `${geo.canopyCenter.x}px ${geo.canopyCenter.y}px` }}>
        {geo.leafClusters.map((c, i) => (
          <ellipse key={i} cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill={`url(#${uid}-leaf-${c.tier})`} />
        ))}
        {showUnderShadow && (
          <ellipse
            cx={geo.canopyCenter.x}
            cy={geo.canopyCenter.y + geo.canopyRadius * 0.4}
            rx={geo.canopyRadius * 0.75}
            ry={geo.canopyRadius * 0.3}
            fill={`url(#${uid}-canopy-shadow)`}
          />
        )}
      </motion.g>

      {/* Цветы по краю кроны */}
      {geo.flowers.map((f, i) => {
        const color = flowers[i % flowers.length]!;
        return (
          <motion.g key={i}
            initial={popping ? { scale: 0, opacity: 0 } : false}
            animate={popping ? { scale: [0, 1.3, 1], opacity: 1 } : { scale: 1, opacity: 1 }}
            transition={popping ? { duration: 0.7, delay: 0.1 + (i % 8) * 0.05, ease: 'backOut' } : undefined}
            style={{ transformOrigin: `${f.x}px ${f.y}px` }}>
            {[0, 72, 144, 216, 288].map((a) => (
              <circle key={a}
                cx={f.x + Math.cos((a * Math.PI) / 180) * f.r * 0.55}
                cy={f.y + Math.sin((a * Math.PI) / 180) * f.r * 0.55}
                r={f.r * 0.5} fill={color} opacity={0.9} />
            ))}
            <circle cx={f.x} cy={f.y} r={f.r * 0.38} fill="#FFE9A8" opacity={0.95} />
          </motion.g>
        );
      })}

      {/* Плоды-фонарики */}
      {geo.fruits.map((fr, i) => (
        <g key={i}>
          <circle cx={fr.x} cy={fr.y} r={fr.r * 1.9} fill={fruitGlow} opacity={0.25 * glow * calm} />
          <motion.circle cx={fr.x} cy={fr.y} r={fr.r} fill={fruit}
            animate={reduced ? {} : { opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 2.4 + (i % 4) * 0.5, repeat: Infinity, ease: 'easeInOut', delay: (i % 5) * 0.3 }} />
          <circle cx={fr.x - fr.r * 0.3} cy={fr.y - fr.r * 0.3} r={fr.r * 0.3} fill="#FFFFFF" opacity={0.5} />
        </g>
      ))}
    </g>
  );
}