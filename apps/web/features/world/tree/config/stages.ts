export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type Mood = 'sun' | 'rain' | 'storm' | 'rainbow' | 'moon' | null;

export interface StageParams {
  trunkH: number; trunkW: number; branchDepth: number;
  leaves: number; flowers: number; fruits: number;
  glow: number; roots: number; sway: number; label: string;
}

export const STAGE_CONFIG: StageParams[] = [
  { trunkH: 40,  trunkW: 6,  branchDepth: 0, leaves: 0.05, flowers: 0,  fruits: 0,  glow: 0.15, roots: 0.10, sway: 1.00, label: 'Семечко' },
  { trunkH: 110, trunkW: 9,  branchDepth: 1, leaves: 0.20, flowers: 0,  fruits: 0,  glow: 0.20, roots: 0.20, sway: 1.60, label: 'Росток' },
  { trunkH: 210, trunkW: 16, branchDepth: 2, leaves: 0.40, flowers: 1,  fruits: 0,  glow: 0.30, roots: 0.35, sway: 1.30, label: 'Саженец' },
  { trunkH: 320, trunkW: 26, branchDepth: 3, leaves: 0.60, flowers: 6,  fruits: 0,  glow: 0.40, roots: 0.50, sway: 1.00, label: 'Молодое дерево' },
  { trunkH: 430, trunkW: 38, branchDepth: 4, leaves: 0.80, flowers: 14, fruits: 5,  glow: 0.55, roots: 0.70, sway: 0.80, label: 'Цветущее' },
  { trunkH: 530, trunkW: 54, branchDepth: 5, leaves: 0.90, flowers: 10, fruits: 10, glow: 0.70, roots: 0.85, sway: 0.60, label: 'Могучее' },
  { trunkH: 620, trunkW: 72, branchDepth: 6, leaves: 1.00, flowers: 8,  fruits: 14, glow: 0.85, roots: 1.00, sway: 0.50, label: 'Древнее' },
  { trunkH: 720, trunkW: 88, branchDepth: 7, leaves: 1.00, flowers: 12, fruits: 18, glow: 1.00, roots: 1.00, sway: 0.45, label: 'Мировое дерево' },
];

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function interpolateStage(level: number, levelProgress: number): StageParams {
  const a = STAGE_CONFIG[level]!;
  const b = STAGE_CONFIG[Math.min(level + 1, STAGE_CONFIG.length - 1)]!;
  const t = Math.max(0, Math.min(1, levelProgress));
  return {
    trunkH: lerp(a.trunkH, b.trunkH, t),
    trunkW: lerp(a.trunkW, b.trunkW, t),
    branchDepth: Math.round(lerp(a.branchDepth, b.branchDepth, t)),
    leaves: lerp(a.leaves, b.leaves, t),
    flowers: lerp(a.flowers, b.flowers, t),
    fruits: lerp(a.fruits, b.fruits, t),
    glow: lerp(a.glow, b.glow, t),
    roots: lerp(a.roots, b.roots, t),
    sway: lerp(a.sway, b.sway, t),
    label: t > 0.5 ? b.label : a.label,
  };
}

export interface SeasonPalette {
  leaf: [string, string, string];
  leafStroke?: string;
  flower: string[];
  fruit: string;
  fruitGlow: string;
  particle: 'pollen' | 'petals' | 'leaves' | 'snow' | 'fireflies';
  particleAlt?: 'fireflies';
}

export const SEASON_PALETTES: Record<Season, SeasonPalette> = {
  spring: { leaf: ['#A7E6BD', '#8FD6A6', '#6FBF8A'], flower: ['#FFD3E0', '#FF9EB5', '#F2789F'], fruit: '#FFC978', fruitGlow: '#FFD98A', particle: 'petals' },
  summer: { leaf: ['#7FD3A0', '#5FBF8A', '#3E9E6E'], flower: ['#FFD3E0', '#FF9EB5'], fruit: '#FFC978', fruitGlow: '#FFD98A', particle: 'pollen', particleAlt: 'fireflies' },
  autumn: { leaf: ['#F2C97A', '#F2A65A', '#E0704A'], flower: ['#F2A65A', '#C94F3D'], fruit: '#FFB347', fruitGlow: '#FFC978', particle: 'leaves' },
  winter: { leaf: ['#D9ECEF', '#BFD8DC', '#9DBFBC'], leafStroke: '#FFFFFF', flower: ['#E8F4F6'], fruit: '#E8C56A', fruitGlow: '#FFE9A8', particle: 'snow' },
};

export interface SkyPalette {
  top: string; bottom: string; stars: number; glowBoost: number; idleScale: number;
}

export const SKY_PALETTES: Record<TimeOfDay, SkyPalette> = {
  dawn:  { top: '#2E4A5A', bottom: '#F7B267', stars: 0.15, glowBoost: 1.15, idleScale: 0.95 },
  day:   { top: '#A8DDE0', bottom: '#EAF7EF', stars: 0,    glowBoost: 0.85, idleScale: 1.0  },
  dusk:  { top: '#35586B', bottom: '#F28C6B', stars: 0.35, glowBoost: 1.25, idleScale: 0.9  },
  night: { top: '#0B1E2A', bottom: '#123240', stars: 1.0,  glowBoost: 1.4,  idleScale: 0.7  },
};

export interface MoodAura {
  inner: string; outer: string; opacity: number; lightning?: boolean; rainbow?: boolean;
}

export const MOOD_AURAS: Record<NonNullable<Mood>, MoodAura> = {
  sun:     { inner: '#FFD98A', outer: 'rgba(255,217,138,0)',   opacity: 0.32 },
  rain:    { inner: '#9CC4E4', outer: 'rgba(156,196,228,0)',   opacity: 0.28 },
  storm:   { inner: '#8B8FB3', outer: 'rgba(139,143,179,0)',   opacity: 0.34, lightning: true },
  rainbow: { inner: '#FFD3E0', outer: 'rgba(255,211,224,0)',   opacity: 0.12, rainbow: true },
  moon:    { inner: '#A9C3D8', outer: 'rgba(169,195,216,0)',   opacity: 0.3  },
};

export const BARK = {
  base: '#5A4032', light: '#7A5A44', dark: '#3E2A20',
  vein: '#FFC978', veinBright: '#FFE0A8', moss: '#6B8F5E',
};

export const MAX_PARTICLES = 40;

export function quantiseProgress(p: number): number {
  return Math.round(p * 8) / 8;
}

export type HangingItemKind = 'surprise' | 'memory' | 'coupon' | 'date';
export interface HangingItem {
  id: string; kind: HangingItemKind; anchor: number;
  payload?: { photoUrl?: string; label?: string };
}

export type TreeEventType = 'message' | 'date' | 'coupon' | 'memory' | 'voice' | 'milestone';
export interface TreeEvent { type: TreeEventType; at: number; }