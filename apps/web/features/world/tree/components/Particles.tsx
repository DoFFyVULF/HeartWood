"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useParticles, Particle, ParticleKind } from "@/features/world/tree/hooks/useParticles";
import {
  Season,
  TimeOfDay,
  Mood,
  SEASON_PALETTES,
  SKY_PALETTES,
} from "@/features/world/tree/config/stages";

const KIND_MAP: Record<string, ParticleKind> = {
  pollen: "pollen",
  petals: "petal",
  leaves: "leaf",
  snow: "snow",
  fireflies: "firefly",
  raindrop: "raindrop",
};

interface ParticlesProps {
  uid: string;
  season: Season;
  timeOfDay: TimeOfDay;
  mood: Mood;
  level: number;
  paused: boolean;
  reduced: boolean;
  calm: number;
  seed: number;
  speciesParticle?: {
    kind: ParticleKind;
    colors: string[];
    rateScale: number;
    allSeason: boolean;
  };
}

export default function Particles({
  uid,
  season,
  timeOfDay,
  mood,
  level,
  paused,
  reduced,
  calm,
  seed,
  speciesParticle,
}: ParticlesProps) {
  const sky = SKY_PALETTES[timeOfDay];
  const sp = SEASON_PALETTES[season];

  const config = useMemo(() => {
    const baseRate: Record<string, number> = {
      pollen: 3.5 * calm, petal: 2.2 * calm, leaf: 2.4 * calm, snow: 6 * calm,
      firefly: 0.6 * calm, raindrop: 30, spark: 0,
    };

    let kind: ParticleKind = 'pollen';
    let colors: string[] = ['#FFFFFF'];
    let rate = 2;

    if (speciesParticle) {
      kind = speciesParticle.kind;
      colors = speciesParticle.colors;
      rate = (baseRate[kind] ?? 2) * speciesParticle.rateScale;
      // Ночью светлячки заменяют лепестки/пыльцу (кроме вечноцветущих)
      if (!speciesParticle.allSeason && timeOfDay === 'night' && (season === 'summer' || season === 'autumn')) {
        kind = 'firefly';
        colors = ['#FFE066', '#FFC978', '#FFF3D6'];
        rate = baseRate.firefly;
      }
    } else {
      kind = KIND_MAP[sp.particle]!;
      if (season === 'summer' && timeOfDay === 'night') kind = 'firefly';
      if (season === 'summer' && (timeOfDay === 'dusk' || timeOfDay === 'dawn')) kind = KIND_MAP[sp.particleAlt ?? sp.particle]!;
      if (season === 'autumn' && timeOfDay === 'night') kind = 'firefly';
      if (season === 'winter') kind = 'snow';
      colors = {
        pollen: ['#FFE9A8', '#FFD98A', '#FFF3D6'],
        petal: sp.flower,
        leaf: [sp.leaf[1]!, sp.leaf[2]!, sp.leaf[0]!, '#D4813A', '#C96B2E'],
        snow: ['#FFFFFF', '#F0F8FF', '#E8F4FD', '#DCEEF8'],
        firefly: ['#FFE066', '#FFC978', '#FFF3D6'],
        raindrop: ['#7BAFD4', '#9CC4E4', '#B8D8F0', '#6A9FC8'],
        spark: ['#FFC978', '#FFD98A'],
      }[kind] ?? ['#FFFFFF'];
      rate = baseRate[kind] ?? 2;
    }

    if (mood === 'rain' || mood === 'storm') {
      kind = 'raindrop';
      colors = ['#7BAFD4', '#9CC4E4', '#B8D8F0', '#6A9FC8'];
      rate = 30;
    }

    return { kind, rate, colors };
  }, [season, timeOfDay, mood, sp, calm, speciesParticle]);

  const particles = useParticles({
    kind: config.kind,
    rate: config.rate,
    bounds: { w: 800, h: 1000 },
    colors: config.colors,
    paused: paused || reduced,
    speedScale: sky.idleScale,
    seed,
  });

  const showBird = level >= 4 && !reduced;
  const [birdKey, setBirdKey] = useState(0);
  useEffect(() => {
    if (!showBird) return;
    const start = setTimeout(() => setBirdKey((k) => k + 1), 0);
    const t = setInterval(() => setBirdKey((k) => k + 1), 25000);
    return () => {
      clearTimeout(start);
      clearInterval(t);
    };
  }, [showBird]);

  return (
    <g aria-hidden="true" style={{ pointerEvents: "none" }}>
      <g>
        {particles
          .filter((p) => p.alive)
          .map((p) => (
            <ParticleNode key={p.id} p={p} reduced={reduced} />
          ))}
      </g>

      {(mood === "rain" || mood === "storm") && !reduced && <RainSplashes />}

      <AnimatePresence>
        {showBird && (
          <motion.g
            key={`bird-${birdKey}`}
            initial={{ x: -60, y: 200, opacity: 0 }}
            animate={{ x: 860, y: 240, opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 14,
              ease: "linear",
              times: [0, 0.1, 0.9, 1],
            }}
          >
            <Bird />
          </motion.g>
        )}
      </AnimatePresence>

      {(mood === "moon" || timeOfDay === "night") && (
        <Moon uid={uid} mood={mood} reduced={reduced} />
      )}
      {mood === "storm" && <StormLightning uid={uid} reduced={reduced} />}
    </g>
  );
}

