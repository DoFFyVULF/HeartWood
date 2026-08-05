"use client";

import React, { useEffect, useId, useMemo, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   <LivingTree /> — генеративное ЖИВОЕ дерево (чистый React + SVG + CSS-анимации)
   Теперь с ВИДАМИ: дуб, сакура, ива, берёза, сосна (или 'auto' по сиду).
   ─────────────────────────────────────────────────────────────────────────────
   Props:
     seedKey: string                       — сид генерации (одинаковый ключ ⇒
                                             абсолютно одинаковое дерево)
     species?: 'auto'|'oak'|'sakura'|'willow'|'birch'|'pine'
                                           — вид дерева; 'auto' детерминированно
                                             выбирается из seedKey (по умолч.)
     level?: number (0..7)                 — стадия: 0 Семечко … 7 Мировое дерево
     levelProgress?: number (0..1)         — плавный прогресс внутри стадии
     season?: 'spring'|'summer'|'autumn'|'winter'
     timeOfDay?: 'dawn'|'day'|'dusk'|'night'
     mood?: 'clear'|'rain'|'storm'|'rainbow'|'moonlight'
     showProgress?: boolean                — шкала роста под сценой

   Подключение:
     import { LivingTree } from './App';
     <LivingTree seedKey="древний дуб" species="sakura" level={5} levelProgress={0.4}
                 season="spring" timeOfDay="dusk" mood="rainbow" />
   Демо-панель:  <TreePlayground /> (default export этого файла).
   Хелперы: TREE_SPECIES, resolveSpecies(seedKey, species).
   ═══════════════════════════════════════════════════════════════════════════ */

/* ────────────────────────────── типы ────────────────────────────── */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';
export type Mood = 'clear' | 'rain' | 'storm' | 'rainbow' | 'moonlight';
type Rand = () => number;
interface Pt { x: number; y: number }
interface Crack { d: string; w: number; ox: number; oy: number }
interface BranchNode {
  depth: number; base: Pt; p0: Pt; p1: Pt; p2: Pt; p3: Pt;
  width0: number; width1: number;
  path: string; center: string; cracks: Crack[];
  appearAt: number; amp: number; dur: number; del: number; snow: boolean;
  children: BranchNode[];
}
interface Cluster { x: number; y: number; path: string; layer: 0 | 1 | 2; appearAt: number; r: number }
interface Spot { x: number; y: number; s: number; rot: number; at: number }
interface TreeGeom {
  root: BranchNode; list: BranchNode[]; roots: string[]; flare: string;
  clusters: Cluster[]; blossoms: Spot[]; fruits: Spot[]; marks: string[];
  canopy: Pt; canopyR: number;
}

/* ───────────────────────── виды деревьев (архетипы) ───────────────────────── */
export type TreeSpecies = 'oak' | 'sakura' | 'willow' | 'birch' | 'pine';
export type SpeciesProp = TreeSpecies | 'auto';

interface SpeciesPreset {
  id: TreeSpecies; label: string; emoji: string;
  trunkLen: [number, number]; trunkW: [number, number]; lean: number;
  spread: number; droop: number;
  lenF: [number, number]; widthF: number; maxDepth: number; countBoost: number;
  bark: [string, string, string, string];
  canopyFilter: string;
  cluster: { sx: number; sy: number; scale: number; density: number; hangBelow?: boolean };
  blossomCount: number; blossomColor: string; blossomCenter: string;
  fruit: 'none' | 'berry' | 'cone';
  evergreen?: boolean; tiers?: boolean; marks?: boolean;
}

export const TREE_SPECIES: Record<TreeSpecies, SpeciesPreset> = {
  oak: {
    id: 'oak', label: 'Дуб', emoji: '🌳',
    trunkLen: [118, 145], trunkW: [26, 33], lean: 0.07,
    spread: 2.0, droop: 0.15, lenF: [0.58, 0.76], widthF: 0.62, maxDepth: 5, countBoost: 1,
    bark: ['#1c1008', '#3c2917', '#5a4126', '#7a5a36'], canopyFilter: '',
    cluster: { sx: 1.18, sy: 0.95, scale: 1.15, density: 1 },
    blossomCount: 26, blossomColor: '#ffd2e0', blossomCenter: '#e8a24f', fruit: 'berry',
  },
  sakura: {
    id: 'sakura', label: 'Сакура', emoji: '🌸',
    trunkLen: [130, 158], trunkW: [15, 20], lean: 0.1,
    spread: 2.25, droop: 0.32, lenF: [0.6, 0.78], widthF: 0.6, maxDepth: 5, countBoost: 0,
    bark: ['#191216', '#392931', '#574249', '#7a6067'], canopyFilter: 'saturate(1.06)',
    cluster: { sx: 1.3, sy: 0.82, scale: 1.05, density: 1 },
    blossomCount: 70, blossomColor: '#ffb7d1', blossomCenter: '#e2548f', fruit: 'none',
  },
  willow: {
    id: 'willow', label: 'Ива', emoji: '🌿',
    trunkLen: [158, 185], trunkW: [14, 18], lean: 0.07,
    spread: 1.5, droop: 1.0, lenF: [0.68, 0.88], widthF: 0.55, maxDepth: 5, countBoost: 0,
    bark: ['#1f1709', '#463a22', '#655433', '#847048'], canopyFilter: 'brightness(1.03)',
    cluster: { sx: 0.55, sy: 1.9, scale: 0.9, density: 0.9, hangBelow: true },
    blossomCount: 10, blossomColor: '#e8f2b0', blossomCenter: '#9aa94e', fruit: 'none',
  },
  birch: {
    id: 'birch', label: 'Берёза', emoji: '🕊️',
    trunkLen: [150, 178], trunkW: [8.5, 11.5], lean: 0.05,
    spread: 1.15, droop: 0.08, lenF: [0.62, 0.8], widthF: 0.58, maxDepth: 4, countBoost: 0,
    bark: ['#6f6c60', '#b3afa1', '#d8d4c6', '#f0eee6'], canopyFilter: 'brightness(1.12) saturate(0.88)',
    cluster: { sx: 0.95, sy: 0.85, scale: 0.62, density: 0.6 },
    blossomCount: 12, blossomColor: '#fff3d6', blossomCenter: '#d8b23a', fruit: 'none', marks: true,
  },
  pine: {
    id: 'pine', label: 'Сосна', emoji: '🌲',
    trunkLen: [198, 228], trunkW: [13, 17], lean: 0.04,
    spread: 0.95, droop: 0.28, lenF: [0.55, 0.72], widthF: 0.58, maxDepth: 4, countBoost: 0,
    bark: ['#26120a', '#482415', '#6a3a22', '#8a5232'],
    canopyFilter: 'hue-rotate(14deg) saturate(0.72) brightness(0.8)',
    cluster: { sx: 1.85, sy: 0.52, scale: 0.95, density: 0.85 },
    blossomCount: 0, blossomColor: '', blossomCenter: '', fruit: 'cone', evergreen: true, tiers: true,
  },
};
const SPECIES_ARR = Object.values(TREE_SPECIES);

/* ─────────────────────── детерминированный PRNG ─────────────────────── */
function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number): Rand {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** 'auto' ⇒ вид детерминированно выводится из seedKey */
export function resolveSpecies(seedKey: string, species: SpeciesProp): SpeciesPreset {
  if (species !== 'auto') return TREE_SPECIES[species];
  return SPECIES_ARR[hashSeed((seedKey || 'tree') + '::species') % SPECIES_ARR.length];
}

/* ─────────────────────────── математика ─────────────────────────── */
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (t: number) => t * t * (3 - 2 * t);
const f1 = (v: number) => v.toFixed(2);

function cubicAt(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}
function cubicTan(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  };
}

/** Органичный сужающийся «прут» ветви: сэмплируем Безье, строим полигон по нормали. */
function branchShape(p0: Pt, p1: Pt, p2: Pt, p3: Pt, w0: number, w1: number, N = 12): string {
  const L: Pt[] = []; const R: Pt[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const pt = cubicAt(p0, p1, p2, p3, t);
    const tn = cubicTan(p0, p1, p2, p3, t);
    const ln = Math.hypot(tn.x, tn.y) || 1;
    const nx = -tn.y / ln; const ny = tn.x / ln;
    let w = lerp(w0, w1, t);
    w *= 1 + 0.09 * Math.sin(t * 9.4 + w0 * 0.7);
    L.push({ x: pt.x + nx * w, y: pt.y + ny * w });
    R.push({ x: pt.x - nx * w, y: pt.y - ny * w });
  }
  let d = `M${f1(L[0].x)} ${f1(L[0].y)}`;
  for (let i = 1; i <= N; i++) d += `L${f1(L[i].x)} ${f1(L[i].y)}`;
  for (let i = N; i >= 0; i--) d += `L${f1(R[i].x)} ${f1(R[i].y)}`;
  return d + 'Z';
}

