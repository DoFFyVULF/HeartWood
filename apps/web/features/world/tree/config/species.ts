import { Season } from './stages';

export type TreeSpeciesId = 'oak' | 'apple' | 'maple' | 'pine' | 'magnolia' | 'willow' | 'sakura';

export const LEVEL_SPECIES: (TreeSpeciesId | null)[] = [
  null, 'oak', 'apple', 'maple', 'pine', 'magnolia', 'willow', 'sakura',
];

export function getSpeciesForLevel(level: number): TreeSpeciesId | null {
  return LEVEL_SPECIES[Math.min(level, LEVEL_SPECIES.length - 1)] ?? null;
}

export interface SpeciesGeometry {
  trunkHScale: number;
  trunkWScale: number;
  crownScale: number;
  branchAngle: number;
  branchCurve: number;
  droop: number;
  canopyShape: 'dome' | 'wide' | 'tiers' | 'droop';
}

export interface SpeciesPalette {
  bark: { base: string; light: string; dark: string };
  leaf: [string, string, string];
  flower: string[];
  fruit?: string;
  fruitGlow?: string;
}

export interface SpeciesBloom { fromLevel: number; density: number; flowersOverLeaves: boolean; }

export interface SpeciesParticle {
  kind: 'petal' | 'pollen' | 'leaf' | 'snow' | 'firefly';
  colors: string[];
  rateScale: number;
  allSeason: boolean;
}

export interface TreeSpecies {
  id: TreeSpeciesId;
  label: string;
  description: string;
  geometry: SpeciesGeometry;
  palette: SpeciesPalette;
  bloom: SpeciesBloom;
  particle: SpeciesParticle;
  seasonal?: Partial<Record<Season, { leaf?: [string, string, string]; particleColors?: string[] }>>;
  swayScale: number;
}

