/**
 * Mulberry32 — tiny, fast, deterministic seeded PRNG.
 *
 * Why: the tree's "appearance" must be STABLE across re-renders for a given pair
 * (same seed → same branches/anchors/leaf clusters) but UNIQUE between pairs.
 * Math.random() would reshuffle the tree on every React commit, which breaks
 * the illusion of "your" tree. mulberry32 gives us a reproducible stream from
 * a 32-bit integer seed.
 *
 * @param seed  32-bit integer (we hash daysTogether / pairId into one upstream)
 * @returns     a function () => number in [0, 1)
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    // xorshift-mix
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Hash an arbitrary string (pairId) into a 32-bit unsigned integer.
 * FNV-1a variant — good distribution for short strings.
 */
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic pick in [min, max) using a provided rng. */
export function ranged(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** Deterministic integer in [min, max] inclusive. */
export function rangedInt(rng: () => number, min: number, max: number): number {
  return Math.floor(ranged(rng, min, max + 1));
}

/** Deterministic pick from an array. */
export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)] as T;
}
