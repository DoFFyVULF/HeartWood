'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, useCallback, useId } from 'react';
import {
  Season, TimeOfDay, Mood, HangingItem, TreeEvent,
  SKY_PALETTES, interpolateStage, quantiseProgress,
} from "@/features/world/tree/config/stages";
import {
  getSpeciesForLevel, SPECIES, getLeafPalette, getParticleColors, TreeSpecies,
} from "@/features/world/tree/config/species";
import { hashSeed, mulberry32 } from "@/features/world/tree/lib/random";
import { buildTree, TreeGeometry } from "@/features/world/tree/lib/geometry";

import Sky from "@/features/world/tree/components/Sky";
import Ground from "@/features/world/tree/components/Ground";
import Aura from "@/features/world/tree/components/Aura";
import Rainbow from "@/features/world/tree/components/Rainbow";
import Trunk from "@/features/world/tree/components/Trunk";
import Branches from "@/features/world/tree/components/Branches";
import Canopy from "@/features/world/tree/components/Canopy";
import Particles from "@/features/world/tree/components/Particles";
import HangingItems from "@/features/world/tree/components/HangingItems";
import EventBurst from "@/features/world/tree/components/EventBurst";
import LevelUpBurst from "@/features/world/tree/components/LevelUpBurst";
import { FlameIcon } from "@/features/world/tree/components/icons";

import { useInView } from "@/features/world/tree/hooks/useInView";
import { useReducedMotion } from "@/features/world/tree/hooks/useReducedMotion";
import { useIdleSway } from "@/features/world/tree/hooks/useIdleSway";

export interface RelationshipTreeProps {
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  levelProgress: number;
  daysTogether: number;
  season: Season;
  timeOfDay: TimeOfDay;
  partnerMood?: Mood;
  streak: number;
  hangingItems?: HangingItem[];
  lastEvent?: TreeEvent;
  onTreeTap?: () => void;
  onItemOpen?: (item: HangingItem) => void;
  reducedMotion?: boolean;
}

function useActivityWake(lastEventAt?: number): { calm: number; wakeKey: number } {
  const [calm, setCalm] = useState(1);
  const [wakeKey, setWakeKey] = useState(0);
  const lastActivityRef = useRef<number>(0);
  useEffect(() => {
    const t = setTimeout(() => { lastActivityRef.current = Date.now(); setCalm(1); setWakeKey((k) => k + 1); }, 0);
    return () => clearTimeout(t);
  }, [lastEventAt]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastActivityRef.current === 0) return;
      if ((Date.now() - lastActivityRef.current) / 1000 > 6) setCalm((c) => Math.max(0.6, c - 0.05));
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  return { calm, wakeKey };
}

