import { mulberry32 } from './random';
import { SpeciesGeometry } from '../config/species';

export interface Branch {
  id: string; x1: number; y1: number; x2: number; y2: number;
  cx: number; cy: number; d: string; width: number; depth: number;
}
export interface LeafCluster { x: number; y: number; rx: number; ry: number; tier: 0 | 1 | 2; }
export interface FlowerSpot { x: number; y: number; r: number; }
export interface FruitSpot { x: number; y: number; r: number; }
export interface RootStrand { id: string; d: string; width: number; }
export interface Strand { d: string; width: number; }

export interface TreeGeometry {
  branches: Branch[];
  strands: Strand[];
  roots: RootStrand[];
  leafClusters: LeafCluster[];
  flowers: FlowerSpot[];
  fruits: FruitSpot[];
  canopyCenter: { x: number; y: number };
  canopyRadius: number;
  trunkBase: { x: number; y: number };
  anchors: { x: number; y: number }[];
}

export interface BuildTreeParams {
  seed: number; trunkH: number; trunkW: number; branchDepth: number;
  leaves: number; flowers: number; fruits: number; roots: number;
  speciesGeometry?: SpeciesGeometry;
}

const BASE_X = 400;
const BASE_Y = 900;

/* Доли купола по важности: на низких уровнях видны только первые. */
const DOME_SPOTS = [
  { dx: 0,     dy: -0.22, s: 0.92, tier: 1 },
  { dx: -0.56, dy: -0.36, s: 0.62, tier: 0 },
  { dx: 0.56,  dy: -0.36, s: 0.62, tier: 0 },
  { dx: 0,     dy: -0.70, s: 0.55, tier: 1 },
  { dx: -0.90, dy:  0.06, s: 0.50, tier: 2 },
  { dx: 0.90,  dy:  0.06, s: 0.50, tier: 2 },
  { dx: -0.44, dy:  0.34, s: 0.46, tier: 2 },
  { dx: 0.44,  dy:  0.34, s: 0.46, tier: 2 },
] as const;

/* Ярусы сосны. */
const PINE_TIERS = [
  { dy:  0.62, sx: 1.00, sy: 0.30, tier: 2 },
  { dy:  0.24, sx: 0.80, sy: 0.27, tier: 1 },
  { dy: -0.12, sx: 0.60, sy: 0.24, tier: 1 },
  { dy: -0.44, sx: 0.40, sy: 0.21, tier: 0 },
  { dy: -0.72, sx: 0.20, sy: 0.17, tier: 0 },
] as const;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/* Раскладка долей листвы — центры, радиусы, ярусы. Форма зависит от вида. */
function layoutLobes(
  cx: number, cy: number, R: number, shape: string, leaves: number, rng: () => number,
): LeafCluster[] {
  const lobes: LeafCluster[] = [];
  const sizeF = 0.42 + leaves * 0.62;

  if (shape === 'tiers') {
    // Сосна: каждый ярус = две широкие плоские доли, перекрывающиеся в центре.
    for (const t of PINE_TIERS) {
      const ry = R * t.sy * sizeF;
      const rxHalf = R * t.sx * sizeF * 0.62;
      const y = cy + t.dy * R;
      lobes.push({ x: cx - rxHalf * 0.7, y, rx: rxHalf, ry, tier: t.tier as 0 | 1 | 2 });
      lobes.push({ x: cx + rxHalf * 0.7, y, rx: rxHalf, ry, tier: t.tier as 0 | 1 | 2 });
    }
    return lobes;
  }

  const wide = shape === 'wide';
  const droop = shape === 'droop';
  const n = Math.max(2, Math.round(DOME_SPOTS.length * (0.28 + leaves * 0.72)));
  for (let i = 0; i < n && i < DOME_SPOTS.length; i++) {
    const s = DOME_SPOTS[i];
    const jx = 1 + (rng() - 0.5) * 0.14;
    const jy = 1 + (rng() - 0.5) * 0.14;
    const rx = R * s.s * sizeF * jx * (wide ? 1.28 : 1);
    let ry = R * s.s * sizeF * jy * (wide ? 0.70 : 0.86);
    if (droop && s.dy > 0.2) ry *= 1.5; // ива: нижние доли тянутся вниз
    lobes.push({
      x: cx + s.dx * R * (wide ? 1.18 : 1) + (rng() - 0.5) * R * 0.04,
      y: cy + s.dy * R * (wide ? 0.60 : 1),
      rx, ry,
      tier: s.tier as 0 | 1 | 2,
    });
  }
  return lobes;
}