function smoothClosed(pts: Pt[]): string {
  const n = pts.length;
  let d = `M${f1(pts[0].x)} ${f1(pts[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]; const p1 = pts[i];
    const p2 = pts[(i + 1) % n]; const p3 = pts[(i + 2) % n];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += `C${f1(c1.x)} ${f1(c1.y)} ${f1(c2.x)} ${f1(c2.y)} ${f1(p2.x)} ${f1(p2.y)}`;
  }
  return d + 'Z';
}
/** Органичный блоб кроны с анизотропией (sx/sy) — для ивы вытянут вниз, для сосны вширь. */
function blobPath(rng: Rand, r: number, sx: number, sy: number): string {
  const n = 9; const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.78 + rng() * 0.42);
    pts.push({ x: Math.cos(a) * rr * sx, y: Math.sin(a) * rr * sy });
  }
  return smoothClosed(pts);
}
function crackPath(p0: Pt, p1: Pt, p2: Pt, p3: Pt, w: number, rng: Rand): string {
  const side = rng() < 0.5 ? -1 : 1;
  let d = '';
  for (let i = 0; i <= 7; i++) {
    const t = 0.1 + i * 0.115;
    const pt = cubicAt(p0, p1, p2, p3, t);
    const tn = cubicTan(p0, p1, p2, p3, t);
    const ln = Math.hypot(tn.x, tn.y) || 1;
    const off = side * w * (0.15 + rng() * 0.13);
    const x = pt.x + (-tn.y / ln) * off + (rng() - 0.5) * 1.4;
    const y = pt.y + (tn.x / ln) * off + (rng() - 0.5) * 1.4;
    d += (i === 0 ? 'M' : 'L') + f1(x) + ' ' + f1(y);
  }
  return d;
}

/* ──────────────── скелет дерева: buildBranches(rng, вид) ──────────────── */
function buildBranches(rng: Rand, sp: SpeciesPreset): { root: BranchNode; list: BranchNode[] } {
  const list: BranchNode[] = [];
  const UP = -Math.PI / 2;
  const bendJ = sp.id === 'oak' ? 0.9 : 0.7;

  function rec(base: Pt, angle: number, len: number, w: number, depth: number): BranchNode {
    const bend = (rng() - 0.5) * (depth === 0 ? sp.lean * 4 : bendJ);
    const a1 = angle + bend + (depth >= 3 ? (rng() - 0.5) * 0.24 : 0);
    const p0 = base;
    const p3 = { x: base.x + Math.cos(a1) * len, y: base.y + Math.sin(a1) * len };
    const p1 = { x: base.x + Math.cos(angle) * len * 0.42, y: base.y + Math.sin(angle) * len * 0.42 };
    const p2 = { x: p3.x - Math.cos(a1) * len * 0.36, y: p3.y - Math.sin(a1) * len * 0.36 };
    const w1 = Math.max(w * 0.6, 0.72);
    const cracks: Crack[] = [];
    if (!sp.marks && depth <= 1) {
      const cn = depth === 0 ? 3 : 1;
      for (let i = 0; i < cn; i++) {
        cracks.push({
          d: crackPath(p0, p1, p2, p3, w, rng),
          w: 0.7 + rng() * 0.5,
          ox: (rng() - 0.5) * 2.4, oy: (rng() - 0.5) * 2.4,
        });
      }
    }
    const node: BranchNode = {
      depth, base, p0, p1, p2, p3, width0: w, width1: w1,
      path: branchShape(p0, p1, p2, p3, w, w1),
      center: `M${f1(p0.x)} ${f1(p0.y)}C${f1(p1.x)} ${f1(p1.y)} ${f1(p2.x)} ${f1(p2.y)} ${f1(p3.x)} ${f1(p3.y)}`,
      cracks,
      appearAt: Math.min(0.95 + depth * 1.02 + rng() * 0.35, 6.8),
      amp: 0.18 + depth * 0.38 + rng() * 0.14 + (sp.droop > 0.6 ? 0.25 : 0),
      dur: Math.max(2.4, 7.2 - depth * 0.85 + rng() * 1.4),
      del: rng() * 9,
      snow: depth <= 3 && w1 > 1.15,
      children: [],
    };
    list.push(node);

    /* сосна: мутовки ярусов вдоль ствола */
    if (sp.tiers && depth === 0) {
      const tiers = 6;
      for (let i = 0; i < tiers; i++) {
        const t = 0.3 + (i / (tiers - 1)) * 0.62;
        const bp = cubicAt(p0, p1, p2, p3, t);
        const side = i % 2 === 0 ? 1 : -1;
        const a = UP + side * (1.05 + rng() * 0.4);
        const l = Math.max(26, len * (0.52 - t * 0.28) * (0.85 + rng() * 0.3));
        node.children.push(rec(bp, a, l, Math.max(w * (0.48 - t * 0.18), 1.2), 1));
      }
      node.children.push(rec(p3, UP + (rng() - 0.5) * 0.14, len * 0.46, w * 0.6, 1));
      return node;
    }

    if (depth < sp.maxDepth && len > 24 && w > 1.05) {
      const count = depth === 0
        ? 3 + (rng() < 0.45 ? 1 : 0) + sp.countBoost
        : depth <= 2 ? (rng() < 0.55 ? 3 : 2) : (rng() < 0.26 ? 3 : 2);
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0.5 : i / (count - 1);
        let dev = a1 + (t - 0.5) * sp.spread + (rng() - 0.5) * 0.34 - UP;
        /* базовый баланс: не даём ветвям уйти слишком далеко от вертикали… */
        const baseMax = 1.32 + depth * 0.1 + sp.droop * (0.85 + depth * 0.22);
        dev = Math.max(-baseMax, Math.min(baseMax, dev));
        /* …а затем «провисание» вида (ива) усиливает отклонение вниз */
        dev *= 1 + sp.droop * (0.5 + depth * 0.3);
        const maxDev = 1.32 + depth * 0.1 + sp.droop * (1.05 + depth * 0.3);
        dev = Math.max(-maxDev, Math.min(maxDev, dev));
        const ca = UP + dev;

        let clen = len * lerp(sp.lenF[0], sp.lenF[1], rng());
        if (sp.droop > 0.6 && depth >= 2) clen *= 1.12; // длинные плети ивы
        const midChance = sp.droop > 0.5 ? 0.24 : depth >= 1 ? 0.16 : 0;
        const start = rng() < midChance ? cubicAt(p0, p1, p2, p3, 0.8) : p3;
        node.children.push(rec(start, ca, clen, Math.max(w * (sp.widthF + rng() * 0.12), 0.75), depth + 1));
      }
    }
    return node;
  }

  const root = rec(
    { x: 0, y: 0 },
    UP + (rng() - 0.5) * sp.lean,
    lerp(sp.trunkLen[0], sp.trunkLen[1], rng()),
    lerp(sp.trunkW[0], sp.trunkW[1], rng()),
    0,
  );
  return { root, list };
}

function buildRoots(rng: Rand, w0: number): string[] {
  const paths: string[] = [];
  for (let i = 0; i < 6; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const reach = 34 + rng() * 80;
    const dip = 5 + rng() * 15;
    const p0 = { x: side * (2 + rng() * 5), y: -2 - rng() * 5 };
    const p3 = { x: side * reach, y: dip };
    const p1 = { x: side * reach * 0.3, y: -9 - rng() * 6 };
    const p2 = { x: side * reach * 0.72, y: dip - 13 - rng() * 6 };
    const w = w0 * (0.26 + rng() * 0.15);
    paths.push(branchShape(p0, p1, p2, p3, w, Math.max(0.9, w * 0.24), 9));
  }
  return paths;
}

/* ──────────────────────── крона: buildCanopy ──────────────────────── */
function buildCanopy(rng: Rand, list: BranchNode[], sp: SpeciesPreset) {
  const cd = sp.cluster;
  const cand: { p: Pt; r: number; at: number }[] = [];
  for (const b of list) {
    const at = b.appearAt + 0.5 + rng() * 0.4;
    if (sp.tiers) {
      if (b.depth >= 2 && rng() < 0.75 * cd.density) {
        cand.push({ p: { x: b.p3.x, y: b.p3.y + 3 }, r: 13 + rng() * 9, at });
      }
    } else if (cd.hangBelow) {
      if (b.depth >= 3 && rng() < 0.8 * cd.density) {
        cand.push({ p: { x: b.p3.x, y: b.p3.y + 8 }, r: 11 + rng() * 8, at });
      }
    } else {
      if (b.depth >= sp.maxDepth) {
        if (rng() < 0.85 * cd.density) cand.push({ p: b.p3, r: (15 + rng() * 13) * cd.scale, at });
      } else if (b.depth === sp.maxDepth - 1) {
        if (rng() < 0.5 * cd.density) cand.push({ p: cubicAt(b.p0, b.p1, b.p2, b.p3, 0.85), r: (19 + rng() * 13) * cd.scale, at });
      } else if (b.depth === sp.maxDepth - 2 && rng() < 0.14 * cd.density) {
        cand.push({ p: cubicAt(b.p0, b.p1, b.p2, b.p3, 0.8), r: (20 + rng() * 12) * cd.scale, at });
      }
    }
  }
  let minY = 0; let maxY = 0; let sumX = 0;
  cand.forEach((c) => { minY = Math.min(minY, c.p.y); maxY = Math.max(maxY, c.p.y); sumX += c.p.x; });
  const h = Math.max(1, maxY - minY);
  const clusters: Cluster[] = cand.map((c) => {
    let score = ((c.p.y - minY) / h) * 0.6 + rng() * 0.5;
    if (sp.id === 'birch') score -= 0.15; // берёза светлее
    const layer: 0 | 1 | 2 = score > 0.72 ? 0 : score > 0.4 ? 1 : 2;
    return {
      x: c.p.x * 1.04, y: c.p.y - 5,
      path: blobPath(rng, c.r, cd.sx, cd.sy),
      layer, appearAt: c.at, r: c.r,
    };
  });
  const center = { x: sumX / Math.max(1, cand.length), y: minY + h * 0.45 };
  const radius = cand.length
    ? Math.max(...cand.map((c) => Math.hypot(c.p.x - center.x, c.p.y - center.y))) + 42
    : 100;
  /* Округление до 2 знаков гасит ULP-расхождения Math.cos/sin/hypot между
     серверным и клиентским движками (иначе React падает в hydration mismatch
     на cx/cy/rx/ry эллипса кроны). Визуально — менее 0.005px, незаметно. */
  return { clusters, center: { x: Math.round(center.x * 100) / 100, y: Math.round(center.y * 100) / 100 }, radius: Math.round(radius * 100) / 100 };
}
function buildSpots(rng: Rand, clusters: Cluster[], n: number, at0: number, at1: number): Spot[] {
  const spots: Spot[] = [];
  for (let i = 0; i < n; i++) {
    const c = clusters[Math.floor(rng() * clusters.length)];
    if (!c) continue;
    const a = rng() * Math.PI * 2; const rr = c.r * (0.15 + rng() * 0.62);
    spots.push({
      x: c.x + Math.cos(a) * rr, y: c.y + Math.sin(a) * rr * 0.8,
      s: 0.7 + rng() * 0.7, rot: rng() * 360,
      at: at0 + (i / n) * (at1 - at0) + rng() * 0.3,
    });
  }
  return spots.sort((a, b) => a.at - b.at);
}

/** Полный детерминированный набор геометрии (seedKey + вид). Считается один раз. */
function buildTree(seed: number, sp: SpeciesPreset): TreeGeom {
  const rng = mulberry32(seed);
  const { root, list } = buildBranches(rng, sp);
  const roots = buildRoots(rng, root.width0);
  const { clusters, center, radius } = buildCanopy(rng, list, sp);
  const fw = root.width0 * 1.5;
  const flare = `M ${f1(-fw)} 8 C ${f1(-fw * 0.62)} -6 ${f1(-fw * 0.3)} -16 0 -18 C ${f1(fw * 0.3)} -16 ${f1(fw * 0.62)} -6 ${f1(fw)} 8 Z`;
  /* берестяные штрихи */
  const marks: string[] = [];
  if (sp.marks) {
    for (const b of list) {
      if (b.depth > 1) continue;
      const n = b.depth === 0 ? 8 : 3;
      for (let i = 0; i < n; i++) {
        const t = 0.12 + rng() * 0.78;
        const pt = cubicAt(b.p0, b.p1, b.p2, b.p3, t);
        const tn = cubicTan(b.p0, b.p1, b.p2, b.p3, t);
        const ln = Math.hypot(tn.x, tn.y) || 1;
        const nx = -tn.y / ln; const ny = tn.x / ln;
        const ww = lerp(b.width0, b.width1, t) * (0.7 + rng() * 0.25);
        marks.push(`M${f1(pt.x - nx * ww)} ${f1(pt.y - ny * ww)}L${f1(pt.x + nx * ww)} ${f1(pt.y + ny * ww)}`);
      }
    }
  }
  return {
    root, list, roots, flare, clusters, marks,
    blossoms: buildSpots(rng, clusters, sp.blossomCount, 3.4, 6.2),
    fruits: buildSpots(rng, clusters, sp.fruit === 'none' ? 0 : 22, 4.3, 6.8),
    canopy: center, canopyR: radius,
  };
}

/* ────────────── шкала роста: уровень → масштаб дерева ────────────── */
const SCALE_STOPS: Array<[number, number]> = [
  [0, 0], [0.55, 0.05], [1, 0.14], [2, 0.3], [3, 0.5],
  [4, 0.68], [5, 0.82], [6, 0.92], [7, 1], [8, 1.05],
];
function treeScale(G: number): number {
  const g = Math.max(0, Math.min(8, G));
  for (let i = 1; i < SCALE_STOPS.length; i++) {
    if (g <= SCALE_STOPS[i][0]) {
      const [x0, y0] = SCALE_STOPS[i - 1]; const [x1, y1] = SCALE_STOPS[i];
      return y0 + ((g - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return 1.05;
}

export const STAGE_NAMES = [
  'Семечко', 'Росток', 'Саженец', 'Молодое дерево',
  'Цветущее дерево', 'Могучее дерево', 'Древнее дерево', 'Мировое дерево',
];

/* ────────────────────── константы сцены и формы ────────────────────── */
const BASE_X = 500; const BASE_Y = 660;
const GROUND_D = 'M0 656 C 150 640 320 652 500 648 C 700 643 850 658 1000 650 L1000 780 L0 780 Z';
const LEAF_D = 'M0 0 C 4 -5 11 -5 14 0 C 11 5 4 5 0 0 Z';
const PETAL_D = 'M0 0 C 3 -3 7 -2 8 1 C 6 4 2 4 0 0 Z';
const FLOWER_D = (() => {
  let d = '';
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    const ca = Math.cos(a); const sa = Math.sin(a);
    const px = -sa; const py = ca;
    d += `M0 0 C ${f1(ca * 1.8 + px * 1.7)} ${f1(sa * 1.8 + py * 1.7)} ${f1(ca * 4.2 + px * 1.5)} ${f1(sa * 4.2 + py * 1.5)} ${f1(ca * 4.6)} ${f1(sa * 4.6)} C ${f1(ca * 4.2 - px * 1.5)} ${f1(sa * 4.2 - py * 1.5)} ${f1(ca * 1.8 - px * 1.7)} ${f1(sa * 1.8 - py * 1.7)} 0 0 Z `;
  }
  return d;
})();
const vars = (o: Record<string, string>): React.CSSProperties => o as unknown as React.CSSProperties;

/* ──────────────────────── рекурсивный рендер ветвей ──────────────────────── */
function renderBranch(node: BranchNode, G: number, winter: boolean, uid: string, key: number): React.ReactElement | null {
  if (G < node.appearAt - 1.15) return null;
  const g = smooth(clamp01((G - node.appearAt) / 0.9));
  return (
    <g key={key} className="lt-enter" style={{ opacity: g, transition: 'opacity 1.1s ease' }}>
      <g transform={`translate(${f1(node.base.x)} ${f1(node.base.y)})`}>
        <g className="lt-sway"
          style={vars({ '--amp': `${node.amp.toFixed(2)}deg`, '--dur': `${node.dur.toFixed(2)}s`, '--del': `-${node.del.toFixed(2)}s` })}>
          <g transform={`translate(${f1(-node.base.x)} ${f1(-node.base.y)})`}>
            <path d={node.path} fill={`url(#${uid}-bark)`} />
            {node.cracks.map((c, i) => (
              <path key={i} d={c.d} fill="none" stroke="#170c05" strokeWidth={c.w}
                opacity={0.42} strokeLinecap="round" transform={`translate(${f1(c.ox)} ${f1(c.oy)})`} />
            ))}
            {winter && node.snow && (
              <path d={node.center} fill="none" stroke="#eef5ff"
                strokeWidth={Math.max(1, node.width1 * 1.5)} strokeLinecap="round"
                opacity={0.85} transform={`translate(0 ${f1(-node.width0 * 0.22)})`} />
            )}
            {node.children.map((ch, i) => renderBranch(ch, G, winter, uid, i))}
          </g>
        </g>
      </g>
    </g>
  );
}

