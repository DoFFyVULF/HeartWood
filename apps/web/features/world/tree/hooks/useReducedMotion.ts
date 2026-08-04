'use client';
import { useEffect, useState } from 'react';

export function useReducedMotion(prop?: boolean): boolean {
  const [system, setSystem] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
   
    const t = setTimeout(() => setSystem(mq.matches), 0);
    const onChange = (e: MediaQueryListEvent) => setSystem(e.matches);
    mq.addEventListener('change', onChange);
    return () => {
      clearTimeout(t);
      mq.removeEventListener('change', onChange);
    };
  }, []);
  return prop ?? system;
}