export function buildTree(p: BuildTreeParams): TreeGeometry {
  const rng = mulberry32(p.seed);
  const sg = p.speciesGeometry;
  const crownScale = sg?.crownScale ?? 1;
  const droop = sg?.droop ?? 0.05;
  const shape = sg?.canopyShape ?? 'dome';

  const branches: Branch[] = [];
  let counter = 0;
  const pushBranch = (
    x1: number, y1: number, x2: number, y2: number,
    cx: number, cy: number, width: number, depth: number,
  ) => {
    counter++;
    branches.push({
      id: `b-${counter}`, x1, y1, x2, y2, cx, cy,
      d: `M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      width, depth,
    });
  };

  // ── Ствол ──
  const topY = BASE_Y - p.trunkH;
  const trunkCx = BASE_X + (rng() - 0.5) * p.trunkW * 0.4;
  const trunkCy = BASE_Y - p.trunkH * 0.5;
  branches.push({
    id: 'b-trunk', x1: BASE_X, y1: BASE_Y, x2: BASE_X, y2: topY,
    cx: trunkCx, cy: trunkCy,
    d: `M ${BASE_X} ${BASE_Y} Q ${trunkCx.toFixed(1)} ${trunkCy.toFixed(1)} ${BASE_X} ${topY.toFixed(1)}`,
    width: p.trunkW, depth: 0,
  });

  // ── Крона: раскладка долей ──
  const R = crownScale * (p.trunkH * 0.28 + p.trunkW * 0.5);
  const cx = BASE_X;
  const cy = topY - R * 0.22;
  const leafClusters = layoutLobes(cx, cy, R, shape, p.leaves, rng);

  // ── Ветки: к каждой доле — ветка от ствола с развилкой на конце ──
  // Так листва растёт НА концах веток, а не висит отдельным комом.
  const forked = p.leaves >= 0.35;
  for (const lobe of leafClusters) {
    const lx = lobe.x;
    const ly = lobe.y;
    // Чем выше доля, тем выше точка крепления на стволе.
    const normalizedH = clamp01(((cy + R) - ly) / (2 * R));
    const attachY = topY + p.trunkH * 0.34 * (1 - normalizedH);
    const attachX = BASE_X + (rng() - 0.5) * p.trunkW * 0.3;

    // Точка подхода — ~68% пути к доле.
    const ax = attachX + (lx - attachX) * 0.68;
    const ay = attachY + (ly - attachY) * 0.68 + droop * Math.abs(lx - attachX) * 0.18;

    // Основная ветка: ствол → подход (плавная дуга).
    const mcx = (attachX + ax) / 2;
    const mcy = (attachY + ay) / 2 - Math.abs(ax - attachX) * 0.12 + droop * Math.abs(ax - attachX) * 0.2;
    pushBranch(attachX, attachY, ax, ay, mcx, mcy, p.trunkW * 0.3, 1);

    if (forked) {
      // Развилка: два коротких отростка внутрь доли — «ветка держит крону».
      const twigW = Math.max(1.6, p.trunkW * 0.16);
      pushBranch(ax, ay, lx - lobe.rx * 0.28, ly, (ax + lx) / 2, (ay + ly) / 2 - 5, twigW, 2);
      pushBranch(ax, ay, lx + lobe.rx * 0.28, ly, (ax + lx) / 2, (ay + ly) / 2 + 5, twigW, 2);
    } else {
      // Молодое деревце: одна ветка прямо к доле.
      pushBranch(ax, ay, lx, ly, (ax + lx) / 2, (ay + ly) / 2 - 4, Math.max(1.6, p.trunkW * 0.18), 2);
    }
  }

  // ── Радиус кроны ──
  let canopyRadius = R;
  if (leafClusters.length) {
    canopyRadius = Math.max(...leafClusters.map((c) => Math.hypot(c.x - cx, c.y - cy) + Math.max(c.rx, c.ry)));
  }

  // ── Цветы по краю долей ──
  const flowers: FlowerSpot[] = [];
  for (let i = 0; i < Math.min(14, Math.round(p.flowers)) && leafClusters.length; i++) {
    const lobe = leafClusters[Math.floor(rng() * leafClusters.length)];
    const a = rng() * Math.PI * 2;
    flowers.push({
      x: lobe.x + Math.cos(a) * lobe.rx * 0.7,
      y: lobe.y + Math.sin(a) * lobe.ry * 0.7,
      r: 4.5 + rng() * 3,
    });
  }

  // ── Плоды в нижних долях ──
  const fruits: FruitSpot[] = [];
  for (let i = 0; i < Math.min(8, Math.round(p.fruits)) && leafClusters.length; i++) {
    const lobe = leafClusters[Math.floor(rng() * leafClusters.length)];
    fruits.push({
      x: lobe.x + (rng() - 0.5) * lobe.rx * 0.8,
      y: lobe.y + lobe.ry * (0.2 + rng() * 0.4),
      r: 5 + rng() * 2.5,
    });
  }

  // ── Ива: поникшие пряди ──
  const strands: Strand[] = [];
  if (shape === 'droop' && p.leaves > 0.4) {
    const n = 9;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const px = cx + (t - 0.5) * R * 1.7;
      const py = cy + R * (0.35 + rng() * 0.15);
      const len = p.trunkH * (0.35 + rng() * 0.2);
      const sway = (rng() - 0.5) * 40;
      strands.push({
        d: `M ${px.toFixed(1)} ${py.toFixed(1)} Q ${(px + sway * 0.5).toFixed(1)} ${(py + len * 0.55).toFixed(1)}, ${(px + sway).toFixed(1)} ${(py + len).toFixed(1)}`,
        width: 1.4 + rng() * 1.2,
      });
    }
  }

  // ── Корни ──
  const roots: RootStrand[] = [];
  const nRoots = 3 + Math.round(p.roots * 3);
  for (let i = 0; i < nRoots; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const sp = (0.45 + rng() * 0.6) * side;
    const len = p.trunkW * (1.1 + rng() * 1.2) * (0.5 + p.roots);
    roots.push({
      id: `r-${i}`,
      d: `M ${BASE_X} ${BASE_Y} Q ${(BASE_X + sp * len * 0.4).toFixed(1)} ${(BASE_Y + len * 0.1).toFixed(1)}, ${(BASE_X + sp * len).toFixed(1)} ${(BASE_Y + len * 0.26).toFixed(1)}`,
      width: Math.max(2, p.trunkW * 0.26 * (1 - i * 0.05)),
    });
  }

  // ── Якоря: нижние доли (для подвесных предметов) ──
  const anchors: { x: number; y: number }[] = [];
  const lowerLobes = [...leafClusters].sort((a, b) => b.y - a.y).slice(0, 4);
  for (const lobe of lowerLobes) anchors.push({ x: lobe.x, y: lobe.y + lobe.ry * 0.4 });
  if (!anchors.length) anchors.push({ x: BASE_X, y: topY });

  return {
    branches, strands, roots, leafClusters, flowers, fruits,
    canopyCenter: { x: cx, y: cy },
    canopyRadius: canopyRadius * 1.05,
    trunkBase: { x: BASE_X, y: BASE_Y },
    anchors,
  };
}