export const SPECIES: Record<TreeSpeciesId, TreeSpecies> = {
  oak: {
    id: 'oak', label: 'Дуб',
    description: 'Крепость фундамента. Корни, которые не вырвет буря.',
    geometry: { trunkHScale: 0.95, trunkWScale: 1.45, crownScale: 1.5, branchAngle: 38, branchCurve: 0.3, droop: 0.0, canopyShape: 'dome' },
    palette: { bark: { base: '#4A3828', light: '#6B5440', dark: '#2E2018' }, leaf: ['#5FA85E', '#4A9050', '#3A7A42'], flower: ['#8FA860', '#A0B870'], fruit: '#8B6B3A', fruitGlow: '#A8844A' },
    bloom: { fromLevel: 3, density: 0.5, flowersOverLeaves: false },
    particle: { kind: 'leaf', colors: ['#5FA85E', '#4A9050', '#6FBF6E'], rateScale: 0.8, allSeason: false },
    seasonal: { autumn: { leaf: ['#C9985A', '#A87840', '#8B6030'] }, winter: { leaf: ['#9DB8BE', '#8AA8AE', '#7A9AA0'] } },
    swayScale: 0.7,
  },
  apple: {
    id: 'apple', label: 'Яблоня',
    description: 'Первые плоды. Каждый цветок — обещание урожая.',
    geometry: { trunkHScale: 0.95, trunkWScale: 1.0, crownScale: 1.2, branchAngle: 45, branchCurve: 0.4, droop: 0.1, canopyShape: 'dome' },
    palette: { bark: { base: '#6B4E3A', light: '#8A6A50', dark: '#4A3428' }, leaf: ['#7FD3A0', '#5FBF8A', '#3E9E6E'], flower: ['#FFFFFF', '#FFE8EE', '#FFD3E0', '#FFC0CB'], fruit: '#E84040', fruitGlow: '#FF6B6B' },
    bloom: { fromLevel: 2, density: 1.2, flowersOverLeaves: false },
    particle: { kind: 'petal', colors: ['#FFFFFF', '#FFE8EE', '#FFD3E0'], rateScale: 1.2, allSeason: false },
    seasonal: { autumn: { leaf: ['#F2C97A', '#E8A85A', '#D4813A'] }, winter: { leaf: ['#D9ECEF', '#C8DDE0', '#B0CDD2'] } },
    swayScale: 1.0,
  },
  maple: {
    id: 'maple', label: 'Клён',
    description: 'Яркость чувств. Чем холоднее — тем сильнее горим.',
    geometry: { trunkHScale: 1.0, trunkWScale: 0.9, crownScale: 1.3, branchAngle: 50, branchCurve: 0.45, droop: 0.15, canopyShape: 'dome' },
    palette: { bark: { base: '#5A4438', light: '#7A6050', dark: '#3E2E24' }, leaf: ['#7FD3A0', '#5FBF8A', '#4AA870'], flower: ['#C9E64A', '#A8D030'], fruit: '#D4813A', fruitGlow: '#E8A85A' },
    bloom: { fromLevel: 3, density: 0.7, flowersOverLeaves: false },
    particle: { kind: 'leaf', colors: ['#F2A65A', '#E0704A', '#C94F3D', '#FFD700'], rateScale: 1.4, allSeason: false },
    seasonal: {
      spring: { leaf: ['#A8E6A0', '#8FD68A', '#7FC97A'] }, summer: { leaf: ['#5FBF8A', '#4AA870', '#3A9060'] },
      autumn: { leaf: ['#FF6B3A', '#E04020', '#C92010'], particleColors: ['#FF6B3A', '#FFD700', '#E04020', '#C94F3D'] },
      winter: { leaf: ['#D9ECEF', '#C8DDE0', '#B0CDD2'] },
    },
    swayScale: 1.1,
  },
  pine: {
    id: 'pine', label: 'Сосна',
    description: 'Стойкость. Не увядает ни в какой сезон.',
    geometry: { trunkHScale: 1.25, trunkWScale: 0.8, crownScale: 0.75, branchAngle: 72, branchCurve: 0.12, droop: 0.08, canopyShape: 'tiers' },
    palette: { bark: { base: '#6B4A32', light: '#8A6448', dark: '#4A3020' }, leaf: ['#3E7A4A', '#2E6A3A', '#1E5A2E'], flower: ['#E8D060'], fruit: '#8B6040', fruitGlow: '#A87850' },
    bloom: { fromLevel: 5, density: 0.3, flowersOverLeaves: false },
    particle: { kind: 'pollen', colors: ['#E8D060', '#D4C050', '#F0E080'], rateScale: 0.9, allSeason: false },
    seasonal: {
      spring: { leaf: ['#4A8A56', '#3E7A4A', '#2E6A3A'] }, summer: { leaf: ['#3E7A4A', '#2E6A3A', '#1E5A2E'] },
      autumn: { leaf: ['#3A7444', '#2E6438', '#225430'] }, winter: { leaf: ['#3A7444', '#2E6438', '#1E5428'] },
    },
    swayScale: 0.6,
  },
  magnolia: {
    id: 'magnolia', label: 'Магнолия',
    description: 'Расцвет. Древнейший цветок на земле — как ваша зрелая любовь.',
    geometry: { trunkHScale: 0.9, trunkWScale: 1.05, crownScale: 1.25, branchAngle: 48, branchCurve: 0.5, droop: 0.12, canopyShape: 'dome' },
    palette: { bark: { base: '#6A6A72', light: '#8A8A92', dark: '#4A4A52' }, leaf: ['#4A8A50', '#3A7A42', '#2E6A36'], flower: ['#F2A0C0', '#E880B0', '#FFFFFF', '#D070A0', '#C860D0'], fruit: '#C86090', fruitGlow: '#E880B0' },
    bloom: { fromLevel: 5, density: 1.3, flowersOverLeaves: true },
    particle: { kind: 'petal', colors: ['#F2A0C0', '#E880B0', '#FFFFFF', '#D8B0E0'], rateScale: 1.4, allSeason: false },
    seasonal: {
      spring: { leaf: ['#5A9A60', '#4A8A50', '#3A7A42'] }, summer: { leaf: ['#4A8A50', '#3A7A42', '#2E6A36'] },
      autumn: { leaf: ['#C9A050', '#B08A40', '#9A7A38'] }, winter: { leaf: ['#B0CDD2', '#9DB8BE', '#8AA8AE'] },
    },
    swayScale: 0.9,
  },
  willow: {
    id: 'willow', label: 'Ива',
    description: 'Нежность и глубина. Ветви до земли — как руки, тянущиеся к тебе.',
    geometry: { trunkHScale: 1.05, trunkWScale: 0.85, crownScale: 1.35, branchAngle: 55, branchCurve: 0.65, droop: 0.9, canopyShape: 'droop' },
    palette: { bark: { base: '#6B6B4A', light: '#8A8A62', dark: '#4A4A32' }, leaf: ['#A0D890', '#80C870', '#60B850'], flower: ['#E8E6A0', '#D8D680'] },
    bloom: { fromLevel: 6, density: 0.4, flowersOverLeaves: false },
    particle: { kind: 'leaf', colors: ['#A0D890', '#80C870', '#C0E8B0'], rateScale: 1.0, allSeason: false },
    seasonal: {
      spring: { leaf: ['#B0E8A0', '#A0D890', '#80C870'] }, summer: { leaf: ['#80C870', '#60B850', '#50A840'] },
      autumn: { leaf: ['#E8D070', '#D4B850', '#C0A040'] }, winter: { leaf: ['#C8DDE0', '#B0CDD2', '#9DB8BE'] },
    },
    swayScale: 1.5,
  },
  sakura: {
    id: 'sakura', label: 'Сакура',
    description: 'Высшая красота. Каждый лепесток — день, прожитый вместе. Осыпается — и это прекрасно.',
    geometry: { trunkHScale: 0.85, trunkWScale: 0.8, crownScale: 1.45, branchAngle: 58, branchCurve: 0.7, droop: 0.25, canopyShape: 'wide' },
    palette: { bark: { base: '#5C3A2E', light: '#7A4E3C', dark: '#3E2418' }, leaf: ['#A8D8A0', '#8FC98A', '#6FB06E'], flower: ['#FFB7C5', '#FF9EB5', '#FFC9D6', '#FFFFFF', '#F2789F'], fruit: '#C94F6A', fruitGlow: '#FF9EB5' },
    bloom: { fromLevel: 7, density: 1.5, flowersOverLeaves: true },
    particle: { kind: 'petal', colors: ['#FFB7C5', '#FFC9D6', '#FF9EB5', '#FFFFFF', '#F8D0DA'], rateScale: 1.8, allSeason: true },
    seasonal: {
      spring: { leaf: ['#C8E6C0', '#A8D8A0', '#8FC98A'] }, summer: { leaf: ['#7FBF7A', '#5FA85E', '#4A9050'] },
      autumn: { leaf: ['#F2C97A', '#E8A85A', '#D4813A'], particleColors: ['#F2C97A', '#E8A85A', '#FFB7C5'] },
      winter: { leaf: ['#D9ECEF', '#C8DDE0', '#B0CDD2'], particleColors: ['#FFFFFF', '#F0F8FF', '#FFD9E0'] },
    },
    swayScale: 1.2,
  },
};

export function getLeafPalette(species: TreeSpecies, season: Season): [string, string, string] {
  return species.seasonal?.[season]?.leaf ?? species.palette.leaf;
}

export function getParticleColors(species: TreeSpecies, season: Season): string[] {
  return species.seasonal?.[season]?.particleColors ?? species.particle.colors;
}