function Moon({
  uid,
  mood,
  reduced,
}: {
  uid: string;
  mood: Mood;
  reduced: boolean;
}) {
  const isMoonMood = mood === "moon";
  return (
    <motion.g
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: isMoonMood ? 0.95 : 0.7, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 2.5, ease: "easeOut" }}
    >
      <defs>
        <radialGradient id={`${uid}-moon-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF8E1" stopOpacity="0.5" />
          <stop offset="50%" stopColor="#FFF3C4" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FFF3C4" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${uid}-moon-body`} cx="38%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#FFFDE8" />
          <stop offset="60%" stopColor="#F5E6B8" />
          <stop offset="100%" stopColor="#E8D5A0" />
        </radialGradient>
      </defs>
      <circle cx={650} cy={110} r={80} fill={`url(#${uid}-moon-glow)`} />
      <circle cx={650} cy={110} r={34} fill={`url(#${uid}-moon-body)`} />
      {!isMoonMood && (
        <circle cx={664} cy={103} r={30} fill="#0B1E2A" opacity={0.8} />
      )}
      {isMoonMood && (
        <g opacity={0.12} fill="#C4A86A">
          <circle cx={640} cy={102} r={6} />
          <circle cx={660} cy={120} r={4} />
          <circle cx={648} cy={125} r={3} />
          <circle cx={663} cy={100} r={2.5} />
          <circle cx={638} cy={118} r={2} />
        </g>
      )}
      {!reduced && (
        <motion.circle
          cx={650}
          cy={110}
          r={38}
          fill="none"
          stroke="#FFF8E1"
          strokeWidth={1.2}
          animate={{ opacity: [0.15, 0.45, 0.15], scale: [1, 1.06, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "650px 110px" }}
        />
      )}
    </motion.g>
  );
}

const CLOUD_BACK_D =
  "M -40 -40 L 840 -40 L 840 118 C 772 156 716 130 660 148 C 598 170 538 136 478 154 C 412 176 348 138 286 156 C 222 174 158 140 98 158 C 54 170 8 148 -40 130 Z";
const CLOUD_MID_D =
  "M -40 -40 L 840 -40 L 840 82 C 762 126 700 94 636 114 C 570 138 506 100 440 120 C 372 144 306 104 240 122 C 174 142 110 106 48 124 C 14 132 -12 116 -40 102 Z";
const CLOUD_FRONT_D =
  "M -40 -40 L 840 -40 L 840 50 C 770 90 706 60 640 78 C 572 100 508 64 442 82 C 375 104 308 68 242 86 C 176 106 112 72 50 88 C 16 96 -12 80 -40 66 Z";
const SCUDS = [
  "M 118 170 q 22 -20 48 -9 q 26 -13 48 2 q 15 12 -7 16 q -48 11 -89 -9 z",
  "M 402 152 q 18 -16 40 -7 q 22 -11 40 2 q 13 10 -6 13 q -40 9 -74 -8 z",
  "M 636 176 q 20 -18 44 -8 q 24 -12 44 2 q 14 11 -6 14 q -44 10 -82 -8 z",
];