export default function RelationshipTree({
  level, levelProgress, daysTogether, season, timeOfDay,
  partnerMood = null, streak, hangingItems = [], lastEvent,
  onTreeTap, onItemOpen, reducedMotion,
}: RelationshipTreeProps) {
  const reduced = useReducedMotion(reducedMotion);
  const [inViewRef, inView] = useInView<HTMLDivElement>();
  const { calm, wakeKey } = useActivityWake(lastEvent?.at);
  const uid = useId().replace(/[^a-zA-Z0-9]+/g, '') || 'tree';

  const seed = useMemo(() => hashSeed(`pair-${daysTogether}-${level}`), [daysTogether, level]);
  const quantisedProgress = quantiseProgress(levelProgress);
  const stage = useMemo(() => interpolateStage(level, quantisedProgress), [level, quantisedProgress]);
  const sky = SKY_PALETTES[timeOfDay];
  const glow = stage.glow * sky.glowBoost;

  const speciesId = getSpeciesForLevel(level);
  const species: TreeSpecies | null = speciesId ? SPECIES[speciesId] : null;

  // Геометрия: вид «просыпается» постепенно (maturity), крона — художественная.
  const geo: TreeGeometry = useMemo(() => {
    const maturity = Math.min(1, Math.max(0.2, stage.trunkH / 450));
    const bl = (n: number, v: number) => n + (v - n) * maturity;
    const g = species?.geometry;
    const sg = g ? {
      trunkHScale: bl(1, g.trunkHScale),
      trunkWScale: bl(1, g.trunkWScale),
      crownScale: bl(1, g.crownScale),
      branchAngle: bl(42, g.branchAngle),
      branchCurve: bl(0.35, g.branchCurve),
      droop: bl(0.05, g.droop),
      canopyShape: g.canopyShape,
    } : undefined;
    return buildTree({
      seed,
      trunkH: stage.trunkH * (sg?.trunkHScale ?? 1),
      trunkW: stage.trunkW * (sg?.trunkWScale ?? 1),
      branchDepth: stage.branchDepth,
      leaves: stage.leaves,
      flowers: stage.flowers * (species?.bloom.density ?? 1),
      fruits: stage.fruits,
      roots: stage.roots,
      speciesGeometry: sg,
    });
  }, [seed, species, stage.trunkH, stage.trunkW, stage.branchDepth, stage.leaves, stage.flowers, stage.fruits, stage.roots]);

  // Fit-to-frame: опора в грунт, отъезд камеры при перерастании.
  const SAFE_TOP = 70;
  const treeTopY = geo.canopyCenter.y - geo.canopyRadius;
  const anchorX = geo.trunkBase.x;
  const anchorY = geo.trunkBase.y + Math.max(6, stage.trunkW * 0.12);
  const fitScale = treeTopY < SAFE_TOP
    ? Math.max(0.58, (anchorY - SAFE_TOP) / (anchorY - treeTopY))
    : 1;
  const rigTx = anchorX * (1 - fitScale);
  const rigTy = anchorY * (1 - fitScale);
  const scaledCanopyX = anchorX + (geo.canopyCenter.x - anchorX) * fitScale;
  const scaledCanopyY = anchorY + (geo.canopyCenter.y - anchorY) * fitScale;
  const auraRadius = (180 + stage.trunkH * 0.35) * fitScale;

  const prevLevelRef = useRef(level);
  const [levelUpKey, setLevelUpKey] = useState('0-0');
  const [popping, setPopping] = useState(false);
  const [growing, setGrowing] = useState(false);
  useEffect(() => {
    if (level > prevLevelRef.current) {
      const newKey = `${level}-${Date.now()}`;
      const activate = setTimeout(() => { setLevelUpKey(newKey); setPopping(true); setGrowing(true); }, 0);
      const stopGrowing = setTimeout(() => setGrowing(false), 1800);
      const stopPopping = setTimeout(() => setPopping(false), 2600);
      prevLevelRef.current = level;
      return () => { clearTimeout(activate); clearTimeout(stopGrowing); clearTimeout(stopPopping); };
    }
    prevLevelRef.current = level;
  }, [level]);

  const sway = useIdleSway({
    trunkAmp: 1.2 * (species?.swayScale ?? 1),
    trunkDur: 6, idleScale: sky.idleScale, stageSway: stage.sway, reduced, calm,
  });

  const [tapBurst, setTapBurst] = useState<{ x: number; y: number; id: number } | null>(null);
  const handleTap = useCallback(() => {
    onTreeTap?.();
    setTapBurst({ x: geo.trunkBase.x, y: geo.canopyCenter.y, id: Date.now() });
    setTimeout(() => setTapBurst(null), 1200);
  }, [onTreeTap, geo.trunkBase.x, geo.canopyCenter.y]);

  const [hug, setHug] = useState(false);
  const handleHug = useCallback(() => { setHug(true); setTimeout(() => setHug(false), 2000); }, []);

  const stageLabel = stage.label;
  const moodLabel = partnerMood
    ? partnerMood === 'sun' ? 'солнечно' : partnerMood === 'rain' ? 'дождливо'
    : partnerMood === 'storm' ? 'гроза' : partnerMood === 'rainbow' ? 'радуга'
    : partnerMood === 'moon' ? 'лунно' : 'нейтрально'
    : 'нейтрально';
  const ariaLabel = `Ваше дерево — ${species ? `${species.label}, ` : ''}стадия «${stageLabel}», ${daysTogether} дней вместе, настроение партнёра: ${moodLabel}.`;

  const streakFire = streak >= 3 ? Math.min(1, (streak - 2) / 14) : 0;
  const paused = !inView || reduced;

  const trunkAmp = sway.trunk.rotate * 0.2;
  const branchAmp = sway.trunk.rotate * 0.5;
  const canopyAmp = sway.trunk.rotate * 1.0;
  const branchPivotY = geo.trunkBase.y - stage.trunkH * 0.35;

  return (
    <div ref={inViewRef} className="relative mx-auto w-full" style={{ height: '100%', minWidth: 280 }} data-wake={wakeKey}>
      <svg
        viewBox="0 0 800 1000"
        preserveAspectRatio="xMidYMax meet"
        className="absolute inset-0 h-full w-full"
        role="img"
        aria-label={ariaLabel}
        style={{ filter: calm < 1 ? `saturate(${0.85 + calm * 0.15})` : undefined, transition: 'filter 1.5s ease' }}
      >
        <Sky uid={uid} timeOfDay={timeOfDay} seed={seed} reduced={reduced} />

        <Aura uid={uid} mood={partnerMood} cx={scaledCanopyX} cy={scaledCanopyY} radius={auraRadius} glowBoost={sky.glowBoost} calm={calm} reduced={reduced} />

        <AnimatePresence>
          {partnerMood === 'rainbow' && <Rainbow key="rainbow-back" layer="back" reduced={reduced} />}
        </AnimatePresence>

        <Ground uid={uid} season={season} timeOfDay={timeOfDay} seed={seed} streakFire={streakFire} baseWidth={stage.trunkW * fitScale} />

        {/* ── TREE RIG: масштаб вокруг грунтовой опоры ── */}
        <g style={{ transform: `translate(${rigTx}px, ${rigTy}px) scale(${fitScale})`, transition: reduced ? undefined : 'transform 1.8s cubic-bezier(0.22, 1, 0.36, 1)' }}>
          <motion.g
            style={{ transformOrigin: `${geo.trunkBase.x}px ${geo.trunkBase.y}px` }}
            animate={reduced ? {} : { rotate: [0, trunkAmp, 0, -trunkAmp, 0] }}
            transition={{ duration: 9 / sky.idleScale, repeat: Infinity, ease: 'easeInOut', times: [0, 0.25, 0.5, 0.75, 1] }}
          >
            <Trunk uid={uid} geo={geo} glow={glow} level={level} timeOfDay={timeOfDay} season={season} reduced={reduced} calm={calm} onTap={handleTap} onLongPress={handleHug} barkPalette={species?.palette.bark} />
          </motion.g>

          <motion.g
            style={{ transformOrigin: `${geo.trunkBase.x}px ${branchPivotY}px` }}
            animate={reduced ? {} : { rotate: [0, branchAmp, 0, -branchAmp, 0] }}
            transition={{ duration: 7.5 / sky.idleScale, repeat: Infinity, ease: 'easeInOut', times: [0, 0.25, 0.5, 0.75, 1], delay: 0.4 }}
          >
            <Branches geo={geo} growing={growing} sway={stage.sway} idleScale={sky.idleScale} reduced={reduced} calm={calm} timeOfDay={timeOfDay} barkPalette={species?.palette.bark} />
          </motion.g>

          <motion.g
            style={{ transformOrigin: `${geo.canopyCenter.x}px ${geo.canopyCenter.y + 30}px` }}
            animate={reduced ? {} : { rotate: [0, canopyAmp, 0, -canopyAmp, 0] }}
            transition={{ duration: 6 / sky.idleScale, repeat: Infinity, ease: 'easeInOut', times: [0, 0.25, 0.5, 0.75, 1], delay: 0.8 }}
          >
            <Canopy
              uid={uid} geo={geo} season={season} timeOfDay={timeOfDay} glow={glow} popping={popping} reduced={reduced} calm={calm}
              leafPalette={species ? getLeafPalette(species, season) : undefined}
              flowerColors={species?.palette.flower}
              flowersOverLeaves={species?.bloom.flowersOverLeaves ?? false}
              fruitColor={species?.palette.fruit}
              fruitGlowColor={species?.palette.fruitGlow}
            />
          </motion.g>

          {hug && (
            <>
              <motion.circle
                cx={geo.trunkBase.x} cy={geo.canopyCenter.y + (geo.trunkBase.y - geo.canopyCenter.y) * 0.5} r={120}
                fill="none" stroke="#FFC978" strokeWidth={3}
                initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: [0, 0.8, 0], scale: [0.6, 1.2, 1.4] }}
                transition={{ duration: 2, ease: 'easeOut' }}
                style={{ transformOrigin: `${geo.trunkBase.x}px ${geo.canopyCenter.y + (geo.trunkBase.y - geo.canopyCenter.y) * 0.5}px` }}
              />
              <HugHearts cx={geo.trunkBase.x} cy={geo.canopyCenter.y + 100} />
            </>
          )}

          <HangingItems items={hangingItems} anchors={geo.anchors} reduced={reduced} onItemOpen={onItemOpen} />
          <EventBurst event={lastEvent} cx={geo.canopyCenter.x} cy={geo.canopyCenter.y} reduced={reduced} />
          {tapBurst && <TapBurst x={tapBurst.x} y={tapBurst.y} id={tapBurst.id} />}
          <LevelUpBurst triggerKey={levelUpKey} bx={geo.trunkBase.x} by={geo.trunkBase.y} cx={geo.canopyCenter.x} cy={geo.canopyCenter.y} reduced={reduced} />
          {level >= 6 && <Constellation cx={geo.canopyCenter.x} cy={geo.canopyCenter.y - stage.trunkH * 0.3} seed={seed} reduced={reduced} />}
        </g>

        <AnimatePresence>
          {partnerMood === 'rainbow' && <Rainbow key="rainbow-front" layer="front" reduced={reduced} />}
        </AnimatePresence>

        <Particles
          uid={uid} season={season} timeOfDay={timeOfDay} mood={partnerMood} level={level} paused={paused} reduced={reduced} calm={calm} seed={seed}
          speciesParticle={species ? {
            kind: species.particle.kind,
            colors: getParticleColors(species, season),
            rateScale: species.particle.rateScale,
            allSeason: species.particle.allSeason,
          } : undefined}
        />

        {level === 7 && timeOfDay !== 'day' && <NorthernLights uid={uid} reduced={reduced} />}
      </svg>

      <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2">
        <div className="flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--hwd-ink-soft)_22%,transparent)] bg-white/70 px-3 py-1 text-xs font-semibold text-(--hwd-ink) shadow-[0_10px_24px_-16px_rgb(30_27_60_/_0.35)] backdrop-blur-md">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-(--hwd-primary)" />
          <span>{species ? species.label : stageLabel}</span>
          <span className="opacity-50">·</span>
          <span className="opacity-75">{daysTogether} дн.</span>
          {streak > 0 && (
            <>
              <span className="opacity-50">·</span>
              <span className="inline-flex items-center gap-0.5 opacity-90">
                <FlameIcon className="size-3.5 text-(--hwd-primary)" />
                {streak}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TapBurst({ x, y, id }: { x: number; y: number; id: number }) {
  return (
    <motion.g key={id} aria-hidden="true" style={{ pointerEvents: 'none' }}>
      <motion.g initial={{ y: 0, opacity: 1, scale: 0.4 }} animate={{ y: -60, opacity: 0, scale: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }}>
        <path d={`M ${x} ${y} c -8 -10, -16 4, 0 14 c 16 -10, 8 -24, 0 -14 z`} fill="#F2789F" />
      </motion.g>
      {[-20, 0, 20].map((dx, i) => (
        <motion.g key={i} initial={{ x, y, opacity: 1, rotate: 0 }} animate={{ x: x + dx * 2, y: y + 80, opacity: 0, rotate: 180 }} transition={{ duration: 1.2, ease: 'easeIn', delay: i * 0.05 }}>
          <path d="M 0 0 q 4 -6 8 0 q -4 6 -8 0 z" fill="#8FD6A6" />
        </motion.g>
      ))}
    </motion.g>
  );
}

function HugHearts({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <motion.path key={i} d="M 0 0 c -4 -5, -8 2, 0 7 c 8 -5, 4 -12, 0 -7 z" fill="#F2789F"
            initial={{ x: cx, y: cy, opacity: 0, scale: 0.4 }}
            animate={{ x: cx + Math.cos(a) * 80, y: cy + Math.sin(a) * 80, opacity: [0, 1, 0], scale: [0.4, 1, 0.8] }}
            transition={{ duration: 2, delay: i * 0.08, ease: 'easeOut' }}
          />
        );
      })}
    </g>
  );
}