/* ──────────────────────────── <Sky /> ──────────────────────────── */
const SKY_IDS: TimeOfDay[] = ['dawn', 'day', 'dusk', 'night'];
const SUN_POS: Record<TimeOfDay, { x: number; y: number; s: number; o: number }> = {
  dawn: { x: 185, y: 525, s: 1.25, o: 1 }, day: { x: 775, y: 125, s: 1, o: 1 },
  dusk: { x: 830, y: 520, s: 1.35, o: 1 }, night: { x: 775, y: 125, s: 1, o: 0 },
};
const MOON_O: Record<TimeOfDay, number> = { dawn: 0, day: 0, dusk: 0.18, night: 1 };

function Sky({ uid, tod, mood, seedKey }: { uid: string; tod: TimeOfDay; mood: Mood; seedKey: string }) {
  const stars = useMemo(() => {
    const rng = mulberry32(hashSeed(seedKey + '·stars'));
    return Array.from({ length: 46 }, () => ({
      x: rng() * 1000, y: rng() * 430, r: 0.6 + rng() * 1.3,
      dur: 2.2 + rng() * 3.4, del: rng() * 6,
    }));
  }, [seedKey]);
  const sun = SUN_POS[tod];
  const starO = tod === 'night' ? 1 : tod === 'dusk' ? 0.35 : tod === 'dawn' ? 0.12 : 0;
  return (
    <g>
      {SKY_IDS.map((s) => (
        <rect key={s} x="0" y="0" width="1000" height="780"
          fill={`url(#${uid}-sky-${s})`}
          style={{ opacity: tod === s ? 1 : 0, transition: 'opacity 1.8s ease' }} />
      ))}
      <g style={{ opacity: Math.min(1, starO + (mood === 'moonlight' ? 0.25 : 0)), transition: 'opacity 2s ease' }}>
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#dfe8ff" className="lt-twinkle"
            style={vars({ '--dur': `${s.dur.toFixed(2)}s`, '--del': `-${s.del.toFixed(2)}s` })} />
        ))}
      </g>
      <g style={{
        transform: `translate(${sun.x}px, ${sun.y}px) scale(${sun.s})`,
        opacity: sun.o, transition: 'transform 2.4s ease, opacity 2s ease',
      }}>
        <circle r={62} fill={`url(#${uid}-sun)`} />
        <circle r={21} fill="#fff4c8" />
      </g>
      <g style={{ transform: 'translate(762px, 148px)', opacity: MOON_O[tod], transition: 'opacity 2s ease' }}>
        <circle r={mood === 'moonlight' ? 95 : 58} fill={`url(#${uid}-moonglow)`} />
        <circle r={19} fill="#edf2ff" />
        <circle cx={-6} cy={-3} r={3.4} fill="#c9d4ec" opacity={0.55} />
        <circle cx={5} cy={6} r={2.3} fill="#c9d4ec" opacity={0.45} />
        <circle cx={7} cy={-6} r={1.7} fill="#c9d4ec" opacity={0.4} />
      </g>
    </g>
  );
}