function StormClouds({
  uid,
  reduced,
  flashKey,
}: {
  uid: string;
  reduced: boolean;
  flashKey: number;
}) {
  const hlTransition = { duration: 1.0, times: [0, 0.05, 0.14, 0.24, 0.5] };
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-cl-back`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4d5370" />
          <stop offset="65%" stopColor="#363b54" />
          <stop offset="100%" stopColor="#272c42" />
        </linearGradient>
        <linearGradient id={`${uid}-cl-mid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b415c" />
          <stop offset="100%" stopColor="#232840" />
        </linearGradient>
        <linearGradient id={`${uid}-cl-front`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#272c44" />
          <stop offset="100%" stopColor="#161a2c" />
        </linearGradient>
        <linearGradient id={`${uid}-cl-glow`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4dcff" />
          <stop offset="100%" stopColor="#96a0d8" />
        </linearGradient>
        <radialGradient id={`${uid}-sheet`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8ECFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#E8ECFF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <motion.g
        animate={reduced ? {} : { x: [0, 10, 0, -8, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
      >
        <path d={CLOUD_BACK_D} fill={`url(#${uid}-cl-back)`} opacity={0.9} />
      </motion.g>
      <motion.g
        animate={reduced ? {} : { x: [0, -12, 0, 9, 0] }}
        transition={{
          duration: 26,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <path d={CLOUD_MID_D} fill={`url(#${uid}-cl-mid)`} opacity={0.95} />
        {flashKey > 0 && (
          <motion.path
            key={`hl-mid-${flashKey}`}
            d={CLOUD_MID_D}
            fill={`url(#${uid}-cl-glow)`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0.08, 0.22, 0] }}
            transition={hlTransition}
          />
        )}
      </motion.g>
      <motion.g
        animate={reduced ? {} : { x: [0, 7, 0, -10, 0] }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <path d={CLOUD_FRONT_D} fill={`url(#${uid}-cl-front)`} />
        {flashKey > 0 && (
          <motion.path
            key={`hl-front-${flashKey}`}
            d={CLOUD_FRONT_D}
            fill={`url(#${uid}-cl-glow)`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0.1, 0.28, 0] }}
            transition={hlTransition}
          />
        )}
      </motion.g>
      {SCUDS.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="#1d2134"
          opacity={0.85}
          animate={reduced ? {} : { x: [0, 26, 0] }}
          transition={{
            duration: 14 + i * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.7,
          }}
        />
      ))}
      {flashKey > 0 && (
        <motion.ellipse
          key={`sheet-${flashKey}`}
          cx={flashKey % 2 === 0 ? 260 : 560}
          cy={70}
          rx={240}
          ry={100}
          fill={`url(#${uid}-sheet)`}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0.15, 0.35, 0] }}
          transition={{ duration: 0.9, times: [0, 0.06, 0.16, 0.28, 0.55] }}
        />
      )}
    </g>
  );
}

function StormLightning({ uid, reduced }: { uid: string; reduced: boolean }) {
  const [flashKey, setFlashKey] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleNext = () => {
      timeout = setTimeout(
        () => {
          setFlashKey((k) => k + 1);
          scheduleNext();
        },
        5000 + Math.random() * 9000,
      );
    };
    timeout = setTimeout(() => {
      setFlashKey((k) => k + 1);
      scheduleNext();
    }, 2000);
    return () => clearTimeout(timeout);
  }, [reduced]);

  return (
    <g>
      <rect
        x={0}
        y={0}
        width={800}
        height={1000}
        fill="#0a0e1e"
        opacity={0.16}
      />
      <StormClouds uid={uid} reduced={reduced} flashKey={flashKey} />
      <AnimatePresence>
        {flashKey > 0 && (
          <motion.g key={flashKey}>
            <motion.rect
              x={0}
              y={0}
              width={800}
              height={1000}
              fill="#E8E8FF"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0, 0.28, 0, 0.12, 0] }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.0,
                times: [0, 0.03, 0.1, 0.18, 0.3, 0.45, 0.62],
              }}
              style={{ mixBlendMode: "screen" }}
            />
            <motion.path
              d="M 372 96 L 358 190 L 386 186 L 344 330 L 374 326 L 322 520 L 354 515 L 306 716 L 338 711 L 296 884"
              fill="none"
              stroke="#FFFDE8"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="bevel"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: [0, 1, 0.85, 0], pathLength: [0, 1, 1, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, times: [0, 0.05, 0.2, 0.55] }}
            />
            <motion.path
              d="M 372 96 L 358 190 L 386 186 L 344 330 L 374 326 L 322 520 L 354 515 L 306 716 L 338 711 L 296 884"
              fill="none"
              stroke="#B8C8FF"
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="bevel"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.35, 0] }}
              transition={{ duration: 0.5, delay: 0.02 }}
              style={{ filter: "blur(4px)" }}
            />
            <motion.path
              d="M 556 88 L 546 176 L 566 173 L 534 320 L 558 316 L 524 470"
              fill="none"
              stroke="#FFFDE8"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="bevel"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: [0, 0.75, 0], pathLength: [0, 1, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.1, times: [0, 0.07, 0.45] }}
            />
            <motion.path
              d="M 358 190 L 316 268 L 336 265 L 300 356"
              fill="none"
              stroke="#FFFDE8"
              strokeWidth={1.5}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.65, 0] }}
              transition={{ duration: 0.35, delay: 0.04 }}
            />
          </motion.g>
        )}
      </AnimatePresence>
    </g>
  );
}

