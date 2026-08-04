"use client";

import { useGender } from "@/lib/theme";
import styles from "./WorldArt.module.css";
import motion from "@/components/motion.module.css";

// The living core of "your world": a pulsing heart, two orbiting mini-hearts
// and twinkling sparkles. Everything is filled from theme CSS variables, so
// the whole sculpture re-tints in place when the gender changes.
export function WorldArt() {
  const { gender } = useGender();
  const sparkleColor = gender === "girl" ? "#f9a8d4" : gender === "boy" ? "#93c5fd" : "#c4b5fd";
  const sparkles = [
    { x: 42, y: 52, scale: 0.5, delay: 0 },
    { x: 158, y: 58, scale: 0.4, delay: 0.8 },
    { x: 46, y: 140, scale: 0.38, delay: 1.6 },
    { x: 160, y: 132, scale: 0.45, delay: 0.4 },
  ];

  return (
    <svg
      viewBox="0 0 200 200"
      className="size-[min(60vw,20rem)] drop-shadow-2xl"
      role="img"
      aria-label="Живое сердце вашей связи"
    >
      <defs>
        <radialGradient id="hwd-core-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--hwd-glow)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="hwd-core-heart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--hwd-primary)" />
          <stop offset="100%" stopColor="var(--hwd-primary-deep)" />
        </linearGradient>
        <path
          id="hwd-heart-path"
          d="M12,21.35l-1.45,-1.32C5.4,15.36 2,12.28 2,8.5 2,5.42 4.42,3 7.5,3c1.74,0 3.41,0.81 4.5,2.09C13.09,3.81 14.76,3 16.5,3 19.58,3 22,5.42 22,8.5c0,3.78 -3.4,6.86 -8.55,11.54L12,21.35z"
        />
        <path
          id="hwd-sparkle-path"
          d="M12,0C13,6 18,11 24,12C18,13 13,18 12,24C11,18 6,13 0,12C6,11 11,6 12,0z"
        />
      </defs>

      {/* Soft halo behind the core */}
      <circle cx="100" cy="100" r="88" fill="url(#hwd-core-glow)" className={motion.pulse} />

      {/* Orbit with two mini-hearts spinning around the core */}
      <g className={styles.orbit}>
        <circle
          cx="100"
          cy="100"
          r="74"
          fill="none"
          stroke="var(--hwd-glow)"
          strokeWidth="1.5"
          strokeDasharray="2 7"
        />
        <g transform="translate(100,26) scale(0.55) translate(-12,-12)">
          <use href="#hwd-heart-path" fill="var(--hwd-primary)" opacity="0.9" />
        </g>
        <g transform="translate(100,174) scale(0.55) translate(-12,-12)">
          <use href="#hwd-heart-path" fill="var(--hwd-primary)" opacity="0.35" />
        </g>
      </g>

      {/* The main heart */}
      <g
        transform="translate(100,102) scale(3.1) translate(-12,-12)"
        style={{ filter: "drop-shadow(0 12px 22px var(--hwd-glow))" }}
      >
        <use href="#hwd-heart-path" fill="url(#hwd-core-heart)" className={motion.pulse} />
      </g>

      {/* Twinkling sparkles */}
      <g fill={sparkleColor}>
        {sparkles.map((s, index) => (
          <g key={index} transform={`translate(${s.x},${s.y}) scale(${s.scale})`}>
            <use
              href="#hwd-sparkle-path"
              className={styles.twinkle}
              style={{ animationDelay: `${s.delay}s` }}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}
