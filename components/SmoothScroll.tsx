'use client';
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { useReveal } from '@/hooks/use-reveal';

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Momentum scrolling (Lenis) plus the reveal engine. Lenis is skipped entirely
 * under reduced-motion or coarse pointers, where native scrolling already
 * feels right. Exposes `window.__lenis` so anchor jumps can route through the
 * smooth scroller when it is active.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  useReveal();

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (reduced || coarse) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;
    window.__lenis = lenis;

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
      lenisRef.current = null;
      delete window.__lenis;
    };
  }, []);

  return <>{children}</>;
}