/* ───────────────── облака / дождь / молнии / радуга ───────────────── */
function Clouds({ uid, mood, tod }: { uid: string; mood: Mood; tod: TimeOfDay }) {
  const stormy = mood === 'storm'; const rainy = mood === 'rain';
  const fill = stormy ? '#454e63' : rainy ? '#67728a'
    : tod === 'night' ? '#2a3450' : tod === 'dawn' ? '#f3c8b4' : tod === 'dusk' ? '#d9a3b8' : '#ffffff';
  const op = stormy ? 0.96 : rainy ? 0.9 : tod === 'night' ? 0.5 : 0.78;
  const clouds = [{ x: 190, y: 150, s: 1.15, d: 52 }, { x: 560, y: 92, s: 0.85, d: 66 }, { x: 835, y: 185, s: 1, d: 45 }];
  return (
    <g>
      {clouds.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
          <g className="lt-clouddrift" style={vars({ '--dur': `${c.d}s` })}>
            <g fill={fill} opacity={op} filter={`url(#${uid}-blur7)`} style={{ transition: 'fill 1.5s ease' }}>
              <ellipse cx={0} cy={0} rx={62} ry={20} />
              <ellipse cx={44} cy={6} rx={44} ry={16} />
              <ellipse cx={-48} cy={8} rx={40} ry={14} />
              <ellipse cx={8} cy={-14} rx={34} ry={16} />
              <ellipse cx={-16} cy={-8} rx={30} ry={14} />
            </g>
          </g>
        </g>
      ))}
    </g>
  );
}
function Rain({ seedKey, heavy }: { seedKey: string; heavy: boolean }) {
  const drops = useMemo(() => {
    const rng = mulberry32(hashSeed(seedKey + '·rain' + (heavy ? '·h' : '')));
    return Array.from({ length: heavy ? 42 : 26 }, () => ({
      x: rng() * 1020 - 10, dur: 0.55 + rng() * 0.4, delay: rng() * 2,
      len: 12 + rng() * 10, op: 0.3 + rng() * 0.35,
    }));
  }, [seedKey, heavy]);
  return (
    <g>
      {drops.map((d, i) => (
        <g key={i} transform={`translate(${f1(d.x)} 0)`}>
          <line x1={0} y1={0} x2={-5} y2={d.len} stroke="#a8c4e4"
            strokeWidth={heavy ? 1.9 : 1.4} opacity={d.op}
            className="lt-rain" style={vars({ '--dur': `${d.dur.toFixed(2)}s`, '--del': `-${d.delay.toFixed(2)}s` })} />
        </g>
      ))}
    </g>
  );
}
function Lightning() {
  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={0} y={0} width={1000} height={780} fill="#dfe9ff" className="lt-flash" style={{ animationDuration: '7s' }} />
      <path d="M 630 150 L 596 300 L 640 292 L 588 470 L 668 322 L 626 330 L 662 156 Z"
        fill="#eef5ff" className="lt-flash" style={{ animationDuration: '7s', animationDelay: '-1.2s' }} />
      <path d="M 320 120 L 296 240 L 330 234 L 300 380 L 356 262 L 322 268 L 348 126 Z"
        fill="#eef5ff" className="lt-flash" style={{ animationDuration: '9s', animationDelay: '-5s' }} />
    </g>
  );
}
function Rainbow() {
  const colors = ['#ff4d4d', '#ff9f43', '#ffe066', '#69db7c', '#4dabf7', '#9775fa'];
  return (
    <g>
      {colors.map((c, i) => (
        <path key={i}
          d={`M ${150 + i * 7} 662 A ${402 - i * 8} ${402 - i * 8} 0 0 1 ${850 - i * 7} 662`}
          fill="none" stroke={c} strokeWidth={7} opacity={0.5} strokeLinecap="round" />
      ))}
    </g>
  );
}

/* ──────────────────────────── <Particles /> ──────────────────────────── */
const AUTUMN_COLORS = ['#d9772f', '#c94f2a', '#e0a33a', '#b5651d'];
function Particles({ uid, seedKey, season, G }: { uid: string; seedKey: string; season: Season; G: number }) {
  const parts = useMemo(() => {
    const rng = mulberry32(hashSeed(seedKey + '·p·' + season));
    return Array.from({ length: season === 'winter' ? 28 : 22 }, () => ({
      x: 50 + rng() * 900, y: 130 + rng() * 430,
      size: 0.7 + rng() * 0.9, dur: 7 + rng() * 8, delay: rng() * 15,
      sway: 9 + rng() * 26, spin: 130 + rng() * 220,
      flick: 1.6 + rng() * 2.4, hue: rng(),
    }));
  }, [seedKey, season]);
  if (G < 1.3) return null;
  if (season === 'summer') {
    return (
      <g>
        {parts.map((p, i) => (
          <g key={i} transform={`translate(${f1(p.x)} ${f1(p.y)})`}>
            <g className="lt-drift" style={vars({ '--dur': `${(5 + p.hue * 6).toFixed(2)}s`, '--del': `-${p.delay.toFixed(2)}s` })}>
              <circle r={3 + p.size * 5} fill={`url(#${uid}-firefly)`}
                className="lt-flicker" style={vars({ '--dur': `${p.flick.toFixed(2)}s` })} />
            </g>
          </g>
        ))}
      </g>
    );
  }
  if (season === 'winter') {
    return (
      <g>
        {parts.map((p, i) => (
          <g key={i} transform={`translate(${f1(p.x)} 0)`}>
            <g className="lt-fall" style={vars({ '--dur': `${(9 + p.hue * 8).toFixed(2)}s`, '--del': `-${p.delay.toFixed(2)}s` })}>
              <g className="lt-swayx" style={vars({ '--dur': `${(3 + p.hue * 2).toFixed(2)}s`, '--sw': `${(p.sway * 0.6).toFixed(1)}px`, '--rt': '0deg' })}>
                <circle r={1.1 + p.size * 1.7} fill="#ffffff" opacity={0.88} />
              </g>
            </g>
          </g>
        ))}
      </g>
    );
  }
  const spring = season === 'spring';
  return (
    <g>
      {parts.map((p, i) => (
        <g key={i} transform={`translate(${f1(p.x)} 0)`}>
          <g className="lt-fall" style={vars({ '--dur': `${p.dur.toFixed(2)}s`, '--del': `-${p.delay.toFixed(2)}s` })}>
            <g className="lt-swayx" style={vars({ '--dur': `${(2.3 + p.hue * 2).toFixed(2)}s`, '--sw': `${p.sway.toFixed(1)}px`, '--rt': `${p.spin.toFixed(0)}deg` })}>
              {spring
                ? <path d={PETAL_D} fill="#ffd6e4" opacity={0.9} transform={`scale(${(p.size * 0.95).toFixed(2)})`} />
                : <path d={LEAF_D} fill={AUTUMN_COLORS[i % AUTUMN_COLORS.length]} opacity={0.92}
                  transform={`scale(${(0.8 + p.size * 0.55).toFixed(2)})`} />}
            </g>
          </g>
        </g>
      ))}
    </g>
  );
}