function RainSplashes() {
  const splashes = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        x: 60 + ((i * 73 + 17) % 680),
        y: 875 + ((i * 31 + 7) % 45),
        delay: (i * 0.37) % 2.5,
        dur: 0.9 + (i % 3) * 0.3,
      })),
    [],
  );
  return (
    <g opacity={0.45}>
      {splashes.map((s) => (
        <motion.g key={s.id}>
          <motion.circle
            cx={s.x}
            cy={s.y}
            r={1}
            fill="none"
            stroke="#9CC4E4"
            strokeWidth={0.7}
            animate={{ r: [1, 5, 9], opacity: [0.8, 0.4, 0] }}
            transition={{
              duration: s.dur,
              repeat: Infinity,
              delay: s.delay,
              ease: "easeOut",
            }}
          />
          <motion.circle
            cx={s.x - 2}
            cy={s.y}
            r={0.6}
            fill="#9CC4E4"
            animate={{ y: [0, -4, 0], opacity: [0.7, 0.3, 0] }}
            transition={{
              duration: s.dur * 0.7,
              repeat: Infinity,
              delay: s.delay + 0.05,
              ease: "easeOut",
            }}
          />
          <motion.circle
            cx={s.x + 2}
            cy={s.y}
            r={0.5}
            fill="#9CC4E4"
            animate={{ y: [0, -3, 0], opacity: [0.6, 0.2, 0] }}
            transition={{
              duration: s.dur * 0.6,
              repeat: Infinity,
              delay: s.delay + 0.1,
              ease: "easeOut",
            }}
          />
        </motion.g>
      ))}
    </g>
  );
}

