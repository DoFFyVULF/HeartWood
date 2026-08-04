'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { mulberry32 } from '../lib/random';
import { MAX_PARTICLES } from '../config/stages';

export type ParticleKind = 'pollen' | 'petal' | 'leaf' | 'snow' | 'firefly' | 'raindrop' | 'spark';

export interface Particle {
  id: number; alive: boolean; kind: ParticleKind;
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number;
  rot: number; vrot: number; phase: number; color: string;
  wobbleAmp: number; wobbleFreq: number;
}

export interface ParticleSystemConfig {
  kind: ParticleKind; rate: number; bounds: { w: number; h: number };
  colors: string[]; paused: boolean; speedScale: number; seed: number;
}

function makeParticle(id: number): Particle {
  return {
    id, alive: false, kind: 'pollen', x: 0, y: 0, vx: 0, vy: 0,
    life: 0, maxLife: 1, size: 2, rot: 0, vrot: 0, phase: 0, color: '#fff',
    wobbleAmp: 1, wobbleFreq: 1,
  };
}

export function useParticles(cfg: ParticleSystemConfig): Particle[] {
  const [snapshot, setSnapshot] = useState<Particle[]>(() =>
    Array.from({ length: MAX_PARTICLES }, (_, i) => makeParticle(i)));

  const storeRef = useRef<Particle[]>(snapshot);
  const cfgRef = useRef(cfg);
  useEffect(() => { cfgRef.current = cfg; });

  const spawnAccumRef = useRef(0);
  const cursorRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    if (cfg.paused) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null; lastTsRef.current = null;
      return;
    }
    const rng = mulberry32(cfg.seed ^ 0x9e3779b9);

    const spawnOne = (kind: ParticleKind, colors: string[], w: number, h: number): Particle => {
      const p = storeRef.current[cursorRef.current]!;
      cursorRef.current = (cursorRef.current + 1) % MAX_PARTICLES;
      const fromTop = kind === 'snow' || kind === 'raindrop' || kind === 'leaf' || kind === 'petal';
      const x = rng() * w;
      const y = fromTop ? -10 - rng() * 60 : rng() * h * 0.85;
      const color = colors[Math.floor(rng() * colors.length)] ?? '#fff';
      const base: Particle = {
        ...p, alive: true, kind, x, y,
        rot: rng() * Math.PI * 2, phase: rng(), color,
        vx: 0, vy: 0, vrot: 0, life: 1, maxLife: 1, size: 2,
        wobbleAmp: 0.5 + rng() * 1.5, wobbleFreq: 0.6 + rng() * 1.2,
      };
      switch (kind) {
        case 'pollen':
          base.vx = (rng() - 0.5) * 12; base.vy = (rng() - 0.5) * 6 - 4;
          base.maxLife = 4 + rng() * 3; base.size = 1.5 + rng() * 1.5; break;
        case 'petal':
          base.vx = (rng() - 0.5) * 25; base.vy = 14 + rng() * 16;
          base.vrot = (rng() - 0.5) * 2.5; base.maxLife = 7 + rng() * 4;
          base.size = 4 + rng() * 3; base.wobbleAmp = 15 + rng() * 20; base.wobbleFreq = 0.8 + rng() * 0.8; break;
        case 'leaf':
          base.vx = (rng() - 0.5) * 35; base.vy = 18 + rng() * 20;
          base.vrot = (rng() - 0.5) * 3.0; base.maxLife = 8 + rng() * 5;
          base.size = 5 + rng() * 5; base.wobbleAmp = 20 + rng() * 25; base.wobbleFreq = 0.5 + rng() * 0.7; break;
        case 'snow':
          base.vx = (rng() - 0.5) * 10; base.vy = 10 + rng() * 16;
          base.vrot = (rng() - 0.5) * 0.8; base.maxLife = 10 + rng() * 6;
          base.size = 1.5 + rng() * 3; base.wobbleAmp = 8 + rng() * 14; base.wobbleFreq = 0.4 + rng() * 0.6; break;
        case 'firefly':
          base.vx = (rng() - 0.5) * 10; base.vy = (rng() - 0.5) * 8;
          base.maxLife = 6 + rng() * 6; base.size = 2 + rng() * 2; break;
        case 'raindrop':
          base.vx = -6 - rng() * 4; base.vy = 260 + rng() * 120;
          base.maxLife = 1.2 + rng() * 0.5; base.size = 1.0 + rng() * 0.8; break;
        case 'spark':
          base.vx = (rng() - 0.5) * 80; base.vy = (rng() - 0.5) * 80;
          base.vrot = (rng() - 0.5) * 4; base.maxLife = 0.9 + rng() * 0.5; base.size = 2 + rng() * 2; break;
      }
      base.life = base.maxLife;
      return base;
    };

    const step = (ts: number) => {
      const c = cfgRef.current;
      const last = lastTsRef.current ?? ts;
      const dt = Math.min(0.05, (ts - last) / 1000);
      lastTsRef.current = ts;
      const speed = c.speedScale;

      spawnAccumRef.current += c.rate * dt;
      while (spawnAccumRef.current >= 1) {
        storeRef.current[cursorRef.current] = spawnOne(c.kind, c.colors, c.bounds.w, c.bounds.h);
        cursorRef.current = (cursorRef.current + 1) % MAX_PARTICLES;
        spawnAccumRef.current -= 1;
      }

      for (let i = 0; i < storeRef.current.length; i++) {
        const p = storeRef.current[i]!;
        if (!p.alive) continue;
        p.life -= dt;
        if (p.life <= 0 || p.y > c.bounds.h + 30 || p.x < -50 || p.x > c.bounds.w + 50) { p.alive = false; continue; }
        switch (p.kind) {
          case 'firefly':
            p.vx += (Math.sin(ts / 700 + p.phase * 6.28) * 6 - p.vx * 0.6) * dt;
            p.vy += (Math.cos(ts / 900 + p.phase * 6.28) * 4 - p.vy * 0.6) * dt;
            p.x += p.vx * speed * dt; p.y += p.vy * speed * dt; break;
          case 'pollen':
            p.vx += Math.sin(ts / 600 + p.phase * 6.28) * 8 * dt;
            p.x += p.vx * speed * dt; p.y += p.vy * speed * dt; break;
          case 'petal': {
            const w = Math.sin(ts / (500 / p.wobbleFreq) + p.phase * 6.28) * p.wobbleAmp;
            p.vx += (w - p.vx * 1.5) * dt;
            p.x += p.vx * speed * dt; p.y += p.vy * speed * dt;
            p.rot += p.vrot * speed * dt; p.vy += Math.sin(ts / 300 + p.phase * 3.14) * 3 * dt; break;
          }
          case 'leaf': {
            const w = Math.sin(ts / (600 / p.wobbleFreq) + p.phase * 6.28) * p.wobbleAmp;
            p.vx += (w - p.vx * 1.2) * dt;
            p.x += p.vx * speed * dt; p.y += p.vy * speed * dt;
            p.rot += p.vrot * speed * dt * (1 + Math.sin(ts / 400 + p.phase * 3) * 0.5);
            if (Math.sin(ts / 1200 + p.phase * 12) > 0.9) p.vy *= 0.98; break;
          }
          case 'snow': {
            const w = Math.sin(ts / (900 / p.wobbleFreq) + p.phase * 6.28) * p.wobbleAmp;
            p.vx += (w - p.vx * 2.0) * dt;
            p.x += p.vx * speed * dt; p.y += p.vy * speed * dt;
            p.rot += p.vrot * speed * dt; p.vy += Math.sin(ts / 2000 + p.phase * 4) * 2 * dt; break;
          }
          case 'raindrop':
            p.x += p.vx * speed * dt; p.y += p.vy * speed * dt; break;
          case 'spark':
            p.vy += 60 * dt; p.x += p.vx * speed * dt; p.y += p.vy * speed * dt;
            p.rot += p.vrot * speed * dt; break;
        }
      }

      frameCountRef.current++;
      if (frameCountRef.current % 2 === 0) setSnapshot(storeRef.current.map((p) => ({ ...p })));
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null; lastTsRef.current = null;
    };
  }, [cfg.kind, cfg.rate, cfg.colors, cfg.bounds.w, cfg.bounds.h, cfg.paused, cfg.speedScale, cfg.seed]);

  return useMemo(() => snapshot, [snapshot]);
}