function Constellation({ cx, cy, seed, reduced }: { cx: number; cy: number; seed: number; reduced?: boolean }) {
  const points = useMemo(() => {
    const rng = mulberry32(seed ^ 0xc0de);
    return Array.from({ length: 7 }, () => ({ x: cx + (rng() - 0.5) * 220, y: cy - 40 - rng() * 120 }));
  }, [cx, cy, seed]);
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: reduced ? 0.5 : [0.4, 0.8, 0.4] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
      <g stroke="#FFE066" strokeWidth={0.6} opacity={0.5} fill="none">
        {points.map((p, i) => {
          const next = points[(i + 1) % points.length]!;
          return <line key={i} x1={p.x} y1={p.y} x2={next.x} y2={next.y} />;
        })}
      </g>
      {points.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r={1.8} fill="#FFF3D6"
          animate={reduced ? {} : { opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
        />
      ))}
    </motion.g>
  );
}

function NorthernLights({ uid, reduced }: { uid: string; reduced?: boolean }) {
  return (
    <motion.g aria-hidden="true" initial={{ opacity: 0 }} animate={reduced ? { opacity: 0.5 } : { opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} style={{ mixBlendMode: 'screen' }}>
      <defs>
        <linearGradient id={`${uid}-aurora-1`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7FD3A0" stopOpacity="0" /><stop offset="50%" stopColor="#7FD3A0" stopOpacity="0.5" /><stop offset="100%" stopColor="#7FD3A0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}-aurora-2`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#9CC4E4" stopOpacity="0" /><stop offset="50%" stopColor="#9CC4E4" stopOpacity="0.4" /><stop offset="100%" stopColor="#9CC4E4" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path d="M 0 200 Q 200 120 400 180 T 800 200 L 800 60 Q 600 20 400 80 T 0 60 Z" fill={`url(#${uid}-aurora-1)`}
        animate={reduced ? {} : { d: ["M 0 200 Q 200 120 400 180 T 800 200 L 800 60 Q 600 20 400 80 T 0 60 Z", "M 0 200 Q 200 160 400 140 T 800 200 L 800 60 Q 600 60 400 100 T 0 60 Z", "M 0 200 Q 200 120 400 180 T 800 200 L 800 60 Q 600 20 400 80 T 0 60 Z"] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.path d="M 0 220 Q 250 160 500 200 T 800 220 L 800 80 Q 550 40 300 100 T 0 80 Z" fill={`url(#${uid}-aurora-2)`}
        animate={reduced ? {} : { d: ["M 0 220 Q 250 160 500 200 T 800 220 L 800 80 Q 550 40 300 100 T 0 80 Z", "M 0 220 Q 250 200 500 160 T 800 220 L 800 80 Q 550 80 300 140 T 0 80 Z", "M 0 220 Q 250 160 500 200 T 800 220 L 800 80 Q 550 40 300 100 T 0 80 Z"] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.g>
  );
}