/* ──────────────────────────── <ProgressBar /> ──────────────────────────── */
function ProgressBar({ level, progress, species }: { level: number; progress: number; species: SpeciesPreset }) {
  const pct = Math.round(clamp01(progress) * 100);
  return (
    <div className="lt-progress">
      <div className="lt-segments">
        {Array.from({ length: 8 }, (_, i) => {
          const fill = i < level ? 100 : i === level ? pct : 0;
          return (
            <div key={i} title={`${i}. ${STAGE_NAMES[i]}`}
              className={'lt-seg' + (i < level ? ' done' : '') + (i === level ? ' active' : '')}>
              <div className="lt-seg-fill" style={{ width: `${fill}%` }} />
            </div>
          );
        })}
      </div>
      <div className="lt-progress-label">
        <span>{species.emoji} {species.label} · стадия {level}/7 — <b>{STAGE_NAMES[level]}</b></span>
        <span>{level < 7 ? <>{pct}% · осталось {100 - pct}% до «{STAGE_NAMES[level + 1]}»</> : <>100% · вершина мироздания ✦</>}</span>
      </div>
    </div>
  );
}

/* ═════════════════════════════ <LivingTree /> ═════════════════════════════ */
export interface LivingTreeProps {
  seedKey: string;
  species?: SpeciesProp;
  level?: number;
  levelProgress?: number;
  season?: Season;
  timeOfDay?: TimeOfDay;
  mood?: Mood;
  showProgress?: boolean;
  className?: string;
}

