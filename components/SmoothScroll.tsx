'use client';
import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReveal } from '@/hooks/use-reveal';
import { prefersReducedMotion } from '@/lib/motion';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

/**
 * Momentum scrolling (Lenis) harmonized with GSAP ScrollTrigger.
 * Synchronizes the GSAP animation ticker directly with the Lenis RAF loop,
 * ensuring zero jitter, frame-accurate scrub and buttery editorial scroll.
 * Skipped entirely on reduced-motion or coarse pointers.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  useReveal();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    if (coarse) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.2,
    });
    lenisRef.current = lenis;
    window.__lenis = lenis;

    // Connect Lenis scroll events to GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Bind Lenis RAF to the GSAP unified ticker
    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      lenisRef.current = null;
      delete window.__lenis;
    };
  }, []);

  return <>{children}</>;
}