function ParticleNode({ p, reduced }: { p: Particle; reduced: boolean }) {
  const lifeRatio = p.life / p.maxLife;
  const opacity = Math.min(1, (1 - lifeRatio) * 5) * Math.min(1, lifeRatio * 3);

  switch (p.kind) {
    case "firefly":
      return (
        <motion.g
          style={{ transformOrigin: `${p.x}px ${p.y}px` }}
          animate={
            reduced ? {} : { opacity: [0.1, 1, 0.1], scale: [0.7, 1.3, 0.7] }
          }
          transition={{
            duration: 1.4 + p.phase * 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: p.phase * 2,
          }}
        >
          <circle
            cx={p.x}
            cy={p.y}
            r={p.size * 3}
            fill={p.color}
            opacity={0.15}
          />
          <circle
            cx={p.x}
            cy={p.y}
            r={p.size * 1.5}
            fill={p.color}
            opacity={0.4}
          />
          <circle
            cx={p.x}
            cy={p.y}
            r={p.size * 0.7}
            fill="#FFFFFF"
            opacity={0.9}
          />
        </motion.g>
      );
    case "pollen":
      return (
        <circle
          cx={p.x}
          cy={p.y}
          r={p.size}
          fill={p.color}
          opacity={opacity * 0.6}
        />
      );
    case "snow": {
      const snowOpacity = opacity * (0.55 + p.phase * 0.4);
      if (p.size > 3 && p.phase > 0.5) {
        const s = p.size;
        return (
          <g
            transform={`translate(${p.x} ${p.y}) rotate(${(p.rot * 180) / Math.PI})`}
            opacity={snowOpacity}
          >
            {[0, 60, 120].map((angle) => (
              <g key={angle} transform={`rotate(${angle})`}>
                <line
                  x1={-s}
                  y1={0}
                  x2={s}
                  y2={0}
                  stroke={p.color}
                  strokeWidth={0.7}
                  strokeLinecap="round"
                />
                <line
                  x1={s * 0.5}
                  y1={0}
                  x2={s * 0.7}
                  y2={-s * 0.3}
                  stroke={p.color}
                  strokeWidth={0.4}
                />
                <line
                  x1={s * 0.5}
                  y1={0}
                  x2={s * 0.7}
                  y2={s * 0.3}
                  stroke={p.color}
                  strokeWidth={0.4}
                />
                <line
                  x1={-s * 0.5}
                  y1={0}
                  x2={-s * 0.7}
                  y2={-s * 0.3}
                  stroke={p.color}
                  strokeWidth={0.4}
                />
                <line
                  x1={-s * 0.5}
                  y1={0}
                  x2={-s * 0.7}
                  y2={s * 0.3}
                  stroke={p.color}
                  strokeWidth={0.4}
                />
              </g>
            ))}
          </g>
        );
      }
      return (
        <g opacity={snowOpacity}>
          <circle
            cx={p.x}
            cy={p.y}
            r={p.size * 1.8}
            fill={p.color}
            opacity={0.15}
          />
          <circle cx={p.x} cy={p.y} r={p.size} fill={p.color} opacity={0.85} />
          <circle
            cx={p.x - p.size * 0.3}
            cy={p.y - p.size * 0.3}
            r={p.size * 0.3}
            fill="#FFFFFF"
            opacity={0.6}
          />
        </g>
      );
    }
    case "raindrop": {
      const len = 16 + p.size * 10;
      const windX = -5 - p.phase * 4;
      return (
        <g opacity={opacity * 0.85}>
          <line
            x1={p.x}
            y1={p.y}
            x2={p.x + windX}
            y2={p.y + len}
            stroke={p.color}
            strokeWidth={p.size * 1.4}
            strokeLinecap="round"
          />
          <circle
            cx={p.x + windX}
            cy={p.y + len}
            r={p.size * 0.6}
            fill={p.color}
            opacity={0.7}
          />
        </g>
      );
    }
    case "petal": {
      const s = p.size;
      return (
        <g
          transform={`translate(${p.x} ${p.y}) rotate(${(p.rot * 180) / Math.PI})`}
          opacity={opacity * 0.85}
        >
          <path
            d={`M 0 0 C ${s * 0.5} -${s * 1.3}, ${s * 1.6} -${s * 1.1}, ${s * 2} 0 C ${s * 1.6} ${s * 1.1}, ${s * 0.5} ${s * 1.3}, 0 0 Z`}
            fill={p.color}
          />
          <line
            x1={s * 0.2}
            y1={0}
            x2={s * 1.7}
            y2={0}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={0.4}
          />
        </g>
      );
    }
    case "leaf": {
      const s = p.size;
      return (
        <g
          transform={`translate(${p.x} ${p.y}) rotate(${(p.rot * 180) / Math.PI})`}
          opacity={opacity * 0.92}
        >
          <path
            d={`M 0 0 C ${s * 0.4} -${s * 0.8}, ${s * 1.3} -${s * 1.0}, ${s * 1.9} -${s * 0.3} Q ${s * 2.1} 0, ${s * 1.9} ${s * 0.3} C ${s * 1.3} ${s * 1.0}, ${s * 0.4} ${s * 0.8}, 0 0 Z`}
            fill={p.color}
          />
          <path
            d={`M ${s * 0.1} 0 Q ${s * 1.0} 0, ${s * 1.85} 0`}
            fill="none"
            stroke="rgba(0,0,0,0.2)"
            strokeWidth={0.6}
          />
          <line
            x1={s * 0.5}
            y1={0}
            x2={s * 0.8}
            y2={-s * 0.4}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth={0.35}
          />
          <line
            x1={s * 0.5}
            y1={0}
            x2={s * 0.8}
            y2={s * 0.4}
            stroke="rgba(0,0,0,0.12)"
            strokeWidth={0.35}
          />
          <line
            x1={s * 1.0}
            y1={0}
            x2={s * 1.3}
            y2={-s * 0.35}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={0.3}
          />
          <line
            x1={s * 1.0}
            y1={0}
            x2={s * 1.3}
            y2={s * 0.35}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={0.3}
          />
        </g>
      );
    }
    case "spark":
      return (
        <circle cx={p.x} cy={p.y} r={p.size} fill={p.color} opacity={opacity} />
      );
    default:
      return null;
  }
}

function Bird() {
  return (
    <motion.g
      animate={{ scaleY: [1, 0.6, 1] }}
      transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
      style={{ transformOrigin: "0px 0px" }}
    >
      <path
        d="M -10 0 Q -5 -8 0 0 Q 5 -8 10 0"
        stroke="#2A2018"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        opacity={0.7}
      />
    </motion.g>
  );
}