export function LivingTree(props: LivingTreeProps) {
  const {
    seedKey, species: speciesProp = 'auto', level: levelRaw = 6, levelProgress = 0,
    season = 'summer', timeOfDay = 'day', mood = 'clear',
    showProgress = true, className = '',
  } = props;

  const sp = useMemo(() => resolveSpecies(seedKey, speciesProp), [seedKey, speciesProp]);
  const level = Math.max(0, Math.min(7, Math.floor(levelRaw)));
  const prog = clamp01(levelProgress);
  const G = Math.max(0, Math.min(8, level + prog));

  /* useId вместо ручного счётчика: React гарантирует стабильность между SSR
     и гидратацией, а суффикс-префикс остаётся детерминированным на странице. */
  const uid = useId().replace(/[^a-zA-Z0-9]+/g, '') || 'lt';

  /* геометрия — только от seedKey + вида; анимации и сезоны её не трогают */
  const geom = useMemo(() => buildTree(hashSeed(seedKey || 'living-tree'), sp), [seedKey, sp]);

  const scaleV = treeScale(G);
  const winter = season === 'winter';
  const winterBare = winter && !sp.evergreen;

  /* палитра кроны: сезонный фильтр + видовой + зимний для вечнозелёных */
  const seasonFilter = season === 'autumn'
    ? 'hue-rotate(-86deg) saturate(1.3) brightness(0.97)'
    : season === 'spring'
      ? 'hue-rotate(-12deg) saturate(0.85) brightness(1.14)'
      : '';
  const canopyFilter = [
    seasonFilter, sp.canopyFilter,
    winter && sp.evergreen ? 'brightness(0.78) saturate(0.6)' : '',
  ].filter(Boolean).join(' ');
  const sakuraBloom = sp.id === 'sakura' && season === 'spring';
  const cBase = sakuraBloom ? 'cs' : 'c';

  let glowO = level >= 7 ? 0.6 : level >= 5 ? 0.42 : level >= 3 ? 0.28 : 0.16;
  if (timeOfDay === 'night') glowO += 0.12;
  if (timeOfDay === 'dusk') glowO += 0.05;
  if (mood === 'moonlight') glowO += 0.1;
  glowO = Math.min(0.75, glowO);

  const darkO = ({ dawn: 0.06, day: 0, dusk: 0.14, night: 0.4 } as Record<TimeOfDay, number>)[timeOfDay]
    + (mood === 'storm' ? 0.28 : mood === 'rain' ? 0.16 : 0);

  const sceneCX = BASE_X + scaleV * geom.canopy.x;
  const sceneCY = BASE_Y + scaleV * geom.canopy.y;

  const grass = useMemo(() => {
    const rng = mulberry32(hashSeed(seedKey + '·grass'));
    return Array.from({ length: 15 }, () => {
      const side = rng() < 0.5 ? -1 : 1;
      return {
        x: BASE_X + side * (18 + rng() * 250), y: BASE_Y + 4 + rng() * 12,
        h: 9 + rng() * 17, dx: (rng() - 0.5) * 12,
      };
    });
  }, [seedKey]);
  const grassStroke = { spring: '#7cb86b', summer: '#4f9049', autumn: '#b07a3e', winter: '#dce8f5' }[season];

  const sparks = useMemo(() => {
    const rng = mulberry32(hashSeed(seedKey + '·spark'));
    return Array.from({ length: 12 }, () => ({
      ox: (rng() - 0.5) * geom.canopyR * 1.7,
      oy: (rng() - 0.3) * geom.canopyR * 1.2,
      r: 1.6 + rng() * 2.6, dur: 4 + rng() * 4, delay: rng() * 8,
    }));
  }, [seedKey, geom]);

  const moundO = clamp01((1.35 - G) / 0.6);
  const sproutO = Math.min(smooth(clamp01((G - 0.45) / 0.7)), smooth(clamp01((2.75 - G) / 0.8)));
  const sproutS = 0.4 + 0.7 * clamp01((G - 0.45) / 1.8);
  const showFruits = sp.fruit !== 'none' && (season === 'summer' || season === 'autumn');

  return (
    <div className={`lt-root ${className}`}>
      <style>{STYLES}</style>
      <div className={'lt-frame' + (mood === 'storm' ? ' lt-storm' : mood === 'rain' ? ' lt-windy' : '')}>
        <svg className="lt-svg" viewBox="0 0 1000 780" preserveAspectRatio="xMidYMid meet"
          role="img" aria-label={`Живое дерево: ${sp.label}`}>
          <defs>
            <linearGradient id={`${uid}-sky-dawn`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1c1230" /><stop offset="0.45" stopColor="#6d3a58" />
              <stop offset="0.75" stopColor="#d97758" /><stop offset="1" stopColor="#ffd9a0" />
            </linearGradient>
            <linearGradient id={`${uid}-sky-day`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2f7fc4" /><stop offset="0.55" stopColor="#79bdea" />
              <stop offset="1" stopColor="#dff2fd" />
            </linearGradient>
            <linearGradient id={`${uid}-sky-dusk`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#241540" /><stop offset="0.45" stopColor="#6e3a68" />
              <stop offset="0.75" stopColor="#c85e4a" /><stop offset="1" stopColor="#ffab52" />
            </linearGradient>
            <linearGradient id={`${uid}-sky-night`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#04070f" /><stop offset="0.55" stopColor="#0a1430" />
              <stop offset="1" stopColor="#16264d" />
            </linearGradient>
            <linearGradient id={`${uid}-g-spring`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9ccb77" /><stop offset="1" stopColor="#5d924c" />
            </linearGradient>
            <linearGradient id={`${uid}-g-summer`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#74b257" /><stop offset="1" stopColor="#3f7a37" />
            </linearGradient>
            <linearGradient id={`${uid}-g-autumn`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d0995a" /><stop offset="1" stopColor="#8a5a30" />
            </linearGradient>
            <linearGradient id={`${uid}-g-winter`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f4f8fd" /><stop offset="1" stopColor="#c9d8ea" />
            </linearGradient>
            {/* кора — своя для каждого вида */}
            <linearGradient id={`${uid}-bark`} gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="-430">
              <stop offset="0" stopColor={sp.bark[0]} /><stop offset="0.4" stopColor={sp.bark[1]} />
              <stop offset="0.75" stopColor={sp.bark[2]} /><stop offset="1" stopColor={sp.bark[3]} />
            </linearGradient>
            <radialGradient id={`${uid}-c0`} cx="0.5" cy="0.5" r="0.62" fx="0.34" fy="0.3">
              <stop offset="0" stopColor="#2f6f42" /><stop offset="1" stopColor="#132c1b" />
            </radialGradient>
            <radialGradient id={`${uid}-c1`} cx="0.5" cy="0.5" r="0.62" fx="0.34" fy="0.3">
              <stop offset="0" stopColor="#5aa75c" /><stop offset="1" stopColor="#285230" />
            </radialGradient>
            <radialGradient id={`${uid}-c2`} cx="0.5" cy="0.5" r="0.62" fx="0.34" fy="0.3">
              <stop offset="0" stopColor="#97d37f" /><stop offset="1" stopColor="#4e8c46" />
            </radialGradient>
            {/* розовая крона сакуры */}
            <radialGradient id={`${uid}-cs0`} cx="0.5" cy="0.5" r="0.62" fx="0.34" fy="0.3">
              <stop offset="0" stopColor="#c2688c" /><stop offset="1" stopColor="#6e2b4c" />
            </radialGradient>
            <radialGradient id={`${uid}-cs1`} cx="0.5" cy="0.5" r="0.62" fx="0.34" fy="0.3">
              <stop offset="0" stopColor="#ef9cbb" /><stop offset="1" stopColor="#a34e78" />
            </radialGradient>
            <radialGradient id={`${uid}-cs2`} cx="0.5" cy="0.5" r="0.62" fx="0.34" fy="0.3">
              <stop offset="0" stopColor="#ffd0e2" /><stop offset="1" stopColor="#c96d99" />
            </radialGradient>
            <radialGradient id={`${uid}-glow`}>
              <stop offset="0" stopColor="#d6ffbe" stopOpacity="0.85" />
              <stop offset="0.55" stopColor="#beffaa" stopOpacity="0.28" />
              <stop offset="1" stopColor="#beffaa" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${uid}-warm`}>
              <stop offset="0" stopColor="#ffaa46" stopOpacity="0.55" />
              <stop offset="1" stopColor="#ffaa46" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${uid}-moonglow`}>
              <stop offset="0" stopColor="#bed7ff" stopOpacity="0.55" />
              <stop offset="1" stopColor="#bed7ff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${uid}-firefly`}>
              <stop offset="0" stopColor="#fff9cf" stopOpacity="0.95" />
              <stop offset="0.35" stopColor="#ffd66e" stopOpacity="0.5" />
              <stop offset="1" stopColor="#ffd66e" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${uid}-shadow`}>
              <stop offset="0" stopColor="#0a0e08" stopOpacity="0.55" />
              <stop offset="1" stopColor="#0a0e08" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${uid}-sun`}>
              <stop offset="0" stopColor="#fff8dc" stopOpacity="0.95" />
              <stop offset="0.4" stopColor="#ffd764" stopOpacity="0.55" />
              <stop offset="1" stopColor="#ffb43c" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${uid}-vig`} cx="0.5" cy="0.46" r="0.75">
              <stop offset="0.55" stopColor="#03060e" stopOpacity="0" />
              <stop offset="1" stopColor="#03060e" stopOpacity="0.42" />
            </radialGradient>
            <filter id={`${uid}-blur7`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>

          {/* ── небо, светила, звёзды ── */}
          <Sky uid={uid} tod={timeOfDay} mood={mood} seedKey={seedKey} />
          <g style={{ opacity: mood === 'rainbow' ? 0.8 : 0, transition: 'opacity 1.6s ease' }}>
            <Rainbow />
          </g>
          <Clouds uid={uid} mood={mood} tod={timeOfDay} />

          {/* ── земля ── */}
          {(['spring', 'summer', 'autumn', 'winter'] as Season[]).map((s) => (
            <path key={s} d={GROUND_D} fill={`url(#${uid}-g-${s})`}
              style={{ opacity: season === s ? 1 : 0, transition: 'opacity 1.6s ease' }} />
          ))}

          {/* тень под деревом */}
          <g style={{
            transform: `translate(${BASE_X}px, ${BASE_Y + 8}px) scale(${(0.3 + 0.7 * scaleV).toFixed(3)}, ${(0.5 + 0.5 * scaleV).toFixed(3)})`,
            transition: 'transform 1.6s ease',
          }}>
            <ellipse rx={175} ry={17} fill={`url(#${uid}-shadow)`} opacity={0.85} />
          </g>

          {/* камни */}
          <g opacity={0.9}>
            <path d="M 300 678 q 8 -16 26 -14 q 16 2 20 12 q 3 8 -8 10 l -34 0 q -8 -2 -4 -8 Z" fill="#7d8794" />
            <path d="M 306 672 q 7 -9 18 -8" stroke="#aeb9c6" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.7} />
            <path d="M 702 684 q 5 -10 17 -9 q 12 1 14 8 q 2 6 -6 7 l -22 0 q -6 -1 -3 -6 Z" fill="#6f7987" />
          </g>

          {/* трава */}
          <g fill="none" strokeLinecap="round" style={{ transition: 'stroke 1.6s ease' }} stroke={grassStroke}>
            {grass.map((gr, i) => (
              <path key={i} strokeWidth={1.8}
                d={`M ${f1(gr.x)} ${f1(gr.y)} q ${f1(gr.dx * 0.4)} ${f1(-gr.h * 0.6)} ${f1(gr.dx)} ${f1(-gr.h)}`} />
            ))}
          </g>

          {/* ── стадия 0: холмик с семечком ── */}
          {moundO > 0.01 && (
            <g style={{ opacity: moundO, transition: 'opacity 1.2s ease' }} transform={`translate(${BASE_X} ${BASE_Y + 2})`}>
              <ellipse rx={32} ry={10} fill="#5d4326" />
              <ellipse rx={32} ry={10} fill={`url(#${uid}-shadow)`} opacity={0.35} />
              <ellipse cx={0} cy={-6} rx={6.2} ry={4.2} fill="#8a5a33" transform="rotate(-18)" />
              <ellipse cx={-1.6} cy={-7.4} rx={1.8} ry={1} fill="#c99a63" transform="rotate(-18)" opacity={0.8} />
            </g>
          )}

          {/* ── стадии 1–2: росток ── */}
          {sproutO > 0.01 && (
            <g style={{
              opacity: sproutO, transition: 'opacity 1.2s ease',
              transform: `translate(${BASE_X}px, ${BASE_Y}px) scale(${sproutS.toFixed(3)})`,
            }}>
              <path d="M0 2 C 2 -8 -3 -16 1 -27" fill="none" stroke="#5aa75c" strokeWidth={3.2} strokeLinecap="round" />
              <path d={LEAF_D} fill="#7cc36f" transform="translate(1 -26) rotate(-38) scale(1.05)" />
              <path d={LEAF_D} fill="#69b45e" transform="translate(-1 -18) rotate(-142) scale(0.85)" />
            </g>
          )}

          {/* ══════════ ДЕРЕВО (масштаб = стадия роста) ══════════ */}
          <g style={{
            transform: `translate(${BASE_X}px, ${BASE_Y}px) scale(${scaleV.toFixed(4)})`,
            transition: 'transform 1.6s cubic-bezier(.22,.9,.3,1)',
          }}>
            {/* корни */}
            <g>
              {geom.roots.map((r, i) => <path key={i} d={r} fill={`url(#${uid}-bark)`} />)}
              <path d={geom.flare} fill={`url(#${uid}-bark)`} />
            </g>

            {/* пульсирующее свечение кроны */}
            {G > 1.6 && (
              <g transform={`translate(${f1(geom.canopy.x)} ${f1(geom.canopy.y)})`}>
                <g className="lt-glow" style={vars({ '--go': glowO.toFixed(3) })}>
                  <ellipse rx={geom.canopyR * 1.12} ry={geom.canopyR * 0.92} fill={`url(#${uid}-glow)`} />
                  {level >= 7 && (
                    <circle r={geom.canopyR * 1.06} fill="none" stroke="#ffe9a3" strokeWidth={1.6} opacity={0.5} />
                  )}
                </g>
              </g>
            )}

            {/* скелет */}
            {renderBranch(geom.root, G, winter, uid, 0)}

            {/* берестяные штрихи */}
            {geom.marks.map((m, i) => (
              <path key={`mk${i}`} d={m} stroke="#2b2822" strokeWidth={1.7} strokeLinecap="round" opacity={0.7} fill="none" />
            ))}

            {/* крона: «дышит», сезонный + видовой фильтр, зимой лиственным — голо */}
            <g transform={`translate(${f1(geom.canopy.x)} ${f1(geom.canopy.y)})`}>
              <g className="lt-breathe">
                <g transform={`translate(${f1(-geom.canopy.x)} ${f1(-geom.canopy.y)})`}
                  style={{
                    filter: canopyFilter,
                    opacity: winterBare ? 0 : 1,
                    transition: 'filter 1.8s ease, opacity 1.5s ease',
                  }}>
                  {geom.clusters.map((cl, i) => {
                    if (G < cl.appearAt - 1.15) return null;
                    const cg = smooth(clamp01((G - cl.appearAt) / 1.05));
                    return (
                      <g key={i} className="lt-enter" style={{
                        opacity: cg * 0.96,
                        transform: `translate(${f1(cl.x)}px, ${f1(cl.y)}px) scale(${(0.5 + 0.5 * cg).toFixed(3)})`,
                        transition: 'opacity 1.2s ease, transform 1.2s ease',
                      }}>
                        <path d={cl.path} fill={`url(#${uid}-${cBase}${cl.layer})`} />
                      </g>
                    );
                  })}
                </g>
              </g>
            </g>

            {/* цветы (весна) — вне сезонного фильтра */}
            {season === 'spring' && geom.blossoms.map((b, i) => G > b.at ? (
              <g key={`bl${i}`} transform={`translate(${f1(b.x)} ${f1(b.y)})`}>
                <g className="lt-pop">
                  <path d={FLOWER_D} fill={sp.blossomColor} transform={`rotate(${b.rot.toFixed(0)}) scale(${b.s.toFixed(2)})`} />
                  <circle r={1.25 * b.s} fill={sp.blossomCenter} />
                </g>
              </g>
            ) : null)}

            {/* плоды / шишки */}
            {showFruits && geom.fruits.map((b, i) => G > b.at ? (
              <g key={`fr${i}`} transform={`translate(${f1(b.x)} ${f1(b.y)}) rotate(${b.rot.toFixed(0)})`}>
                <g className="lt-pop">
                  {sp.fruit === 'cone'
                    ? <ellipse rx={2} ry={3.1} fill="#8a5a33" stroke="#5d3a1e" strokeWidth={0.5} />
                    : <>
                      <circle r={2.6 * b.s} fill={season === 'autumn' ? '#e0574a' : '#b7cf6a'} />
                      <circle r={0.8 * b.s} cx={-0.8} cy={-0.9} fill="#ffffff" opacity={0.5} />
                    </>}
                </g>
              </g>
            ) : null)}

            {/* тёплая подсветка кроны на закате / рассвете */}
            <ellipse cx={geom.canopy.x} cy={geom.canopy.y} rx={geom.canopyR * 1.1} ry={geom.canopyR * 0.9}
              fill={`url(#${uid}-warm)`}
              style={{ opacity: timeOfDay === 'dusk' ? 0.34 : timeOfDay === 'dawn' ? 0.16 : 0, transition: 'opacity 1.6s ease' }} />
          </g>

          {/* одиночный срывающийся лист */}
          {G > 3 && season !== 'winter' && sp.id !== 'pine' && (
            <g transform={`translate(${f1(sceneCX + geom.canopyR * 0.42)} ${f1(sceneCY + 26)})`}>
              <g className="lt-leafdrop">
                <path d={LEAF_D} fill={season === 'autumn' ? '#d9772f' : '#9dc46a'} transform="scale(0.9)" />
              </g>
            </g>
          )}

          {/* лунное сияние на крону */}
          <ellipse cx={sceneCX} cy={sceneCY} rx={geom.canopyR * scaleV * 1.2} ry={geom.canopyR * scaleV}
            fill={`url(#${uid}-moonglow)`}
            style={{ opacity: mood === 'moonlight' ? 0.32 : 0, transition: 'opacity 1.6s ease' }} />

          {/* ночное / погодное затемнение */}
          <rect x={0} y={0} width={1000} height={780} fill="#0b1233"
            style={{ opacity: darkO, transition: 'opacity 1.6s ease' }} />

          {mood === 'storm' && <Lightning />}
          {(mood === 'rain' || mood === 'storm') && <Rain seedKey={seedKey} heavy={mood === 'storm'} />}

          {/* частицы сезона — поверх затемнения */}
          <Particles uid={uid} seedKey={seedKey} season={season} G={G} />

          {/* мистические искры Мирового дерева */}
          {level >= 7 && (
            <g>
              {sparks.map((s, i) => (
                <g key={i} transform={`translate(${f1(sceneCX + s.ox)} ${f1(sceneCY + s.oy)})`}>
                  <circle r={s.r} fill={`url(#${uid}-glow)`} className="lt-rise"
                    style={vars({ '--dur': `${s.dur.toFixed(2)}s`, '--del': `-${s.delay.toFixed(2)}s` })} />
                </g>
              ))}
            </g>
          )}

          {/* виньетка */}
          <rect x={0} y={0} width={1000} height={780} fill={`url(#${uid}-vig)`} style={{ pointerEvents: 'none' }} />
        </svg>

        {showProgress && <ProgressBar level={level} progress={prog} species={sp} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════ <TreePlayground /> ═══════════════════════════ */
const SEED_PRESETS = ['древний дуб', 'сакура у реки', 'северный кедр', 'плакучая ива', 'баобаб', 'белая берёза', 'клен', 'горная сосна'];

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className={'lt-chip' + (active ? ' active' : '')} onClick={onClick}>{children}</button>;
}

export function TreePlayground() {
  const [growth, setGrowth] = useState({ level: 5, progress: 0.35 });
  const [species, setSpecies] = useState<SpeciesProp>('auto');
  const [season, setSeason] = useState<Season>('spring');
  const [tod, setTod] = useState<TimeOfDay>('day');
  const [mood, setMood] = useState<Mood>('clear');
  const [seed, setSeed] = useState('мировое-дерево');
  const [playing, setPlaying] = useState(false);

  const sp = resolveSpecies(seed, species);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setGrowth((g) => {
        const np = g.progress + 0.011;
        if (np >= 1) {
          if (g.level >= 7) return { level: 0, progress: 0 };
          return { level: g.level + 1, progress: 0 };
        }
        return { ...g, progress: np };
      });
    }, 80);
    return () => window.clearInterval(id);
  }, [playing]);

  const bump = (d: number) =>
    setGrowth((g) => ({ level: Math.max(0, Math.min(7, g.level + d)), progress: 0 }));

  return (
    <div className="lt-page">
      <style>{STYLES}</style>
      <div className="lt-app">
        <header className="lt-head">
          <h1>Живое дерево</h1>
          <p>генеративный SVG-арт · 5 видов деревьев · детерминированная геометрия по сиду</p>
        </header>

        <LivingTree
          seedKey={seed}
          species={species}
          level={growth.level}
          levelProgress={growth.progress}
          season={season}
          timeOfDay={tod}
          mood={mood}
        />

        <div className="lt-panel">
          <div className="lt-row">
            <span className="lt-label">Вид дерева</span>
            <Chip active={species === 'auto'} onClick={() => setSpecies('auto')}>🎲 Авто</Chip>
            {SPECIES_ARR.map((s) => (
              <Chip key={s.id} active={species === s.id} onClick={() => setSpecies(s.id)}>
                {s.emoji} {s.label}
              </Chip>
            ))}
            {species === 'auto' && <span className="lt-hint">по сиду сейчас: {sp.emoji} {sp.label}</span>}
          </div>
          <div className="lt-row">
            <span className="lt-label">Стадия роста</span>
            <button className="lt-btn" onClick={() => bump(-1)} disabled={growth.level <= 0}>−</button>
            <b className="lt-value">{growth.level} · {STAGE_NAMES[growth.level]}</b>
            <button className="lt-btn" onClick={() => bump(1)} disabled={growth.level >= 7}>+</button>
            <button className={'lt-btn lt-auto' + (playing ? ' on' : '')} onClick={() => setPlaying((p) => !p)}>
              {playing ? '⏸ пауза' : '▶ авто-рост'}
            </button>
          </div>
          <div className="lt-row">
            <span className="lt-label">Прогресс</span>
            <input className="lt-range" type="range" min={0} max={1} step={0.005}
              value={growth.progress}
              onChange={(e) => setGrowth((g) => ({ ...g, progress: Number(e.target.value) }))} />
            <span className="lt-pct">{Math.round(growth.progress * 100)}%</span>
          </div>
          <div className="lt-row">
            <span className="lt-label">Сезон</span>
            {([['spring', '🌸 Весна'], ['summer', '☀️ Лето'], ['autumn', '🍂 Осень'], ['winter', '❄️ Зима']] as [Season, string][]).map(([v, l]) => (
              <Chip key={v} active={season === v} onClick={() => setSeason(v)}>{l}</Chip>
            ))}
          </div>
          <div className="lt-row">
            <span className="lt-label">Время суток</span>
            {([['dawn', '🌅 Рассвет'], ['day', '🌞 День'], ['dusk', '🌇 Закат'], ['night', '🌙 Ночь']] as [TimeOfDay, string][]).map(([v, l]) => (
              <Chip key={v} active={tod === v} onClick={() => setTod(v)}>{l}</Chip>
            ))}
          </div>
          <div className="lt-row">
            <span className="lt-label">Настроение</span>
            {([['clear', 'Ясно'], ['rain', '🌧 Дождь'], ['storm', '⛈ Гроза'], ['rainbow', '🌈 Радуга'], ['moonlight', '🌌 Лунный свет']] as [Mood, string][]).map(([v, l]) => (
              <Chip key={v} active={mood === v} onClick={() => setMood(v)}>{l}</Chip>
            ))}
          </div>
          <div className="lt-row">
            <span className="lt-label">Сид</span>
            <input className="lt-input" value={seed} onChange={(e) => setSeed(e.target.value)}
              placeholder="введите строку-сид…" />
            <button className="lt-btn" onClick={() => setSeed(SEED_PRESETS[Math.floor(Math.random() * SEED_PRESETS.length)] + '-' + Math.floor(Math.random() * 99))}>
              🎲
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────── стили ─────────────────────────────── */
const STYLES = `
.lt-root{width:100%}
.lt-page{min-height:100vh;background:#070b14;background-image:radial-gradient(1200px 700px at 50% -10%, #12203a 0%, #070b14 60%);display:flex;justify-content:center;padding:28px 16px;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#e8eef7;box-sizing:border-box}
.lt-app{width:100%;max-width:880px;display:flex;flex-direction:column;gap:18px}
.lt-head h1{margin:0;font-size:27px;letter-spacing:.4px;background:linear-gradient(90deg,#9be28b,#ffd166);-webkit-background-clip:text;background-clip:text;color:transparent}
.lt-head p{margin:5px 0 0;color:#8fa0b8;font-size:13px}
.lt-frame{border-radius:22px;overflow:hidden;box-shadow:0 18px 44px -22px rgb(30 27 60 / 0.5),0 0 0 1px color-mix(in_srgb,var(--hwd-primary) 30%,rgb(255 255 255 / 0.7));background:#0a1220}
.lt-svg{display:block;width:100%;height:auto}
.lt-progress{background:linear-gradient(180deg,rgb(255 255 255 / 0.94),rgb(255 255 255 / 0.82));border-top:1px solid color-mix(in_srgb,var(--hwd-ink-soft) 16%,transparent);padding:14px 18px 12px;display:flex;flex-direction:column;gap:8px}
.lt-segments{display:flex;gap:5px}
.lt-seg{flex:1;height:9px;border-radius:6px;background:rgba(75,74,117,.14);overflow:hidden}
.lt-seg-fill{height:100%;border-radius:6px;background:linear-gradient(90deg,var(--hwd-primary-deep),var(--hwd-primary));transition:width .45s ease;box-shadow:0 0 8px color-mix(in_srgb,var(--hwd-primary) 50%,transparent)}
.lt-seg.done .lt-seg-fill{background:linear-gradient(90deg,var(--hwd-primary-deep),var(--hwd-primary));opacity:.55;box-shadow:none}
.lt-progress-label{display:flex;justify-content:space-between;gap:10px;font-size:12.5px;color:var(--hwd-ink-soft);flex-wrap:wrap}
.lt-progress-label b{color:var(--hwd-primary-deep);font-weight:700}
.lt-panel{background:rgba(13,18,30,.85);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:18px;display:flex;flex-direction:column;gap:14px;backdrop-filter:blur(8px)}
.lt-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.lt-label{font-size:11.5px;text-transform:uppercase;letter-spacing:.12em;color:#7f90a8;min-width:100px}
.lt-value{font-size:13.5px;color:#ffe08f;min-width:150px}
.lt-pct{font-size:12.5px;color:#9fb0c6;min-width:38px;text-align:right}
.lt-hint{font-size:12px;color:#8fd06f;margin-left:4px}
.lt-chip{padding:7px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04);color:#cdd9e8;font-size:13px;cursor:pointer;transition:all .2s;font-family:inherit}
.lt-chip:hover{background:rgba(255,255,255,.1)}
.lt-chip.active{background:linear-gradient(135deg,#5fae56,#8fd06f);border-color:transparent;color:#0b1408;font-weight:600;box-shadow:0 4px 14px rgba(120,200,100,.35)}
.lt-btn{padding:7px 13px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);color:#e8eef7;font-size:14px;cursor:pointer;transition:all .2s;font-family:inherit}
.lt-btn:hover:not(:disabled){background:rgba(255,255,255,.12)}
.lt-btn:disabled{opacity:.35;cursor:default}
.lt-btn.lt-auto{margin-left:auto;font-size:12.5px}
.lt-btn.lt-auto.on{background:linear-gradient(135deg,#c98a3d,#ffd166);color:#241503;border-color:transparent;font-weight:600}
.lt-input{flex:1;min-width:140px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:8px 12px;color:#e8eef7;font-size:14px;outline:none;font-family:inherit}
.lt-input:focus{border-color:#8fd06f}
.lt-range{flex:1;accent-color:#8fd06f;min-width:120px}

/* ── анимации: только transform/opacity ── */
@keyframes ltSway{from{transform:rotate(calc(var(--amp,1deg)*-1))}to{transform:rotate(var(--amp,1deg))}}
.lt-sway{animation:ltSway var(--dur,6s) ease-in-out var(--del,0s) infinite alternate;transform-origin:0 0}
.lt-frame.lt-windy .lt-sway{animation-duration:calc(var(--dur,6s)*.75)}
.lt-frame.lt-storm .lt-sway{animation-duration:calc(var(--dur,6s)*.5)}
@keyframes ltBreathe{from{transform:scale(1)}to{transform:scale(1.02)}}
.lt-breathe{animation:ltBreathe 5.5s ease-in-out infinite alternate;transform-origin:0 0}
@keyframes ltGlow{from{opacity:calc(var(--go,.3)*.55);transform:scale(1)}to{opacity:var(--go,.3);transform:scale(1.06)}}
.lt-glow{animation:ltGlow 4.8s ease-in-out infinite alternate;transform-origin:0 0}
@keyframes ltEnter{from{opacity:0}}
.lt-enter{animation:ltEnter 1.3s ease both}
@keyframes ltPop{from{opacity:0;transform:scale(.2)}}
.lt-pop{animation:ltPop .9s cubic-bezier(.2,.8,.3,1.25) both}
@keyframes ltFall{from{transform:translateY(-40px)}to{transform:translateY(830px)}}
.lt-fall{animation:ltFall var(--dur,10s) linear var(--del,0s) infinite}
@keyframes ltSwayX{0%{transform:translateX(calc(var(--sw,14px)*-1)) rotate(0deg)}50%{transform:translateX(var(--sw,14px)) rotate(var(--rt,160deg))}100%{transform:translateX(calc(var(--sw,14px)*-1)) rotate(calc(var(--rt,160deg)*2))}}
.lt-swayx{animation:ltSwayX var(--dur,3s) ease-in-out infinite}
@keyframes ltDrift{0%{transform:translate(0,0)}25%{transform:translate(15px,-11px)}50%{transform:translate(-7px,-19px)}75%{transform:translate(-15px,-5px)}100%{transform:translate(0,0)}}
.lt-drift{animation:ltDrift var(--dur,8s) ease-in-out var(--del,0s) infinite}
@keyframes ltFlicker{0%,100%{opacity:.12}45%{opacity:1}60%{opacity:.3}80%{opacity:.85}}
.lt-flicker{animation:ltFlicker var(--dur,2.4s) ease-in-out infinite}
@keyframes ltTwinkle{0%,100%{opacity:.25}50%{opacity:1}}
.lt-twinkle{animation:ltTwinkle var(--dur,3s) ease-in-out var(--del,0s) infinite}
@keyframes ltRainFall{from{transform:translateY(-60px)}to{transform:translateY(820px)}}
.lt-rain{animation:ltRainFall var(--dur,.8s) linear var(--del,0s) infinite}
@keyframes ltFlash{0%,79%,87%,100%{opacity:0}80%{opacity:.9}82%{opacity:.15}84%{opacity:.7}}
.lt-flash{animation:ltFlash 7s linear infinite;opacity:0}
@keyframes ltLeafDrop{0%,54%{transform:translate(0,0) rotate(0deg);opacity:0}57%{opacity:1}90%{opacity:1}100%{transform:translate(-95px,330px) rotate(300deg);opacity:0}}
.lt-leafdrop{animation:ltLeafDrop 13s ease-in 2s infinite}
@keyframes ltCloudDrift{from{transform:translateX(-24px)}to{transform:translateX(24px)}}
.lt-clouddrift{animation:ltCloudDrift var(--dur,50s) ease-in-out infinite alternate}
@keyframes ltRise{0%{transform:translateY(28px);opacity:0}20%{opacity:.9}100%{transform:translateY(-230px);opacity:0}}
.lt-rise{animation:ltRise var(--dur,6s) ease-out var(--del,0s) infinite}
@media (prefers-reduced-motion: reduce){
  .lt-sway,.lt-breathe,.lt-glow,.lt-fall,.lt-swayx,.lt-drift,.lt-flicker,.lt-twinkle,.lt-rain,.lt-flash,.lt-leafdrop,.lt-clouddrift,.lt-rise,.lt-pop,.lt-enter{animation:none}
}
`;

export default TreePlayground;
