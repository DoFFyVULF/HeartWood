"use client";

import { useGender } from "@/lib/theme";
import styles from "./AmbientBackground.module.css";

interface Particle {
  emoji: string;
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
}

// Deterministic layouts (no Math.random) so SSR and hydration always match.
const NEUTRAL_PARTICLES: Particle[] = [
  { emoji: "✨", top: "12%", left: "9%", size: 22, duration: 6, delay: 0 },
  { emoji: "⭐", top: "8%", left: "84%", size: 20, duration: 7, delay: 1.2 },
  { emoji: "✨", top: "76%", left: "72%", size: 16, duration: 6.5, delay: 2 },
  { emoji: "💫", top: "70%", left: "12%", size: 24, duration: 8, delay: 0.6 },
  { emoji: "🤍", top: "88%", left: "38%", size: 18, duration: 7.5, delay: 1.8 },
  { emoji: "✨", top: "54%", left: "92%", size: 14, duration: 6, delay: 3 },
  { emoji: "⭐", top: "40%", left: "4%", size: 16, duration: 7, delay: 2.4 },
  { emoji: "🫧", top: "5%", left: "52%", size: 20, duration: 8.5, delay: 1 },
  { emoji: "🤍", top: "24%", left: "28%", size: 14, duration: 6, delay: 0.4 },
];

const BOY_PARTICLES: Particle[] = [
  { emoji: "💙", top: "14%", left: "10%", size: 22, duration: 6.5, delay: 0 },
  { emoji: "🫧", top: "9%", left: "80%", size: 20, duration: 7.5, delay: 1 },
  { emoji: "✨", top: "72%", left: "70%", size: 16, duration: 6, delay: 2.2 },
  { emoji: "🌊", top: "82%", left: "16%", size: 22, duration: 8, delay: 0.8 },
  { emoji: "🤍", top: "90%", left: "44%", size: 18, duration: 7, delay: 1.6 },
  { emoji: "✨", top: "52%", left: "94%", size: 15, duration: 6, delay: 3.1 },
  { emoji: "💧", top: "38%", left: "6%", size: 18, duration: 7.2, delay: 2.6 },
  { emoji: "☁️", top: "4%", left: "48%", size: 24, duration: 9, delay: 1.4 },
  { emoji: "💙", top: "26%", left: "26%", size: 16, duration: 6, delay: 0.6 },
];

const GIRL_PARTICLES: Particle[] = [
  { emoji: "💗", top: "12%", left: "12%", size: 22, duration: 6.5, delay: 0 },
  { emoji: "🌸", top: "8%", left: "78%", size: 20, duration: 7.5, delay: 1 },
  { emoji: "✨", top: "74%", left: "68%", size: 16, duration: 6, delay: 2.2 },
  { emoji: "🎀", top: "84%", left: "18%", size: 20, duration: 8, delay: 0.8 },
  { emoji: "🤍", top: "90%", left: "46%", size: 18, duration: 7, delay: 1.6 },
  { emoji: "💖", top: "50%", left: "94%", size: 18, duration: 6, delay: 3.1 },
  { emoji: "✨", top: "36%", left: "5%", size: 15, duration: 7.2, delay: 2.6 },
  { emoji: "🫧", top: "4%", left: "50%", size: 22, duration: 9, delay: 1.4 },
  { emoji: "💗", top: "24%", left: "30%", size: 16, duration: 6, delay: 0.6 },
];

function ParticlesFor(gender: "boy" | "girl" | null): Particle[] {
  if (gender === "boy") return BOY_PARTICLES;
  if (gender === "girl") return GIRL_PARTICLES;
  return NEUTRAL_PARTICLES;
}

export function AmbientBackground() {
  const { gender } = useGender();
  const particles = ParticlesFor(gender);

  const layers = [
    { name: styles.bgNeutral, visible: true },
    { name: styles.bgBoy, visible: gender === "boy" },
    { name: styles.bgGirl, visible: gender === "girl" },
  ];

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {layers.map((layer) => (
        <div
          key={layer.name}
          className={`${layer.name} absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            layer.visible ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Soft colour blobs that drift lazily and re-tint with the theme. */}
      <div className={styles.blob} style={{ top: "6%", left: "-8%", animationDuration: "26s" }} />
      <div
        className={styles.blob}
        style={{ top: "58%", left: "72%", animationDuration: "32s", animationDelay: "-8s" }}
      />
      <div
        className={styles.blob}
        style={{ top: "-12%", left: "46%", animationDuration: "36s", animationDelay: "-14s" }}
      />

      {/* Floating emoji, chosen to match the active palette. */}
      {particles.map((particle, index) => (
        <span
          key={index}
          className={styles.particle}
          style={{
            top: particle.top,
            left: particle.left,
            fontSize: particle.size,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        >
          {particle.emoji}
        </span>
      ))}
    </div>
  );
}
